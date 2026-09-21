import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'GitHub Client ID is missing. Set GITHUB_CLIENT_ID in .env.local.' },
      { status: 400 }
    );
  }

  // Generate cryptographically secure state for CSRF defense
  const state = crypto.randomUUID();

  // Determine base origin (supports reverse proxies, Vercel, and custom domains)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const origin = appUrl || (host ? `${proto}://${host}` : new URL(request.url).origin);
  const redirectUri = `${origin}/api/auth/callback/github`;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,user&state=${state}`;

  const response = NextResponse.redirect(githubAuthUrl);

  // Set CSRF state cookie with HttpOnly & SameSite=Lax (10-minute expiry)
  response.cookies.set('branchwatch_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
