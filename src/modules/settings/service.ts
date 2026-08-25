import { getSql } from "@/db/client";
import { env } from "@/lib/env";
import { automationSettingsSchema } from "@/modules/shared/schemas";
import type { AutomationSettings } from "@/types/domain";

const defaultSettings: AutomationSettings = {
  automationEnabled: env.AUTOMATION_ENABLED,
  mode: env.AUTOMATION_MODE,
  productCooldownHours: env.PRODUCT_COOLDOWN_HOURS,
  defaultReservationMinutes: env.DEFAULT_RESERVATION_MINUTES,
};

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const sql = getSql();
  const result = await sql<{ value: AutomationSettings }[]>`
    SELECT value
    FROM app_settings
    WHERE key = 'automation'
    LIMIT 1
  `;

  if (result.length === 0) {
    return defaultSettings;
  }

  return automationSettingsSchema.parse(result[0].value);
}

export async function updateAutomationSettings(input: AutomationSettings) {
  const sql = getSql();
  const parsed = automationSettingsSchema.parse(input);

  await sql`
    INSERT INTO app_settings (key, value)
    VALUES ('automation', ${sql.json(parsed)})
    ON CONFLICT (key)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  `;

  return parsed;
}

export async function setAutomationEnabled(enabled: boolean) {
  const current = await getAutomationSettings();
  return updateAutomationSettings({ ...current, automationEnabled: enabled });
}
