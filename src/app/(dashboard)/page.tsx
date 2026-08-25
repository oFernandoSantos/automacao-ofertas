import { Card } from "@/components/ui/card";
import { DatabaseSetupCard } from "@/components/ui/database-setup-card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { env } from "@/lib/env";
import { formatPercentage } from "@/lib/utils";
import { getDashboardMetrics } from "@/modules/dashboard/service";

export default async function DashboardPage() {
  if (!env.DATABASE_URL) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="VISÃO GERAL" title="Dashboard operacional" description="Acompanhe sua operação de ofertas em um único lugar." />
        <DatabaseSetupCard />
      </div>
    );
  }

  const { summary, ctrMetrics, marketplaceBreakdown } = await getDashboardMetrics();

  const cards = [
    ["Ofertas encontradas", summary.offers_found],
    ["Ofertas prontas", summary.offers_ready],
    ["Aguardando afiliado", summary.waiting_affiliate],
    ["Enviadas ao n8n", summary.sent_to_n8n],
    ["Publicadas", summary.published],
    ["Falhas", summary.failed],
    ["Cliques hoje", summary.clicks_today],
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="VISÃO GERAL" title="Dashboard operacional" description="Volume, desempenho e prioridade da operação em tempo real." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-3 text-3xl font-bold">{String(value)}</p>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">CTR e destaque</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Badge>CTR {formatPercentage(Number(ctrMetrics.ctr))}</Badge>
            <Badge>Marketplace líder: {ctrMetrics.top_marketplace ?? "N/A"}</Badge>
            <Badge>Produto mais clicado: {ctrMetrics.top_product ?? "N/A"}</Badge>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Marketplaces</h2>
          <div className="mt-4 space-y-3">
            {marketplaceBreakdown.map((item) => (
              <div key={item.marketplace} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex items-center justify-between">
                  <strong>{item.marketplace}</strong>
                  <Badge>{formatPercentage(Number(item.ctr))} CTR</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {item.offers} ofertas • {item.clicks} cliques • {item.conversions} conversões
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
