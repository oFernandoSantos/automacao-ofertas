import { NextResponse } from "next/server";
import { markOfferFailed } from "@/modules/publications/service";
import { n8nFailedSchema } from "@/modules/shared/schemas";
import { badRequest, handleRouteError, unauthorized } from "@/modules/shared/http";
import { isValidN8nSecret } from "@/modules/n8n/auth";
import { checkRateLimit, getClientIp, parseJsonBody, tooManyRequests } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const rateLimit = checkRateLimit(`n8n:${getClientIp(request)}`, 120, 60 * 1000);
    if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);
    if (!(await isValidN8nSecret(request.headers.get("authorization")))) {
      return unauthorized("Invalid N8N secret");
    }

    const body = n8nFailedSchema.parse(await parseJsonBody(request));
    const { id } = await context.params;
    const offer = await markOfferFailed(id, {
      executionId: body.execution_id,
      stage: body.stage,
      error: body.error,
    });

    if (!offer) {
      return badRequest("Offer cannot be marked as failed.");
    }

    return NextResponse.json({ offer });
  } catch (error) {
    return handleRouteError(error);
  }
}
