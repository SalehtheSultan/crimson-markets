import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ hasRanked: false }, { status: 401 });

  const { count } = await supabaseAdmin
    .from("rankings")
    .select("*", { count: "exact", head: true })
    .eq("clerk_user_id", userId);

  return NextResponse.json({ hasRanked: (count ?? 0) > 0 });
}
