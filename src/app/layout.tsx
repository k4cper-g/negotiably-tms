import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConvexClerkClientProvider } from "@/providers/ConvexClerkClientProvider";
import { SyncUserWithConvex } from "@/providers/syncuser";
import { NegotiationModalProvider } from '@/context/NegotiationModalContext';
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react"
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Alterion - Smart Transport Management with AI-Powered Solutions",
  description: "Alterion is a TMS platform that automates your supply chain, streamlines operations, and boosts efficiency.",
  metadataBase: new URL('https://alterion.com'),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alterion.com",
    title: "Alterion - Smart Transport Management with AI-Powered Solutions",
    description: "Alterion is a TMS platform that automates your supply chain, streamlines operations, and boosts efficiency.",
    siteName: "Alterion",
    images: [
      {
        url: "/alterion-meta.png",
        width: 1000,
        height: 1000,
        alt: "Alterion - Smart Transport Management with AI-Powered Solutions"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Alterion - Smart Transport Management with AI-Powered Solutions",
    description: "Alterion is a TMS platform that automates your supply chain, streamlines operations, and boosts efficiency.",
    images: ["/alterion-meta.png"]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <Analytics />
        <ConvexClerkClientProvider>
          <SyncUserWithConvex />
          <NegotiationModalProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <Toaster />
          </NegotiationModalProvider>
        </ConvexClerkClientProvider>
      </body>
    </html>
  );
}
