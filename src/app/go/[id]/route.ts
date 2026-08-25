import { NextResponse } from "next/server";
import { resolveTrackingRedirect } from "@/modules/tracking/service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const affiliateUrl = await resolveTrackingRedirect(id);

  if (!affiliateUrl) {
    return NextResponse.json({ error: "Affiliate URL not found." }, { status: 404 });
  }

  return NextResponse.redirect(affiliateUrl, { status: 302 });
}
