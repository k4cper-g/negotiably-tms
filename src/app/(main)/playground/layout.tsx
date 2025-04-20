import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Playground | Alterion",
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 