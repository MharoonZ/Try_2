import { getCollectionProducts, getProducts } from 'lib/shopify';
import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || '',
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'set' : 'missing'
  };

  const checks: Record<string, unknown> = { env };
  const errors: string[] = [];

  try {
    const products = await getProducts({});
    checks.allProductsCount = products.length;
  } catch (e: any) {
    errors.push(`getProducts failed: ${e?.message || 'unknown error'}`);
  }

  for (const handle of ['hidden-homepage-featured-items', 'hidden-homepage-carousel']) {
    try {
      const col = await getCollectionProducts({ collection: handle });
      (checks as any)[`${handle}-count`] = col.length;
    } catch (e: any) {
      errors.push(`getCollectionProducts(${handle}) failed: ${e?.message || 'unknown error'}`);
    }
  }

  return NextResponse.json({ ok: errors.length === 0, checks, errors });
}


