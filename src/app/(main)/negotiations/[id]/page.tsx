// SERVER COMPONENT
import { Id } from "../../../../../convex/_generated/dataModel";
import NegotiationDetailClient from "./NegotiationDetailClient";

// Make the function async and update the params type
export default async function NegotiationDetail({
  params: paramsPromise, // Rename for clarity
}: {
  params: Promise<{ id: string }>; // Indicate params is a Promise
}) {
  const params = await paramsPromise; // Await the promise
  const negotiationId = params.id as unknown as Id<"negotiations">;
  
  return <NegotiationDetailClient negotiationId={negotiationId} />;
} 