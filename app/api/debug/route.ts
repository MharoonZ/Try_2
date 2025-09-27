import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN || 'NOT_SET',
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
  };

  const checks: Record<string, unknown> = { env };
  const errors: string[] = [];

  // Test basic Shopify connection
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    
    if (!domain || !token) {
      errors.push('Missing Shopify environment variables');
    } else {
      const endpoint = `https://${domain}/api/2023-01/graphql.json`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({
          query: `
            query {
              products(first: 5) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
            }
          `
        })
      });

      if (!response.ok) {
        errors.push(`Shopify API returned ${response.status}: ${response.statusText}`);
      } else {
        const data = await response.json();
        checks.productsCount = data.data?.products?.edges?.length || 0;
        checks.shopifyResponse = data;
      }
    }
  } catch (e: any) {
    errors.push(`Shopify API test failed: ${e?.message || 'unknown error'}`);
  }

  return NextResponse.json({ 
    ok: errors.length === 0, 
    checks, 
    errors,
    timestamp: new Date().toISOString()
  });
}
