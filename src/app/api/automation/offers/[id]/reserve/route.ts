import { NextResponse } from "next/server";
import { reserveOfferAtomically } from "@/modules/publications/service";
import { n8nReserveSchema } from "@/modules/shared/schemas";
import { handleRouteError, unauthorized } from "@/modules/shared/http";
import { isValidN8nSecret } from "@/modules/n8n/auth";
import { checkRateLimit, getClientIp, parseJsonBody, tooManyRequests } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const rateLimit = checkRateLimit(`n8n:${getClientIp(request)}`, 120, 60 * 1000);
    if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);
    if (!(await isValidN8nSecret(request.headers.get("authorization")))) {
      return unauthorized("Invalid N8N secret");
    }

    const body = n8nReserveSchema.parse(await parseJsonBody(request));
    const { id } = await context.params;
    const reservation = await reserveOfferAtomically(id, body.execution_id);

    if (!reservation) {
      return NextResponse.json({ error: "Offer is already reserved or unavailable." }, { status: 409 });
    }

    return NextResponse.json({ offer: reservation });
  } catch (error) {
    return handleRouteError(error);
  }
}
