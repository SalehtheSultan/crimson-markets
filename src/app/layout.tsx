import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata = { title: "Crimson Markets" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-neutral-50 text-neutral-900 min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
