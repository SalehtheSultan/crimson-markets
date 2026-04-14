import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { config } from "@/lib/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Rate limit by IP: 5 submissions per 15 minutes
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`rank:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
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

  // Validate email
  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  const email = rawEmail.toLowerCase().trim();
  if (!email.endsWith(`@${config.allowedEmailDomain}`)) {
    return NextResponse.json({ error: `Must use a @${config.allowedEmailDomain} email` }, { status: 403 });
  }

  // Validate code format
  if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // Verify the code against the database
  const { data: codeRow } = await supabaseAdmin
    .from("verification_codes")
    .select("code, expires_at")
    .eq("email", email)
    .single();

  if (!codeRow || codeRow.code !== code.trim()) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
  }

  if (new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 401 });
  }

  // Validate rankings array
  if (!Array.isArray(rankings) || rankings.length !== config.ticketCount) {
    return NextResponse.json({ error: `Must rank all ${config.ticketCount} tickets` }, { status: 400 });
  }

  // Validate each entry is a safe integer
  for (const r of rankings) {
    if (
      typeof r.ticketId !== "number" || !Number.isInteger(r.ticketId) || r.ticketId < 1 ||
      typeof r.rank !== "number" || !Number.isInteger(r.rank) || r.rank < 1 || r.rank > config.ticketCount
    ) {
      return NextResponse.json({ error: "Invalid ranking data" }, { status: 400 });
    }
  }

  // Validate uniqueness of ranks and ticket IDs
  const ranks = rankings.map((r) => r.rank).sort((a, b) => a - b);
  const expectedRanks = Array.from({ length: config.ticketCount }, (_, i) => i + 1);
  const ids = new Set(rankings.map((r) => r.ticketId));
  if (ranks.join(",") !== expectedRanks.join(",") || ids.size !== config.ticketCount) {
    return NextResponse.json({ error: "Invalid ranking" }, { status: 400 });
  }

  // Validate ticket IDs exist in database
  const { data: validTickets } = await supabaseAdmin
    .from("tickets")
    .select("id")
    .in("id", rankings.map((r) => r.ticketId));
  if (!validTickets || validTickets.length !== config.ticketCount) {
    return NextResponse.json({ error: "Invalid ticket IDs" }, { status: 400 });
  }

  // Delete any existing rankings for this email (allows edits)
  await supabaseAdmin.from("rankings").delete().eq("email", email);

  // Insert new rankings
  const rows = rankings.map((r) => ({
    email,
    ticket_id: r.ticketId,
    rank: r.rank,
  }));
  const { error } = await supabaseAdmin.from("rankings").insert(rows);
  if (error) {
    console.error("Rankings insert error:", error.message);
    return NextResponse.json({ error: "Failed to save ranking. Please try again." }, { status: 500 });
  }

  // Clean up verification code
  await supabaseAdmin.from("verification_codes").delete().eq("email", email);

  return NextResponse.json({ ok: true });
}
