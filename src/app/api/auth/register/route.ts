import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, hashPhoneNumber } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, name } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Hash phone number for privacy
    const hashedPhone = await hashPhoneNumber(phoneNumber);

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { phoneNumber: hashedPhone }
    });

    if (user) {
      return NextResponse.json(
        { error: 'User already exists with this phone number' },
        { status: 400 }
      );
    }

    // Create new user
    user = await db.user.create({
      data: {
        id: uuidv4(),
        phoneNumber: hashedPhone,
        name: name || `User_${phoneNumber.slice(-4)}`,
        about: 'Hey there! I am using WhatsApp Ultra',
        status: 'available'
      }
    });

    // Create default device
    const device = await db.device.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        deviceName: 'Primary Device',
        publicKey: uuidv4() // Demo public key
      }
    });

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      deviceId: device.id,
      name: user.name || ''
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        profilePic: user.profilePic,
        status: user.status,
        about: user.about
      },
      deviceId: device.id,
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
