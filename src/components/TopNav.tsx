"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav shadow-sm">
      <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto w-full">
        <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-headline">
          Crimson Markets
        </Link>
        <div className="flex gap-6">
          <Link
            href="/"
            className={`pb-1 font-body font-medium text-sm transition-colors ${pathname === '/' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
          >
            Markets
          </Link>
          <Link
            href="/rank"
            className={`pb-1 font-body font-medium text-sm transition-colors ${pathname === '/rank' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate hover:text-primary'}`}
          >
            Rankings
          </Link>
        </div>
      </div>
    </nav>
  );
}
