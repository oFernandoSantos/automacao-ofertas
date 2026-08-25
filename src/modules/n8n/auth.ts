import { requireEnv } from "@/lib/env";
import { constantTimeEqual } from "@/lib/security";

export async function isValidN8nSecret(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return false;
  }

  const token = authorizationHeader.replace(/^Bearer\s+/i, "").trim();
  return token.length > 0 && constantTimeEqual(token, requireEnv("N8N_API_SECRET"));
}
