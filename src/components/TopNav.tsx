"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm">
      <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-headline">
            Crimson Markets
          </Link>
          <div className="hidden md:flex gap-6">
            <Link
              href="/"
              className={`pb-1 font-body font-medium text-sm transition-colors ${pathname === '/' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
            >
              Markets
            </Link>
            <Link
              href="#"
              className="pb-1 font-body font-medium text-sm text-slate hover:text-primary transition-colors"
            >
              Activity
            </Link>
            <Link
              href="/rank"
              className={`pb-1 font-body font-medium text-sm transition-colors ${pathname === '/rank' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
            >
              Rankings
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline font-label text-xs tracking-wider uppercase text-slate">Sign Out</span>
          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-slate text-xl">account_circle</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
