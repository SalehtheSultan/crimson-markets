import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/email";
import { config } from "@/lib/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // IP-level rate limit: 10 submissions per 15 min
  const ipRL = rateLimit(`rank-ip:${ip}`, { maxRequests: 10, windowMs: 15 * 60 * 1000 });
  if (!ipRL.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email: rawEmail, code, rankings } = body as {
    email: string;
    code: string;
    rankings: { ticketId: number; rank: number }[];
  };

  // Validate and normalize email
  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const emailResult = validateEmail(rawEmail);
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 403 });
  }
  const email = emailResult.email;

  // Per-email rate limit on code attempts: 5 per 10 min (prevents brute force)
  const emailRL = rateLimit(`rank-attempts:${email}`, { maxRequests: 5, windowMs: 10 * 60 * 1000 });
  if (!emailRL.success) {
    return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }

  // Validate code format
  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // Fetch the stored code
  const { data: codeRow } = await supabaseAdmin
    .from("verification_codes")
    .select("code, expires_at, used_at")
    .eq("email", email)
    .single();

  if (!codeRow) {
    return NextResponse.json({ error: "No verification code found. Please request a new one." }, { status: 401 });
  }

  // Check if code was already used (replay prevention)
  if (codeRow.used_at) {
    return NextResponse.json({ error: "Code already used. Please request a new one." }, { status: 401 });
  }

  // Check expiry
  if (new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 401 });
  }

  // Timing-safe code comparison (prevents timing attacks)
  const storedBuf = Buffer.from(codeRow.code.padEnd(6, "0"));
  const givenBuf = Buffer.from(code.trim().padEnd(6, "0"));
  if (!crypto.timingSafeEqual(storedBuf, givenBuf)) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  // Mark code as used IMMEDIATELY (prevents replay/concurrent use)
  const { error: markError } = await supabaseAdmin
    .from("verification_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email)
    .is("used_at", null); // Only mark if not already used (atomic check)

  if (markError) {
    return NextResponse.json({ error: "Verification failed. Please request a new code." }, { status: 401 });
  }

  // Validate rankings array
  if (!Array.isArray(rankings) || rankings.length !== config.ticketCount) {
    return NextResponse.json({ error: `Must rank all ${config.ticketCount} tickets` }, { status: 400 });
  }

  for (const r of rankings) {
    if (
      typeof r.ticketId !== "number" || !Number.isInteger(r.ticketId) || r.ticketId < 1 ||
      typeof r.rank !== "number" || !Number.isInteger(r.rank) || r.rank < 1 || r.rank > config.ticketCount
    ) {
      return NextResponse.json({ error: "Invalid ranking data" }, { status: 400 });
    }
  }

  const ranks = rankings.map((r) => r.rank).sort((a, b) => a - b);
  const expectedRanks = Array.from({ length: config.ticketCount }, (_, i) => i + 1);
  const ids = new Set(rankings.map((r) => r.ticketId));
  if (ranks.join(",") !== expectedRanks.join(",") || ids.size !== config.ticketCount) {
    return NextResponse.json({ error: "Invalid ranking" }, { status: 400 });
  }

  const { data: validTickets } = await supabaseAdmin
    .from("tickets")
    .select("id")
    .in("id", rankings.map((r) => r.ticketId));
  if (!validTickets || validTickets.length !== config.ticketCount) {
    return NextResponse.json({ error: "Invalid ticket IDs" }, { status: 400 });
  }

  // Atomic upsert via Postgres function (prevents TOCTOU race condition)
  const rows = rankings.map((r) => ({
    email,
    ticket_id: r.ticketId,
    rank: r.rank,
  }));

  const { error: rpcError } = await supabaseAdmin.rpc("upsert_rankings", {
    p_email: email,
    p_rankings: rows,
  });

  if (rpcError) {
    console.error("Rankings upsert error:", rpcError.message);
    return NextResponse.json({ error: "Failed to save ranking. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
