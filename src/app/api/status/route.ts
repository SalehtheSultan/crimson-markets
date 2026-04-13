import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ hasRanked: false });

  const { count } = await supabaseAdmin
    .from("rankings")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase().trim());

  return NextResponse.json({ hasRanked: (count ?? 0) > 0 });
}
