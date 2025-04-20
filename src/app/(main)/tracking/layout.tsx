import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Tracking | Alterion",
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 