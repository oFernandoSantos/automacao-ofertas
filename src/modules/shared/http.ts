import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function badRequest(message: string, issues?: unknown) {
  return NextResponse.json({ error: message, issues }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return badRequest("Validation error", error.flatten());
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
