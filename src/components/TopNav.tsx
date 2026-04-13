"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary font-headline">
            Crimson Markets
          </Link>
          <div className="hidden md:flex gap-6">
            <Link 
              href="/" 
              className={`pb-1 font-medium transition-opacity ${pathname === '/' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate-600 hover:text-primary'}`}
            >
              Markets
            </Link>
            <Link 
              href="#" 
              className={`pb-1 font-medium transition-opacity ${pathname === '/activity' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate-600 hover:text-primary'}`}
            >
              Activity
            </Link>
            <Link 
              href="/rank" 
              className={`pb-1 font-medium transition-opacity ${pathname === '/rank' ? 'text-primary border-b-2 border-primary font-bold' : 'text-slate-600 hover:text-primary'}`}
            >
              Rankings
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-600 font-label text-xs tracking-wider uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
             <span className="hidden sm:inline">SIGN OUT</span>
             <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
             </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
