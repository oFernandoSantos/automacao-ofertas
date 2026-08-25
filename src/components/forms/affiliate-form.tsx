import { createAffiliateLinkAction } from "@/app/products/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AffiliateForm({ productId, marketplace, productUrl }: { productId: string; marketplace: string; productUrl: string }) {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Associar link afiliado</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Nenhuma oferta vai para `READY` sem `affiliate_url`.
        </p>
      </div>
      <form action={createAffiliateLinkAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="marketplace" value={marketplace} />
        <input type="hidden" name="originalUrl" value={productUrl} />
        <label className="grid gap-2 text-sm md:col-span-2">
          Affiliate URL
          <Input name="affiliateUrl" type="url" required />
        </label>
        <label className="grid gap-2 text-sm">
          Tracking code
          <Input name="trackingCode" />
        </label>
        <label className="grid gap-2 text-sm">
          Sub ID / Tag
          <Input name="subId" />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          Campaign
          <Input name="campaign" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar link afiliado</Button>
        </div>
      </form>
    </Card>
  );
}
