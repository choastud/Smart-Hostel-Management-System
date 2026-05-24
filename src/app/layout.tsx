import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AuraHost - Smart Hostel Management System",
  description: "A modern digital hostel ecosystem for colleges and universities to automate room allocations, visitor entry logs, QR attendance, complaints and payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-outfit)] bg-brand-beige text-slate-800 dark:bg-brand-charcoal dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
