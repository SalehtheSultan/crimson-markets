import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`status:${ip}`, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawEmail = req.nextUrl.searchParams.get("email");
  if (!rawEmail) return NextResponse.json({ hasRanked: false, rankings: [] });

  const result = validateEmail(rawEmail);
  if (!result.ok) {
    return NextResponse.json({ hasRanked: false, rankings: [] });
  }

  const { data: rankings } = await supabaseAdmin
    .from("rankings")
    .select("ticket_id, rank")
    .eq("email", result.email)
    .order("rank");

  return NextResponse.json({
    hasRanked: (rankings?.length ?? 0) > 0,
    rankings: rankings ?? [],
  });
}
