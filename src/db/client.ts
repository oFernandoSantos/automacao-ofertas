import postgres from "postgres";
import { requireEnv } from "@/lib/env";

declare global {
  var __sql__: ReturnType<typeof postgres> | undefined;
}

export function getSql() {
  if (!globalThis.__sql__) {
    globalThis.__sql__ = postgres(requireEnv("DATABASE_URL"), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  return globalThis.__sql__;
}
