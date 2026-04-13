"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

type Row = { id: number; name: string; avg_rank: number; vote_count: number };

export default function ResultsList({
  initialResults,
  initialTotal,
}: {
  initialResults: Row[];
  initialTotal: number;
}) {
  const [results, setResults] = useState(initialResults);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("rankings-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rankings" }, async () => {
        const [{ data: r }, { data: t }] = await Promise.all([
          supabaseBrowser.from("ticket_results").select("*"),
          supabaseBrowser.from("total_voters").select("count").single(),
        ]);
        if (r) setResults(r as Row[]);
        if (t) setTotal((t as { count: number }).count);
      })
      .subscribe();
    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, []);

  const sorted = [...results].sort((a, b) => Number(a.avg_rank) - Number(b.avg_rank));

  return (
    <div className="max-w-md mx-auto p-4">
      <header className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Crimson Markets</h1>
        <div className="text-sm text-neutral-600">{total} students</div>
      </header>
      <p className="text-neutral-600 text-sm mb-1">HUA Co-Presidents 2026</p>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-neutral-500">Voting closes Fri 4/17, 11:59pm</p>
        <Link href="/rank" className="text-xs text-red-700 font-medium hover:underline">
          Submit your ranking
        </Link>
      </div>

      <div className="space-y-2">
        {sorted.map((row, i) => (
          <div key={row.id} className="flex items-center gap-3 bg-white border rounded-xl p-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-sm">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium">{row.name}</div>
              <div className="text-xs text-neutral-500">{row.vote_count} votes</div>
            </div>
            <div className="text-sm font-mono text-neutral-700">avg {Number(row.avg_rank).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
