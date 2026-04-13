import { supabaseAdmin } from "@/lib/supabase";
import ResultsList from "@/components/ResultsList";

export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const [{ data: results }, { data: totals }] = await Promise.all([
    supabaseAdmin.from("ticket_results").select("*"),
    supabaseAdmin.from("total_voters").select("count").single(),
  ]);

  return <ResultsList initialResults={results ?? []} initialTotal={totals?.count ?? 0} />;
}
