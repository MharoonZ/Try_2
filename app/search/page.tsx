import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';
import { getProducts } from 'lib/shopify';
import { Product } from 'lib/shopify/types';

export const metadata = {
  title: 'Search',
  description: 'Search for products in the store.'
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { sort, q: searchValue } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;

  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts({ sortKey, reverse, query: searchValue });
  } catch (e: any) {
    console.error('Failed to fetch products:', e);
    error = e.message;
  }

  const resultsText = products.length > 1 ? 'results' : 'result';

  return (
    <div className="mx-auto max-w-screen-2xl px-4">
      <div className="mb-8 flex flex-col gap-8 pb-8 pt-4">
        <h1 className="text-2xl font-bold">All Products</h1>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">
              <strong>Debug Info:</strong> {error}
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              This might be due to missing environment variables. Check the debug endpoint: /api/debug
            </p>
          </div>
        )}

        {searchValue ? (
          <p className="mb-4">
            {products.length === 0
              ? 'There are no products that match '
              : `Showing ${products.length} ${resultsText} for `}
            <span className="font-bold">&quot;{searchValue}&quot;</span>
          </p>
        ) : null}

        {products.length > 0 ? (
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products} />
          </Grid>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {error ? 'Unable to load products' : 'No products found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {error 
                ? 'There seems to be an issue loading products. Please try again later.'
                : 'Try adjusting your search terms or browse all products.'
              }
            </p>
            {error && (
              <div className="mt-4">
                <a 
                  href="/api/debug" 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Check Debug Information
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
