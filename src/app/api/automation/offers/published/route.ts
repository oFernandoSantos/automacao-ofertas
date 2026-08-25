import { NextResponse } from "next/server";
import { listPublishedOffers } from "@/modules/publications/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { handleRouteError } from "@/modules/shared/http";

export async function GET(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    return NextResponse.json({ offers: await listPublishedOffers() });
  } catch (error) {
    return handleRouteError(error);
  }
}
