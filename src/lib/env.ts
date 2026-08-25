import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),
  N8N_API_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  AUTOMATION_MODE: z.enum(["MANUAL", "SEMI_AUTO", "AUTO"]).default("MANUAL"),
  AUTOMATION_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  PRODUCT_COOLDOWN_HOURS: z.coerce.number().int().positive().default(48),
  DEFAULT_RESERVATION_MINUTES: z.coerce.number().int().positive().default(15),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  N8N_API_SECRET: process.env.N8N_API_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  AUTOMATION_MODE: process.env.AUTOMATION_MODE,
  AUTOMATION_ENABLED: process.env.AUTOMATION_ENABLED,
  PRODUCT_COOLDOWN_HOURS: process.env.PRODUCT_COOLDOWN_HOURS,
  DEFAULT_RESERVATION_MINUTES: process.env.DEFAULT_RESERVATION_MINUTES,
});

type RequiredStringEnvKey =
  | "DATABASE_URL"
  | "N8N_API_SECRET"
  | "AUTH_SECRET"
  | "ADMIN_EMAIL"
  | "ADMIN_PASSWORD";

export function requireEnv(name: RequiredStringEnvKey) {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is required at runtime.`);
  }

  if (process.env.NODE_ENV === "production") {
    if ((name === "AUTH_SECRET" || name === "N8N_API_SECRET") && value.length < 32) {
      throw new Error(`${name} must be at least 32 characters in production.`);
    }

    if (name === "ADMIN_PASSWORD" && value.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters in production.");
    }
  }

  return value;
}
