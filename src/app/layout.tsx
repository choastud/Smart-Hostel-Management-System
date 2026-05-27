import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AIProvider } from "@/context/AIContext";
import ChatbotButton from "@/components/ChatbotButton";

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
    <AIProvider apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''}>

  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-outfit)] bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {children}<ChatbotButton />
      </body>
    </html>
    </AIProvider>
  );
}
