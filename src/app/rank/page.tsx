import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RankingForm from "@/components/RankingForm";

export default async function RankPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { count } = await supabaseAdmin
    .from("rankings").select("*", { count: "exact", head: true }).eq("clerk_user_id", userId);
  if ((count ?? 0) > 0) redirect("/");

  const { data: tickets } = await supabaseAdmin
    .from("tickets").select("id, name, platform_url").order("display_order");

  return <RankingForm tickets={tickets ?? []} />;
}
