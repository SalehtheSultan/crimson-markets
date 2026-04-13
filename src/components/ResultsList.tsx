"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { config } from "@/lib/config";
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
    <div className="max-w-5xl mx-auto px-6">
      {/* Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block w-2.5 h-2.5 bg-primary rounded-full live-pulse"></span>
              <span className="font-label text-sm uppercase tracking-wider text-primary font-bold">Live Results</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-charcoal tracking-tight leading-none mb-4">
              {config.electionTitle}
            </h1>
            <p className="text-lg text-slate font-headline italic">
              Voting closes {config.votingDeadline}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-[8px] px-6 py-4 flex flex-col items-end text-right min-w-[150px]">
            <span className="text-4xl font-headline font-extrabold text-primary">{total}</span>
            <span className="font-label text-[11px] leading-tight uppercase tracking-[0.15em] text-slate font-bold mt-1">
              Total Students<br />Voted
            </span>
          </div>
        </div>
      </header>

      {/* Ranking Table */}
      <div className="space-y-3">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-2">
          <div className="col-span-1 text-slate font-label text-xs uppercase tracking-widest font-bold">Rank</div>
          <div className="col-span-7 text-slate font-label text-xs uppercase tracking-widest font-bold">Ticket Name</div>
          <div className="col-span-2 text-right text-slate font-label text-xs uppercase tracking-widest font-bold">Votes</div>
          <div className="col-span-2 text-right text-slate font-label text-xs uppercase tracking-widest font-bold">Mean</div>
        </div>

        {/* Ticket Cards */}
        {sorted.map((row, i) => {
          const getBadgeOpacity = (index: number) => {
            if (index < 3) return "bg-primary";
            if (index === 3) return "bg-primary/80";
            if (index === 4) return "bg-primary/70";
            if (index === 5) return "bg-primary/60";
            return "bg-primary/50";
          };
          return (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center bg-paper hover:bg-surface-container-low transition-colors px-6 py-5 rounded-[8px] shadow-sm group border border-transparent hover:border-primary/10"
            >
              <div className="col-span-1">
                <div className={`w-10 h-10 rounded-full text-on-primary flex items-center justify-center font-headline text-xl font-bold ${getBadgeOpacity(i)}`}>
                  {i + 1}
                </div>
              </div>
              <div className="col-span-7">
                <h3 className="text-xl font-headline font-bold text-charcoal group-hover:text-primary transition-colors">
                  {row.name}
                </h3>
              </div>
              <div className="col-span-2 text-right flex flex-col items-end">
                <span className="text-lg font-headline font-bold text-charcoal">{row.vote_count}</span>
                <span className="block text-[10px] uppercase text-slate font-bold tracking-tighter">Votes</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="font-mono text-primary font-medium">avg {Number(row.avg_rank).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low rounded-[8px] p-8">
          <h4 className="font-headline font-bold text-2xl mb-4 text-primary">About the Markets</h4>
          <p className="text-slate leading-relaxed mb-4">
            Crimson Markets uses real-time student sentiment analysis and historical voting data to predict election outcomes. These rankings are weighted by student preference data and verified HUA participation.
          </p>
          <Link href="#" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
            Read the Methodology
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="relative rounded-[8px] overflow-hidden min-h-[200px]">
          <img
            alt="Harvard Memorial Hall"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8nOmeDxS7-q3jZcVFZpgrCk_xfx4SCL-wJ0Xg9o8qHWL8FJbf4XlCJMc8wWSxk-TBFrDqUcXq_MjZUvFJbtQtDAaXeceGEeb6HPmyGmFlIHH9Diwh4obEK0sO4kDF-PaU6KnquF891uikBxsjJb0czfNSr7i9SsNn9VwXSo-K2v_ClXM6RoR6-4OecxI2LKyKWi-UjzPITpX4xcwXBJCSH7RvkJkG3koLPESlTWiFmP0naR2lKnv0PpkPhKVoVYGIyfW5fWemHQ"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent flex items-center justify-center p-8">
            <div className="text-center z-10">
              <span className="material-symbols-outlined text-4xl text-primary mb-2">analytics</span>
              <p className="text-charcoal font-headline italic font-semibold text-lg">&ldquo;A predictive tool for the modern scholar.&rdquo;</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
