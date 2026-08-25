import { NextResponse } from "next/server";
import { markOfferPublished } from "@/modules/publications/service";
import { n8nPublishedSchema } from "@/modules/shared/schemas";
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

    const body = n8nPublishedSchema.parse(await parseJsonBody(request));
    const { id } = await context.params;

    const publication = await markOfferPublished(id, {
      provider: body.provider,
      destination: body.destination,
      publishedAt: body.published_at,
      n8nExecutionId: body.execution_id,
      evolutionMessageId: body.message_id,
      remoteJid: body.remote_jid,
      channelId: body.channel_id,
    });

    return NextResponse.json({ publication });
  } catch (error) {
    return handleRouteError(error);
  }
}
