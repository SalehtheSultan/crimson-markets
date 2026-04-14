"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm">
      <div className="flex justify-between items-center px-4 md:px-6 h-14 md:h-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-primary font-headline">
            Crimson Markets
          </Link>
          <span className="hidden sm:inline text-[9px] md:text-[10px] font-label uppercase tracking-[0.15em] text-slate border border-outline-variant px-1.5 py-0.5 rounded">
            The ultimate polling tool
          </span>
        </div>
        <div className="flex gap-4 md:gap-6">
          <Link
            href="/"
            className={`pb-1 font-body font-medium text-xs md:text-sm transition-colors ${pathname === '/' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
          >
            Markets
          </Link>
          <Link
            href="/rank"
            className={`pb-1 font-body font-medium text-xs md:text-sm transition-colors ${pathname === '/rank' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
          >
            Rank
          </Link>
        </div>
      </div>
    </nav>
  );
}
