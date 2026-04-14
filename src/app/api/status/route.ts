import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { config } from "@/lib/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Rate limit by IP: 20 checks per minute
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`status:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ hasRanked: false, rankings: [] });

  // Sanitize and validate email
  const sanitized = email.toLowerCase().trim();
  if (!sanitized.endsWith(`@${config.allowedEmailDomain}`) || sanitized.length > 254) {
    return NextResponse.json({ hasRanked: false, rankings: [] });
  }

  const { data: rankings } = await supabaseAdmin
    .from("rankings")
    .select("ticket_id, rank")
    .eq("email", sanitized)
    .order("rank");

  return NextResponse.json({
    hasRanked: (rankings?.length ?? 0) > 0,
    rankings: rankings ?? [],
  });
}
