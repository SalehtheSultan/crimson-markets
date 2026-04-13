import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import ResultsList from "@/components/ResultsList";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { count } = await supabaseAdmin
    .from("rankings").select("*", { count: "exact", head: true }).eq("clerk_user_id", userId);
  if ((count ?? 0) === 0) redirect("/rank");

  const [{ data: results }, { data: totals }] = await Promise.all([
    supabaseAdmin.from("ticket_results").select("*"),
    supabaseAdmin.from("total_voters").select("count").single(),
  ]);

  return <ResultsList initialResults={results ?? []} initialTotal={totals?.count ?? 0} />;
}
