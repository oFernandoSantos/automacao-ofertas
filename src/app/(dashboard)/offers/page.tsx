import { OfferForm } from "@/components/forms/offer-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatabaseSetupCard } from "@/components/ui/database-setup-card";
import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/lib/env";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { listOffers } from "@/modules/offers/service";
import { listProducts } from "@/modules/products/service";
import { approveOfferAction, rejectOfferAction } from "@/app/offers/actions";

export default async function OffersPage() {
  if (!env.DATABASE_URL) {
    return <div className="space-y-6"><PageHeader eyebrow="OPERAÇÃO" title="Ofertas" description="Revise, priorize e aprove publicações com segurança." /><DatabaseSetupCard /></div>;
  }
  const [offers, products] = await Promise.all([listOffers(), listProducts()]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="OPERAÇÃO" title="Ofertas" description="Score, aprovação e estado de publicação em tempo real." />
      <OfferForm products={products} />
      <section className="space-y-4">
        {offers.length === 0 ? <Card className="py-10 text-center"><p className="font-semibold">Fila de ofertas vazia</p><p className="mt-2 text-sm text-[var(--muted-foreground)]">Cadastre um produto e crie uma oferta para iniciar a operação.</p></Card> : null}
        {offers.map((offer) => (
          <Card key={offer.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <h2 className="text-lg font-semibold">{offer.title}</h2>
                  <Badge>{offer.marketplace}</Badge>
                  <Badge>{offer.status}</Badge>
                  <Badge>{offer.priority}</Badge>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {formatCurrency(Number(offer.price))} • antes {formatCurrency(Number(offer.original_price ?? 0))} •
                  desconto {formatPercentage(Number(offer.discount_percentage))}
                </p>
                <p className="text-sm">Score {offer.score}</p>
                <p className="text-sm">Cupom {offer.coupon_code ?? "Sem cupom"}</p>
                <p className="text-sm">Afiliado {offer.affiliate_url ? "Vinculado" : "Pendente"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approveOfferAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <Button type="submit">Aprovar</Button>
                </form>
                <form action={rejectOfferAction}>
                  <input type="hidden" name="offerId" value={offer.id} />
                  <Button type="submit" variant="danger">
                    Rejeitar
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
