import { NextResponse } from "next/server";
import { createSessionCookie, validateAdminCredentials } from "@/lib/auth";
import { checkRateLimit, forbidden, getClientIp, hasTrustedOrigin, parseJsonBody, tooManyRequests } from "@/lib/security";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return forbidden();

  const rateLimit = checkRateLimit(`login:${getClientIp(request)}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit.retryAfterSeconds);

  const body = await parseJsonBody(request);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  if (!(await validateAdminCredentials(email, password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSessionCookie(email);
  return NextResponse.json({ ok: true });
}
