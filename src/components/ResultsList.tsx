"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { config } from "@/lib/config";
import Link from "next/link";

type Row = { id: number; name: string; avg_rank: number; vote_count: number; first_place_count: number };

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
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      {/* Header */}
      <header className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant pb-6 md:pb-8">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
              <span className="inline-block w-2.5 h-2.5 bg-primary rounded-full live-pulse"></span>
              <span className="font-label text-xs md:text-sm uppercase tracking-wider text-primary font-bold">Live Results</span>
              <span className="font-label text-[10px] uppercase tracking-widest text-slate bg-surface-container px-2 py-0.5 rounded-full">Anonymous</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-headline font-bold text-charcoal tracking-tight leading-none mb-3 md:mb-4">
              {config.electionTitle}
            </h1>
            <p className="text-base md:text-lg text-slate font-headline italic">
              Voting closes {config.votingDeadline}
            </p>
          </div>
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0">
            <div className="bg-surface-container-low rounded-[8px] px-4 md:px-6 py-3 md:py-4 flex flex-row md:flex-col items-center md:items-end gap-2 md:gap-0 text-right min-w-[120px]">
              <span className="text-3xl md:text-4xl font-headline font-extrabold text-primary">{total}</span>
              <span className="font-label text-[11px] leading-tight uppercase tracking-[0.1em] md:tracking-[0.15em] text-slate font-bold md:mt-1">
                Students Voted
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CTA Banner */}
      <div className="mb-8 bg-gradient-to-r from-primary to-primary-container rounded-[8px] p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-headline font-bold text-lg md:text-xl text-on-primary mb-1">Have you ranked yet?</h3>
          <p className="text-on-primary/80 text-sm">Submit your prediction — it only takes 30 seconds.</p>
        </div>
        <Link href="/rank"
          className="shrink-0 bg-paper text-primary font-headline font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 text-sm md:text-base">
          Rank Now
        </Link>
      </div>

      {/* Desktop Table Header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 px-6 py-2 mb-1">
        <div className="col-span-1 text-slate font-label text-xs uppercase tracking-widest font-bold">Rank</div>
        <div className="col-span-7 text-slate font-label text-xs uppercase tracking-widest font-bold">Ticket Name</div>
        <div className="col-span-2 text-right text-slate font-label text-xs uppercase tracking-widest font-bold">#1 Votes</div>
        <div className="col-span-2 text-right text-slate font-label text-xs uppercase tracking-widest font-bold">Avg Place</div>
      </div>

      {/* Ticket Cards */}
      <div className="space-y-3">
        {sorted.map((row, i) => {
          const getBadgeStyle = (index: number) => {
            if (index === 0) return "bg-primary text-on-primary ring-2 ring-primary/30 ring-offset-2";
            if (index < 3) return "bg-primary text-on-primary";
            if (index === 3) return "bg-primary/80 text-on-primary";
            if (index === 4) return "bg-primary/70 text-on-primary";
            if (index === 5) return "bg-primary/60 text-on-primary";
            return "bg-primary/50 text-on-primary";
          };
          const isLeader = i === 0;
          return (
            <div key={row.id}
              className={`bg-paper hover:bg-surface-container-low transition-colors rounded-[8px] shadow-sm group border hover:border-primary/10
                ${isLeader ? "border-primary/20 shadow-md ring-1 ring-primary/10" : "border-transparent"}`}
            >
              {/* Mobile layout */}
              <div className="flex md:hidden items-start gap-3 p-4">
                <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-headline text-lg font-bold ${getBadgeStyle(i)}`}>
                  {i + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className={`font-headline font-bold leading-snug mb-1.5 ${isLeader ? "text-lg text-primary" : "text-base text-charcoal"}`}>
                    {row.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate font-medium">{row.first_place_count} &#x2116;1</span>
                    <span className="font-mono text-sm text-primary font-medium">avg {Number(row.avg_rank).toFixed(2)}</span>
                  </div>
                </div>
                {isLeader && (
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">trending_up</span>
                )}
              </div>

              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-12 items-center px-6 py-5">
                <div className="col-span-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-headline text-xl font-bold ${getBadgeStyle(i)}`}>
                    {i + 1}
                  </div>
                </div>
                <div className="col-span-7 flex items-center gap-2">
                  <h3 className={`font-headline font-bold group-hover:text-primary transition-colors ${isLeader ? "text-2xl text-primary" : "text-xl text-charcoal"}`}>
                    {row.name}
                  </h3>
                  {isLeader && (
                    <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                  )}
                </div>
                <div className="col-span-2 text-right flex flex-col items-end">
                  <span className={`font-headline font-bold text-charcoal ${isLeader ? "text-xl" : "text-lg"}`}>{row.first_place_count}</span>
                  <span className="block text-[10px] uppercase text-slate font-bold tracking-tighter">#1 Votes</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`font-mono text-primary font-medium ${isLeader ? "text-base" : ""}`}>avg {Number(row.avg_rank).toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* About Section */}
      <section className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-surface-container-low rounded-[8px] p-6 md:p-8">
          <h4 className="font-headline font-bold text-xl md:text-2xl mb-3 md:mb-4 text-primary">About the Markets</h4>
          <p className="text-slate leading-relaxed text-sm md:text-base">
            Crimson Markets aggregates real-time student predictions to forecast HUA election outcomes. All rankings are anonymous &mdash; only aggregate results are displayed publicly. Your email is used solely to verify your Harvard affiliation and prevent duplicate submissions.
          </p>
        </div>
        <div className="relative rounded-[8px] overflow-hidden min-h-[180px] md:min-h-[200px]">
          <img
            alt="Harvard Memorial Hall"
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-30"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8nOmeDxS7-q3jZcVFZpgrCk_xfx4SCL-wJ0Xg9o8qHWL8FJbf4XlCJMc8wWSxk-TBFrDqUcXq_MjZUvFJbtQtDAaXeceGEeb6HPmyGmFlIHH9Diwh4obEK0sO4kDF-PaU6KnquF891uikBxsjJb0czfNSr7i9SsNn9VwXSo-K2v_ClXM6RoR6-4OecxI2LKyKWi-UjzPITpX4xcwXBJCSH7RvkJkG3koLPESlTWiFmP0naR2lKnv0PpkPhKVoVYGIyfW5fWemHQ"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent flex items-center justify-center p-6 md:p-8">
            <div className="text-center z-10">
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary mb-2">analytics</span>
              <p className="text-charcoal font-headline italic font-semibold text-base md:text-lg">&ldquo;The ultimate polling tool.&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Anonymous Notice */}
      <div className="mt-6 md:mt-8 mb-4 text-center">
        <p className="text-[10px] md:text-xs text-slate font-label uppercase tracking-widest">
          <span className="material-symbols-outlined text-[10px] md:text-xs align-middle mr-1">shield</span>
          All predictions are anonymous
        </p>
      </div>
    </div>
  );
}
