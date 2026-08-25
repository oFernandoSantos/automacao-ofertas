import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings, setAutomationEnabled } from "@/modules/settings/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { handleRouteError } from "@/modules/shared/http";
import { verifySessionToken } from "@/lib/auth";
import { forbidden, hasTrustedOrigin, parseJsonBody } from "@/lib/security";
import { z } from "zod";

const statusSchema = z.object({ enabled: z.boolean() });

export async function GET(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const settings = await getAutomationSettings();
    return NextResponse.json({ enabled: settings.automationEnabled });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = request.cookies.get("admin_session")?.value;
    const isAdmin = Boolean(session && (await verifySessionToken(session)) && hasTrustedOrigin(request));

    if (!isAdmin) {
      const denied = await guardN8nRequest(request);
      if (denied) return denied;
    }

    if (!hasTrustedOrigin(request) && isAdmin) return forbidden();
    const body = statusSchema.parse(await parseJsonBody(request));
    const settings = await setAutomationEnabled(body.enabled);
    return NextResponse.json({ enabled: settings.automationEnabled });
  } catch (error) {
    return handleRouteError(error);
  }
}
