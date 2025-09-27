import { NextResponse } from 'next/server';

export async function GET() {
  const env = {
    SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID: process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID || 'NOT_SET',
    SHOPIFY_CUSTOMER_ACCOUNT_API_URL: process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL || 'NOT_SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
  };

  // Construct redirect URI
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/callback`;

  // Construct OAuth URL for testing
  const oauthUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL && process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID
    ? `${process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL}/oauth/authorize?client_id=${process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(redirectUri)}&state=test`
    : 'Cannot construct - missing environment variables';

  const checks = {
    env,
    redirectUri,
    oauthUrl,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json({ 
    ok: true, 
    checks,
    instructions: {
      step1: 'Create an account on the Shopify store first',
      step2: 'Use the same email/password for login',
      step3: 'Make sure redirect URI is configured in Shopify Customer Account API settings',
      step4: 'The redirect URI should be: ' + redirectUri
    }
  });
}
