import Link from 'next/link';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your order history and manage your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === 'auth_failed' && (
                    <p>Authentication failed. Please try again.</p>
                  )}
                  {error === 'access_denied' && (
                    <p>Access was denied. Please try again.</p>
                  )}
                  {error === 'invalid_request' && (
                    <p>Invalid request. Please try again.</p>
                  )}
                  {!['auth_failed', 'access_denied', 'invalid_request'].includes(error || '') && (
                    <p>An error occurred: {error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <a
            href="/api/auth/callback"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Sign in with Shopify
          </a>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="https://biotara.myshopify.com/account/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Make sure you've created an account on the Shopify store first</p>
              <p>• Use the same email/password you used to create the account</p>
              <p>• Check that the redirect URI is configured correctly in Shopify</p>
              <p>• <Link href="/api/auth/debug" className="text-blue-600 hover:text-blue-800 underline">Check OAuth Debug Info</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}