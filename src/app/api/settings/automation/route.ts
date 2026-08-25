import { NextResponse } from "next/server";
import { getAutomationSettings, updateAutomationSettings } from "@/modules/settings/service";
import { handleRouteError } from "@/modules/shared/http";
import { forbidden, hasTrustedOrigin, parseJsonBody } from "@/lib/security";

export async function GET() {
  try {
    const settings = await getAutomationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return forbidden();
    const settings = await updateAutomationSettings(await parseJsonBody(request));
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}
