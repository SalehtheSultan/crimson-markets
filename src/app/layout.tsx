import "./globals.css";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Crimson Markets",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700;0,6..72,800;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-charcoal font-body antialiased min-h-screen flex flex-col">
        <TopNav />

        <main className="flex-grow pt-18 md:pt-24 pb-16 md:pb-20">
          {children}
        </main>

        <footer className="w-full py-8 md:py-12 border-t border-outline-variant bg-surface-container-low mt-auto">
          <div className="flex flex-col items-center gap-4 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link href="#" className="font-body text-[10px] md:text-xs tracking-wider uppercase text-slate hover:text-primary transition-colors">About</Link>
              <Link href="#" className="font-body text-[10px] md:text-xs tracking-wider uppercase text-slate hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="font-body text-[10px] md:text-xs tracking-wider uppercase text-slate hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="font-body text-[10px] md:text-xs tracking-wider uppercase font-bold text-primary hover:text-primary-container transition-colors">Harvard University</Link>
            </div>
            <div className="font-body text-[10px] md:text-xs tracking-wider uppercase text-slate">
              &copy; 2025 Crimson Markets. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
