import { clearPKCE, exchangeCodeForToken, getAuthorizationUrl, getStoredPKCE, setAccessToken, storePKCE } from 'lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Debug logging
  console.log('OAuth Callback Debug:', {
    code: code ? 'present' : 'missing',
    state: state ? 'present' : 'missing',
    error: error || 'none',
    url: request.url,
    searchParams: Object.fromEntries(searchParams.entries())
  });

  // Handle OAuth callback
  if (code && state) {
    try {
      const storedPKCE = await getStoredPKCE();
      if (!storedPKCE || storedPKCE.state !== state) {
        throw new Error('Invalid state parameter');
      }

      // Fix: Ensure redirect URI has proper protocol
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      const redirectUri = `${baseUrl}/api/auth/callback`;
      
      console.log('Exchanging code for token with redirect URI:', redirectUri);
      
      const tokenData = await exchangeCodeForToken(
        code,
        storedPKCE.codeVerifier,
        redirectUri
      );

      await setAccessToken(tokenData.access_token);
      await clearPKCE();

      console.log('Authentication successful, redirecting to account');
      return NextResponse.redirect(new URL('/account', request.url));
    } catch (error) {
      console.error('Auth callback error:', error);
      await clearPKCE();
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }

  // Handle errors
  if (error) {
    console.error('OAuth error:', error);
    await clearPKCE();
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  // Start OAuth flow
  // Fix: Ensure redirect URI has proper protocol
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  console.log('Starting OAuth flow with redirect URI:', redirectUri);
  
  const { url, state: authState } = await getAuthorizationUrl(redirectUri);

  // Store PKCE parameters
  const { codeVerifier } = await generatePKCE();
  await storePKCE(codeVerifier, authState);

  console.log('Redirecting to Shopify OAuth:', url);
  return NextResponse.redirect(url);
}

async function generatePKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  
  return {
    codeVerifier,
    codeChallenge,
    state: generateRandomString(32)
  };
}

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
