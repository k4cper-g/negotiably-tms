import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contacts | Alterion",
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 