import { NextResponse } from "next/server";
import { canPublishOffer } from "@/modules/publications/service";
import { n8nCanPublishQuerySchema } from "@/modules/shared/schemas";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { handleRouteError } from "@/modules/shared/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const query = n8nCanPublishQuerySchema.parse({
      offer_id: searchParams.get("offer_id") ?? id,
      product_id: searchParams.get("product_id") ?? undefined,
      channel_id: searchParams.get("channel_id"),
    });
    return NextResponse.json(await canPublishOffer({ offerId: query.offer_id ?? id, productId: query.product_id, channelId: query.channel_id }));
  } catch (error) {
    return handleRouteError(error);
  }
}
