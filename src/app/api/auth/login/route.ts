import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, hashPhoneNumber } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, deviceName } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Hash phone number
    const hashedPhone = await hashPhoneNumber(phoneNumber);

    // Find user
    const user = await db.user.findUnique({
      where: { phoneNumber: hashedPhone }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Get or create device
    let device = await db.device.findFirst({
      where: {
        userId: user.id,
        deviceName: deviceName || 'Primary Device'
      }
    });

    if (!device) {
      device = await db.device.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          deviceName: deviceName || 'Primary Device',
          publicKey: uuidv4()
        }
      });
    }

    // Update last active
    await db.device.update({
      where: { id: device.id },
      data: { lastActive: new Date() }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
