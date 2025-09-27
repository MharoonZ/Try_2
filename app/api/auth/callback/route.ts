import { clearPKCE, exchangeCodeForToken, getAuthorizationUrl, getStoredPKCE, setAccessToken, storePKCE } from 'lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Debug logging
  console.log('=== OAuth Callback Debug ===');
  console.log('Full URL:', request.url);
  console.log('Search Params:', Object.fromEntries(searchParams.entries()));
  console.log('Code present:', !!code);
  console.log('State present:', !!state);
  console.log('Error present:', !!error);
  console.log('User Agent:', request.headers.get('user-agent'));
  console.log('Referer:', request.headers.get('referer'));
  console.log('================================');

  // Handle OAuth callback
  console.log('=== Checking OAuth Callback Conditions ===');
  console.log('Code present:', !!code);
  console.log('State present:', !!state);
  console.log('Code value:', code);
  console.log('State value:', state);
  
  if (code && state) {
    console.log('=== Processing OAuth Callback ===');
    try {
      console.log('Getting stored PKCE...');
      const storedPKCE = await getStoredPKCE();
      console.log('Stored PKCE:', storedPKCE ? 'found' : 'not found');
      
      if (!storedPKCE) {
        throw new Error('No stored PKCE found');
      }
      
      if (storedPKCE.state !== state) {
        console.log('State mismatch:', { stored: storedPKCE.state, received: state });
        throw new Error('Invalid state parameter');
      }

      // Fix: Ensure redirect URI has proper protocol
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      const redirectUri = `${baseUrl}/api/auth/callback`;
      
      console.log('Environment check:', {
        VERCEL_URL: process.env.VERCEL_URL,
        baseUrl,
        redirectUri
      });
      
      console.log('Exchanging code for token...');
      console.log('Code length:', code.length);
      console.log('Code verifier length:', storedPKCE.codeVerifier.length);
      
      const tokenData = await exchangeCodeForToken(
        code,
        storedPKCE.codeVerifier,
        redirectUri
      );

      console.log('Token exchange successful:', {
        hasAccessToken: !!tokenData.access_token,
        tokenLength: tokenData.access_token?.length || 0
      });

      await setAccessToken(tokenData.access_token);
      await clearPKCE();

      console.log('Authentication successful, redirecting to account');
      return NextResponse.redirect(new URL('/account', request.url));
    } catch (error: any) {
      console.error('=== Auth callback error ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('==========================');
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

  // If we reach here without code and state, something went wrong
  console.log('=== No Code/State - Starting OAuth Flow ===');

  // Start OAuth flow
  console.log('=== Starting OAuth Flow ===');
  // Fix: Ensure redirect URI has proper protocol
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  console.log('Environment check:', {
    VERCEL_URL: process.env.VERCEL_URL,
    baseUrl,
    redirectUri
  });
  
  console.log('Generating authorization URL...');
  const { url, state: authState } = await getAuthorizationUrl(redirectUri);
  console.log('Generated OAuth URL:', url);
  console.log('Generated state:', authState);

  // Store PKCE parameters
  console.log('Generating PKCE...');
  const { codeVerifier } = await generatePKCE();
  console.log('Generated code verifier length:', codeVerifier.length);
  
  console.log('Storing PKCE parameters...');
  await storePKCE(codeVerifier, authState);

  console.log('Redirecting to Shopify OAuth');
  console.log('============================');
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
