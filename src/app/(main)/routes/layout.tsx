import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Routes | Alterion",
};

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 