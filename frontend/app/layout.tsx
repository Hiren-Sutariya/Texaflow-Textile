import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Business Monitoring — DigiScale ERP",
  description: "Production-grade ERP & Business Operating System for Embroidery Manufacturing and Job Work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased light">
      <body className={`${inter.className} h-full bg-slate-50 flex flex-col`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
