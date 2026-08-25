import { NextResponse } from "next/server";
import { findNextReadyOffer } from "@/modules/publications/service";
import { unauthorized, handleRouteError } from "@/modules/shared/http";
import { isValidN8nSecret } from "@/modules/n8n/auth";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/security";

export async function GET(request: Request) {
  try {
    const rateLimit = checkRateLimit(`n8n:${getClientIp(request)}`, 120, 60 * 1000);
    if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);
    if (!(await isValidN8nSecret(request.headers.get("authorization")))) {
      return unauthorized("Invalid N8N secret");
    }

    const offer = await findNextReadyOffer();

    if (!offer) {
      return NextResponse.json({ offer: null }, { status: 200 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    return handleRouteError(error);
  }
}
