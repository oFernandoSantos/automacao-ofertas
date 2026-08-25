import { NextResponse } from "next/server";
import { updateOfferPriorityForAutomation } from "@/modules/offers/service";
import { n8nPrioritySchema } from "@/modules/shared/schemas";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { badRequest, handleRouteError } from "@/modules/shared/http";
import { parseJsonBody } from "@/lib/security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const { id } = await context.params;
    const body = n8nPrioritySchema.parse(await parseJsonBody(request));
    const offer = await updateOfferPriorityForAutomation(id, body.priority, body.reason);
    if (!offer) return badRequest("Offer cannot have its priority updated.");
    return NextResponse.json({ offer });
  } catch (error) {
    return handleRouteError(error);
  }
}
