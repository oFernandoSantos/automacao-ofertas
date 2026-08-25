import { NextResponse } from "next/server";
import { isValidN8nSecret } from "@/modules/n8n/auth";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/security";
import { unauthorized } from "@/modules/shared/http";

export async function guardN8nRequest(request: Request) {
  const rateLimit = checkRateLimit(`n8n:${getClientIp(request)}`, 120, 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);
  if (!(await isValidN8nSecret(request.headers.get("authorization")))) return unauthorized();
  return null as NextResponse | null;
}
