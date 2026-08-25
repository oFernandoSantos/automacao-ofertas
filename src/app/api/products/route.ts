import { NextResponse } from "next/server";
import { createProduct, listProducts } from "@/modules/products/service";
import { handleRouteError } from "@/modules/shared/http";
import { forbidden, hasTrustedOrigin, parseJsonBody } from "@/lib/security";

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return forbidden();
    const product = await createProduct(await parseJsonBody(request));
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
