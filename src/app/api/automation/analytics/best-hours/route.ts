import { NextResponse } from "next/server";
import { createAutomationLog } from "@/modules/logs/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { n8nSnapshotSchema } from "@/modules/shared/schemas";
import { handleRouteError } from "@/modules/shared/http";
import { parseJsonBody } from "@/lib/security";

export async function POST(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const snapshot = n8nSnapshotSchema.parse(await parseJsonBody(request));
    await createAutomationLog({ entityType: "analytics", event: "best_hours_snapshot", metadata: { snapshot } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
