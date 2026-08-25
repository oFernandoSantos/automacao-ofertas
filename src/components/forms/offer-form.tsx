import { createOfferAction } from "@/app/offers/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function OfferForm({
  products,
}: {
  products: Array<{ id: string; title: string; affiliate_url?: string | null }>;
}) {
  if (products.length === 0) {
    return (
      <Card className="border-dashed text-center">
        <h2 className="text-xl font-semibold">Crie um produto primeiro</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Ofertas precisam de produto, preço e link de origem para manter rastreabilidade.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Criar oferta</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          O sistema calcula score e segura a oferta em `WAITING_AFFILIATE_LINK` quando faltar link afiliado.
        </p>
      </div>
      <form action={createOfferAction} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm md:col-span-2">
          Produto
          <select name="productId" className="rounded-xl border border-[var(--border)] bg-[var(--input)] px-3 py-2">
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title} {product.affiliate_url ? "" : "(sem afiliado)"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Preço
          <Input name="price" type="number" step="0.01" required />
        </label>
        <label className="grid gap-2 text-sm">
          Preço anterior
          <Input name="originalPrice" type="number" step="0.01" />
        </label>
        <label className="grid gap-2 text-sm">
          Preço final estimado
          <Input name="estimatedFinalPrice" type="number" step="0.01" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Criar oferta</Button>
        </div>
      </form>
    </Card>
  );
}
