import "./globals.css";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata = { title: "Crimson Markets" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700;0,6..72,800;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col">
        <TopNav />

        <main className="flex-grow pt-24 pb-20">
          {children}
        </main>

        <footer className="w-full py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center px-8 gap-4 max-w-7xl mx-auto">
            <div className="font-body text-xs tracking-wider uppercase text-slate-500 dark:text-slate-500">
                © 2024 Crimson Markets. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="font-body text-xs tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-red-800 dark:hover:text-red-400 transition-colors">About</Link>
              <Link href="#" className="font-body text-xs tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-red-800 dark:hover:text-red-400 transition-colors">Privacy</Link>
              <Link href="#" className="font-body text-xs tracking-wider uppercase text-slate-500 dark:text-slate-500 hover:text-red-800 dark:hover:text-red-400 transition-colors">Terms</Link>
              <Link href="#" className="font-body text-xs tracking-wider uppercase font-bold text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-400 transition-colors">Harvard University</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
