import { NextResponse } from "next/server";
import { createAutomationLog } from "@/modules/logs/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { n8nErrorLogSchema } from "@/modules/shared/schemas";
import { handleRouteError } from "@/modules/shared/http";
import { parseJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const body = n8nErrorLogSchema.parse(await parseJsonBody(request));
    await createAutomationLog({
      entityType: "n8n_execution",
      entityId: body.offer_id ?? null,
      event: "n8n_error",
      metadata: body,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
