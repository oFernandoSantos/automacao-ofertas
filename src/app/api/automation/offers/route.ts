import { NextResponse } from "next/server";
import { z } from "zod";
import { listStaleReservedOffers } from "@/modules/publications/service";
import { guardN8nRequest } from "@/modules/n8n/guard";
import { handleRouteError } from "@/modules/shared/http";

const staleReservationQuery = z.object({
  status: z.literal("RESERVED"),
  reserved_before_minutes: z.coerce.number().int().positive().max(7 * 24 * 60),
});

export async function GET(request: Request) {
  try {
    const denied = await guardN8nRequest(request);
    if (denied) return denied;
    const { searchParams } = new URL(request.url);
    const query = staleReservationQuery.parse({
      status: searchParams.get("status"),
      reserved_before_minutes: searchParams.get("reserved_before_minutes"),
    });
    return NextResponse.json({ offers: await listStaleReservedOffers(query.reserved_before_minutes) });
  } catch (error) {
    return handleRouteError(error);
  }
}
