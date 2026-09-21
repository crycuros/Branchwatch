import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)branchwatch_token=([^;]+)/);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      return NextResponse.json({
        authenticated: true,
        token,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
        },
      });
    } else {
      // Invalid/revoked token: clear cookie
      const response = NextResponse.json({ authenticated: false, error: 'Token invalid or revoked' });
      response.cookies.set('branchwatch_token', '', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
      });
      return response;
    }
  } catch (err) {
    console.error('Error verifying session token with GitHub:', err);
    return NextResponse.json({ authenticated: false, error: 'Session verification failed' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ error: 'Valid token is required' }, { status: 400 });
    }

    const cleanToken = token.trim();

    // Verify token with GitHub before storing
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'GitHub rejected the provided token' }, { status: 401 });
    }

    const userData = await userRes.json();
    const response = NextResponse.json({
      authenticated: true,
      token: cleanToken,
      user: {
        login: userData.login,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
      },
    });

    // Store in HttpOnly Secure Cookie
    response.cookies.set('branchwatch_token', cleanToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Error saving session token:', err);
    return NextResponse.json({ error: 'Failed to process token' }, { status: 500 });
  }
}
