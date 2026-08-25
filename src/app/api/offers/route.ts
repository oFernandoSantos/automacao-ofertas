import { NextResponse } from "next/server";
import { createOffer, listOffers } from "@/modules/offers/service";
import { handleRouteError } from "@/modules/shared/http";
import { forbidden, hasTrustedOrigin, parseJsonBody } from "@/lib/security";

export async function GET() {
  try {
    const offers = await listOffers();
    return NextResponse.json({ offers });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return forbidden();
    const offer = await createOffer(await parseJsonBody(request));
    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
