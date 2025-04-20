import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Analytics | Alterion",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 