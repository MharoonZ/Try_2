import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_CLIENT_ID!;
const API_URL = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL!;

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Order {
  id: string;
  name: string;
  processedAt: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  fulfillmentStatus: string;
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        variant: {
          image?: {
            url: string;
            altText?: string;
          };
        };
      };
    }>;
  };
}

// Generate PKCE parameters
export async function generatePKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  
  return {
    codeVerifier,
    codeChallenge,
    state: generateRandomString(32)
  };
}

// Generate authorization URL
export async function getAuthorizationUrl(redirectUri: string) {
  const { codeChallenge, state } = await generatePKCE();
  
  const scope = 'openid';
  console.log('OAuth Debug - Scope being used:', scope);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: scope,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state
  });

  const url = `${API_URL}/oauth/authorize?${params.toString()}`;
  console.log('OAuth Debug - Generated URL:', url);

  return {
    url,
    state
  };
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
) {
  console.log('=== Token Exchange Debug ===');
  console.log('API URL:', API_URL);
  console.log('Client ID:', CLIENT_ID);
  console.log('Code length:', code.length);
  console.log('Code verifier length:', codeVerifier.length);
  console.log('Redirect URI:', redirectUri);
  
  const requestBody = new URLSearchParams({
    client_id: CLIENT_ID,
    code: code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  
  console.log('Request body:', Object.fromEntries(requestBody.entries()));
  
  const response = await fetch(`${API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();
  console.log('Token exchange successful:', {
    hasAccessToken: !!tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in
  });
  console.log('============================');
  
  return tokenData;
}

// Get customer data
export async function getCustomer(accessToken: string): Promise<Customer> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          customer {
            id
            email
            firstName
            lastName
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customer data');
  }

  const data = await response.json();
  return data.data.customer;
}

// Get customer orders
export async function getCustomerOrders(accessToken: string): Promise<Order[]> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
          customer {
            orders(first: 20) {
              edges {
                node {
                  id
                  name
                  processedAt
                  totalPrice {
                    amount
                    currencyCode
                  }
                  fulfillmentStatus
                  lineItems(first: 10) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          image {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch customer orders');
  }

  const data = await response.json();
  return data.data.customer.orders.edges.map((edge: any) => edge.node);
}

// Store access token in secure cookie
export async function setAccessToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('customer_access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get access token from cookie
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('customer_access_token')?.value || null;
}

// Clear access token
export async function clearAccessToken() {
  const cookieStore = await cookies();
  cookieStore.delete('customer_access_token');
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    await getCustomer(token);
    return true;
  } catch {
    await clearAccessToken();
    return false;
  }
}

// Require authentication (redirect if not authenticated)
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect('/login');
  }
}

// Store PKCE parameters temporarily
export async function storePKCE(codeVerifier: string, state: string) {
  console.log('=== Storing PKCE ===');
  console.log('Code verifier length:', codeVerifier.length);
  console.log('State:', state);
  
  const cookieStore = await cookies();
  cookieStore.set('pkce_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });
  
  console.log('PKCE stored successfully');
  console.log('=======================');
}

// Get stored PKCE parameters
export async function getStoredPKCE(): Promise<{ codeVerifier: string; state: string } | null> {
  console.log('=== Getting Stored PKCE ===');
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('pkce_code_verifier')?.value;
  const state = cookieStore.get('oauth_state')?.value;
  
  console.log('Code verifier found:', !!codeVerifier);
  console.log('State found:', !!state);
  console.log('Code verifier length:', codeVerifier?.length || 0);
  console.log('State length:', state?.length || 0);
  
  if (!codeVerifier || !state) {
    console.log('PKCE not found - missing parameters');
    return null;
  }
  
  console.log('PKCE retrieved successfully');
  console.log('==========================');
  return { codeVerifier, state };
}

// Clear PKCE parameters
export async function clearPKCE() {
  const cookieStore = await cookies();
  cookieStore.delete('pkce_code_verifier');
  cookieStore.delete('oauth_state');
}

// Utility functions
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

function base64URLEncode(str: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function sha256(str: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return crypto.subtle.digest('SHA-256', data);
}
