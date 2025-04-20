import React from "react";
// Remove metadata export entirely from layout
// import type { Metadata } from "next";

// // Restore generic metadata for layout
// export const metadata: Metadata = {
//   title: "Negotiation | Alterion",
// };

// Remove metadata export as the child page will handle the dynamic title
// import type { Metadata } from "next";
// export const metadata: Metadata = {
//   title: "Negotiations | Alterion",
// };

export default function NegotiationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 