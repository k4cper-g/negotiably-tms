// SERVER COMPONENT
// import { Metadata, ResolvingMetadata } from 'next';
// import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import NegotiationDetailClient from "./NegotiationDetailClient";

// Remove Props type
// type Props = {
//   params: { id: string };
//   searchParams: { [key: string]: string | string[] | undefined };
// };

// Remove ConvexHttpClient instance
// const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Remove generateMetadata function
// export async function generateMetadata(...) { ... }

// Page component (explicitly await params to address warning)
export default async function NegotiationDetail({
  params: paramsPromise, // Rename back if needed
}: {
  params: Promise<{ id: string }>; // Revert if needed, or keep as {id: string}
}) {
  const params = await paramsPromise; // Await the params promise
  const negotiationId = params.id as unknown as Id<"negotiations">;
  
  return <NegotiationDetailClient negotiationId={negotiationId} />;
} 