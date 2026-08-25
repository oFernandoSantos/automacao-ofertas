import { AffiliateAccountForm } from "@/components/forms/affiliate-account-form";
import { Card } from "@/components/ui/card";
import { DatabaseSetupCard } from "@/components/ui/database-setup-card";
import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/lib/env";
import { listAffiliateAccounts } from "@/modules/affiliates/service";

export default async function AffiliateSettingsPage() {
  if (!env.DATABASE_URL) {
    return <div className="space-y-6"><PageHeader eyebrow="CONFIGURAÇÕES" title="Afiliados" description="Organize contas e identificadores de cada marketplace." /><DatabaseSetupCard /></div>;
  }
  const accounts = await listAffiliateAccounts();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CONFIGURAÇÕES" title="Afiliados" description="Mantenha contas, tags e identificadores organizados por marketplace." />
      <AffiliateAccountForm />
      <Card>
        <h2 className="text-lg font-semibold">Contas cadastradas</h2>
        <div className="mt-4 space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Nenhuma conta cadastrada ainda. A V1 já suporta links afiliados manuais por produto.
            </p>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
                <strong>{account.name}</strong> • {account.marketplace}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
