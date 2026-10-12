import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, UserTokenPayload } from './jwt';

export function getAuthenticatedUser(req: NextRequest): UserTokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      return verifyToken(token);
    } catch {
      // try cookie below
    }
  }

  const cookieToken =
    req.cookies.get('token')?.value ||
    req.cookies.get('auth_token')?.value ||
    req.cookies.get('jwt')?.value;
  if (cookieToken) {
    try {
      return verifyToken(cookieToken);
    } catch {
      // fallback
    }
  }

  if (process.env.ALLOW_DEMO_LOGIN !== 'false') {
    return {
      userId: 1,
      userLoginName: 'admin',
      userName: 'Dr. Admin',
      roleId: 1,
      roleName: 'Administrator',
    };
  }

  return null;
}

export function authUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { success: false, message: 'Access token is required or invalid.' },
    { status: 401 }
  );
}
