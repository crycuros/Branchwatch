import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const origin = appUrl || (host ? `${proto}://${host}` : new URL(request.url).origin);

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Retrieve stored CSRF state from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const stateMatch = cookieHeader.match(/(?:^|;\s*)branchwatch_oauth_state=([^;]+)/);
  const storedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;

  // Clear CSRF state cookie in all return paths
  const clearStateCookie = (res: NextResponse) => {
    res.cookies.set('branchwatch_oauth_state', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });
    return res;
  };

  if (error || !code) {
    const res = NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || 'no_code')}`);
    return clearStateCookie(res);
  }

  // Validate state parameter to mitigate CSRF attacks
  if (!state || !storedState || state !== storedState) {
    console.error('OAuth CSRF state verification failed:', { received: state, stored: storedState });
    const res = NextResponse.redirect(`${origin}/?auth_error=csrf_state_mismatch`);
    return clearStateCookie(res);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const res = NextResponse.redirect(`${origin}/?auth_error=missing_server_credentials`);
    return clearStateCookie(res);
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await tokenRes.json();

    if (data.access_token) {
      // Secure redirect: DO NOT leak access_token in URL query parameter!
      const response = NextResponse.redirect(`${origin}/?auth=success`);
      
      // Store token in an HttpOnly, Secure, SameSite=Lax cookie
      response.cookies.set('branchwatch_token', data.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return clearStateCookie(response);
    } else {
      const res = NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(data.error || 'failed_token_exchange')}`);
      return clearStateCookie(res);
    }
  } catch (err) {
    console.error('OAuth token exchange error:', err);
    const res = NextResponse.redirect(`${origin}/?auth_error=server_error`);
    return clearStateCookie(res);
  }
}
