import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, hashPhoneNumber } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // Search by phone number (hash it first) or name
    const hashedPhone = await hashPhoneNumber(query);

    const users = await db.user.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: hashedPhone } },
          { name: { contains: query, mode: 'insensitive' } }
        ],
        NOT: { id: user.id }
      },
      select: {
        id: true,
        name: true,
        profilePic: true,
        about: true,
        lastSeen: true
      },
      take: 20
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
