// SERVER COMPONENT
import { Id } from "../../../../convex/_generated/dataModel";
import NegotiationDetailClient from "./NegotiationDetailClient";

export default function NegotiationDetail(props: { params: { id: string } }) {
  // For current Next.js versions, accessing params directly is still supported
  // but in future versions, it will require React.use()
  const negotiationId = props.params.id as unknown as Id<"negotiations">;
  
  return <NegotiationDetailClient negotiationId={negotiationId} />;
} 