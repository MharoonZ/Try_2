// Utility to check if we're in a build environment without Shopify credentials
export function isBuildTime(): boolean {
  return process.env.NODE_ENV === 'production' && 
         (!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN);
}

// Utility to safely execute Shopify API calls during build
export async function safeShopifyCall<T>(
  apiCall: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (isBuildTime()) {
    console.warn('Skipping Shopify API call during build - environment variables not available');
    return fallback;
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn('Shopify API call failed:', error);
    return fallback;
  }
}
