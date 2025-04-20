import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Freight Offers | Alterion",
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 