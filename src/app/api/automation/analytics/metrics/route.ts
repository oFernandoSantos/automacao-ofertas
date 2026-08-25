import { NextResponse } from "next/server";
import { getOfferMetrics } from "@/modules/analytics/automation";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { handleRouteError } from "@/modules/shared/http";

export async function GET(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    return NextResponse.json({ metrics: await getOfferMetrics() });
  } catch (error) {
    return handleRouteError(error);
  }
}
