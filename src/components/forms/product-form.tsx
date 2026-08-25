import { createProductAction } from "@/app/products/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProductForm() {
  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Cadastro manual</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Funciona sem APIs oficiais: produto, preço e link são informados manualmente.
        </p>
      </div>
      <form action={createProductAction} className="grid gap-4 md:grid-cols-2">
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
          Título
          <Input name="title" required />
        </label>
        <label className="grid gap-2 text-sm">
          URL do produto
          <Input name="productUrl" type="url" required />
        </label>
        <label className="grid gap-2 text-sm">
          URL da imagem
          <Input name="imageUrl" type="url" />
        </label>
        <label className="grid gap-2 text-sm">
          Preço atual
          <Input name="price" type="number" step="0.01" required />
        </label>
        <label className="grid gap-2 text-sm">
          Preço anterior
          <Input name="originalPrice" type="number" step="0.01" />
        </label>
        <label className="grid gap-2 text-sm">
          Categoria
          <Input name="category" />
        </label>
        <label className="grid gap-2 text-sm">
          Seller
          <Input name="seller" />
        </label>
        <label className="grid gap-2 text-sm">
          ASIN
          <Input name="asin" />
        </label>
        <label className="grid gap-2 text-sm">
          Item ID / External ID
          <Input name="externalId" />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          Descrição
          <Textarea name="description" />
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Criar produto</Button>
        </div>
      </form>
    </Card>
  );
}
