import { upsertAffiliateAccountAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AffiliateAccountForm() {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Nova conta de afiliado</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Tokens sensíveis ficam no backend/ENV. Aqui entram identificadores operacionais.
        </p>
      </div>
      <form action={upsertAffiliateAccountAction} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Marketplace
          <select
            name="marketplace"
            className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2"
            defaultValue="MERCADO_LIVRE"
          >
            <option value="MERCADO_LIVRE">Mercado Livre</option>
            <option value="SHOPEE">Shopee</option>
            <option value="AMAZON">Amazon</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Nome
          <Input name="name" required />
        </label>
        <label className="grid gap-2 text-sm">
          Identifier / Tag
          <Input name="affiliateIdentifier" />
        </label>
        <label className="grid gap-2 text-sm">
          Tracking ID
          <Input name="trackingId" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar conta</Button>
        </div>
      </form>
    </Card>
  );
}
