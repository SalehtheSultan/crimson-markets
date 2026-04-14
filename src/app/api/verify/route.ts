import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { config } from "@/lib/config";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

export async function POST(req: NextRequest) {
  // Rate limit: 3 codes per email per 10 min, 10 total per IP per 10 min
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipRL = rateLimit(`verify-ip:${ip}`, { maxRequests: 10, windowMs: 10 * 60 * 1000 });
  if (!ipRL.success) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email: rawEmail } = body as { email: string };
  if (!rawEmail || typeof rawEmail !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const email = rawEmail.toLowerCase().trim();

  // Validate format and domain
  if (email.length > 254 || !email.endsWith(`@${config.allowedEmailDomain}`)) {
    return NextResponse.json({ error: `Must use a @${config.allowedEmailDomain} email` }, { status: 400 });
  }

  // Per-email rate limit
  const emailRL = rateLimit(`verify-email:${email}`, { maxRequests: 3, windowMs: 10 * 60 * 1000 });
  if (!emailRL.success) {
    return NextResponse.json({ error: "Too many codes sent. Check your inbox or try again in 10 minutes." }, { status: 429 });
  }

  // Check if already ranked
  const { count } = await supabaseAdmin
    .from("rankings")
    .select("*", { count: "exact", head: true })
    .eq("email", email);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "This email has already submitted a ranking." }, { status: 409 });
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Upsert code (one active code per email)
  const { error: dbError } = await supabaseAdmin
    .from("verification_codes")
    .upsert({ email, code, expires_at: expiresAt }, { onConflict: "email" });

  if (dbError) {
    console.error("Failed to store verification code:", dbError.message);
    return NextResponse.json({ error: "Failed to generate code. Try again." }, { status: 500 });
  }

  // Send email via Resend
  const resend = getResend();
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Crimson Markets <noreply@huaelections.com>",
    to: email,
    subject: `Your Crimson Markets code: ${code}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #A51C30; font-size: 24px; margin-bottom: 8px;">Crimson Markets</h1>
        <p style="color: #64748B; font-size: 14px; margin-bottom: 32px;">HUA Co-Presidents 2026 Prediction</p>
        <p style="color: #1E293B; font-size: 16px; margin-bottom: 16px;">Your verification code is:</p>
        <div style="background: #F8FAFC; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #A51C30;">${code}</span>
        </div>
        <p style="color: #64748B; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Failed to send verification email:", emailError);
    return NextResponse.json({ error: "Failed to send email. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
