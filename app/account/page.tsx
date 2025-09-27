import { clearAccessToken, getCustomer, getCustomerOrders, requireAuth } from 'lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  await requireAuth();
  
  const accessToken = await getAccessToken();
  if (!accessToken) redirect('/login');

  const [customer, orders] = await Promise.all([
    getCustomer(accessToken),
    getCustomerOrders(accessToken)
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
              <form action={async () => {
                'use server';
                await clearAccessToken();
                redirect('/');
              }}>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>

            {/* Customer Info */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Email:</span> {customer.email}
                </p>
                {customer.firstName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Order History */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order History</h2>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                  <Link
                    href="/search"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">Order {order.name}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.processedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {order.totalPrice.amount} {order.totalPrice.currencyCode}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {order.fulfillmentStatus.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                        <div className="space-y-1">
                          {order.lineItems.edges.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              {item.node.variant.image && (
                                <img
                                  src={item.node.variant.image.url}
                                  alt={item.node.variant.image.altText || item.node.title}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span className="text-sm text-gray-600">
                                {item.node.title} × {item.node.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getAccessToken() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get('customer_access_token')?.value || null;
}
