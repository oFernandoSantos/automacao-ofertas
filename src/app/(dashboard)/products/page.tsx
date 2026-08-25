import { AffiliateForm } from "@/components/forms/affiliate-form";
import { ProductForm } from "@/components/forms/product-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DatabaseSetupCard } from "@/components/ui/database-setup-card";
import { PageHeader } from "@/components/ui/page-header";
import { env } from "@/lib/env";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { listProducts } from "@/modules/products/service";

export default async function ProductsPage() {
  if (!env.DATABASE_URL) {
    return <div className="space-y-6"><PageHeader eyebrow="CATÁLOGO" title="Produtos" description="Centralize itens, preços e links de origem." /><DatabaseSetupCard /></div>;
  }
  const products = await listProducts();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="CATÁLOGO" title="Produtos" description="Cadastre preços, origem e link afiliado em um só lugar." />
      <ProductForm />
      <section className="grid gap-4">
        {products.length === 0 ? <Card className="py-10 text-center"><p className="font-semibold">Nenhum produto cadastrado</p><p className="mt-2 text-sm text-[var(--muted-foreground)]">Comece pelo cadastro manual acima para criar sua primeira oferta.</p></Card> : null}
        {products.map((product) => (
          <Card key={product.id} className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">{product.title}</h2>
                <Badge>{product.marketplace}</Badge>
                {product.affiliate_url ? <Badge className="border-[#1265a5] bg-[#062a4d] text-[#74caff]">Afiliado OK</Badge> : null}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{product.category ?? "Sem categoria"}</p>
              <p className="text-sm">
                {formatCurrency(Number(product.price))} • desconto {formatPercentage(Number(product.discount_percentage))}
              </p>
            </div>
            <AffiliateForm productId={product.id} marketplace={product.marketplace} productUrl={product.product_url} />
          </Card>
        ))}
      </section>
    </div>
  );
}
