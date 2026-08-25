import { isValidHttpUrl } from "@/lib/utils";
import type {
  ManualProductInput,
  Marketplace,
  MarketplaceProvider,
  NormalizedProductInput,
} from "@/types/domain";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function calculateDiscount(price: number, originalPrice?: number | null) {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) {
    return 0;
  }

  return Number((((originalPrice - price) / originalPrice) * 100).toFixed(2));
}

abstract class BaseMarketplaceProvider implements MarketplaceProvider {
  abstract readonly marketplace: Marketplace;

  async normalizeProduct(input: ManualProductInput): Promise<NormalizedProductInput> {
    return {
      ...input,
      slug: slugify(`${input.marketplace}-${input.title}`),
      discountPercentage: calculateDiscount(input.price, input.originalPrice),
      freeShipping: input.freeShipping ?? false,
    };
  }

  validateAffiliateUrl(url: string) {
    return isValidHttpUrl(url);
  }
}

class MercadoLivreProvider extends BaseMarketplaceProvider {
  readonly marketplace = "MERCADO_LIVRE" as const;
}

class ShopeeProvider extends BaseMarketplaceProvider {
  readonly marketplace = "SHOPEE" as const;
}

class AmazonProvider extends BaseMarketplaceProvider {
  readonly marketplace = "AMAZON" as const;
}

const providerMap: Record<Marketplace, MarketplaceProvider> = {
  MERCADO_LIVRE: new MercadoLivreProvider(),
  SHOPEE: new ShopeeProvider(),
  AMAZON: new AmazonProvider(),
};

export function getMarketplaceProvider(marketplace: Marketplace) {
  return providerMap[marketplace];
}
