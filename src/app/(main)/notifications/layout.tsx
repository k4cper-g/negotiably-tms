import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Notifications | Alterion",
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 