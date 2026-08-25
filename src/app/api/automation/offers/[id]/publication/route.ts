import { NextResponse } from "next/server";
import { getPublicationForOffer } from "@/modules/publications/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { notFound, handleRouteError } from "@/modules/shared/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const { id } = await context.params;
    const publication = await getPublicationForOffer(id);
    if (!publication) return notFound("Offer has not been published.");
    return NextResponse.json({
      message_id: publication.evolution_message_id,
      remote_jid: publication.remote_jid,
      published_at: publication.published_at,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
