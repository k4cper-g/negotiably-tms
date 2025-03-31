import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexClerkClientProvider } from "@/providers/ConvexClerkClientProvider";
import { SyncUserWithConvex } from "@/providers/syncuser";
import { NegotiationModalProvider } from '@/context/NegotiationModalContext';
import { cn } from "@/lib/utils";
import MainLayout from "@/components/layout/MainLayout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Negotiable",
  description: "The best transport management app in the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <ConvexClerkClientProvider>
          <SyncUserWithConvex />
          <NegotiationModalProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
          </NegotiationModalProvider>
        </ConvexClerkClientProvider>
      </body>
    </html>
  );
}
