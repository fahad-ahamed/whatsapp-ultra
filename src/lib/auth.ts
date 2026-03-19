import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode('whatsapp-ultra-secret-key-2024');

export interface JWTPayload {
  userId: string;
  deviceId: string;
  name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      phoneNumber: true,
      name: true,
      profilePic: true,
      status: true,
      about: true,
      lastSeen: true
    }
  });
  
  return user;
}

export async function hashPhoneNumber(phone: string): Promise<string> {
  // Simple hash for demo (use bcrypt in production)
  const encoder = new TextEncoder();
  const data = encoder.encode(phone + 'whatsapp-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
