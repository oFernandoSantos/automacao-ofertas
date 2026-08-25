import { NextResponse } from "next/server";
import { releaseOffer } from "@/modules/publications/service";
import { n8nReleaseSchema } from "@/modules/shared/schemas";
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

    const body = n8nReleaseSchema.parse(await parseJsonBody(request));
    const { id } = await context.params;
    const offer = await releaseOffer(id, body.execution_id, body.reason);

    if (!offer) {
      return badRequest("Offer cannot be released.");
    }

    return NextResponse.json({ offer });
  } catch (error) {
    return handleRouteError(error);
  }
}
