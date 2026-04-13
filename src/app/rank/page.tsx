import { supabaseAdmin } from "@/lib/supabase";
import RankingForm from "@/components/RankingForm";

export default async function RankPage() {
  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select("id, name, platform_url")
    .order("display_order");

  return <RankingForm tickets={tickets ?? []} />;
}
