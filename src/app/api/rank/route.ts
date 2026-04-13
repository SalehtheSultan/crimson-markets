import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, rankings } = (await req.json()) as {
    email: string;
    rankings: { ticketId: number; rank: number }[];
  };

  // Validate email domain
  if (!email || !email.endsWith("@college.harvard.edu")) {
    return NextResponse.json({ error: "Must use a @college.harvard.edu email" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate: must be exactly 7 entries, ranks 1..7 unique, ticketIds unique
  if (!Array.isArray(rankings) || rankings.length !== 7) {
    return NextResponse.json({ error: "Must rank all 7 tickets" }, { status: 400 });
  }
  const ranks = rankings.map((r) => r.rank).sort();
  const ids = new Set(rankings.map((r) => r.ticketId));
  if (ranks.join(",") !== "1,2,3,4,5,6,7" || ids.size !== 7) {
    return NextResponse.json({ error: "Invalid ranking" }, { status: 400 });
  }

  // Reject if already ranked (one-shot)
  const { count } = await supabaseAdmin
    .from("rankings")
    .select("*", { count: "exact", head: true })
    .eq("email", normalizedEmail);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "This email has already submitted a ranking" }, { status: 409 });
  }

  const rows = rankings.map((r) => ({
    email: normalizedEmail,
    ticket_id: r.ticketId,
    rank: r.rank,
  }));
  const { error } = await supabaseAdmin.from("rankings").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
