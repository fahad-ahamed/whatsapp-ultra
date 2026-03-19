import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = extractToken(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { deviceName, publicKey, identityKey, signedPreKey, signedPreKeySignature, preKeys } = body

    if (!deviceName) {
      return NextResponse.json(
        { error: 'Device name is required' },
        { status: 400 }
      )
    }

    // Create or update device
    const device = await db.device.create({
      data: {
        userId: payload.userId,
        deviceName,
        publicKey: publicKey || '',
        lastActive: new Date(),
        isActive: true
      }
    })

    // Create key bundle if provided
    if (identityKey && signedPreKey && preKeys) {
      await db.keyBundle.create({
        data: {
          userId: payload.userId,
          deviceId: device.id,
          identityKey,
          signedPreKey,
          signedPreKeySignature: signedPreKeySignature || '',
          preKeys: JSON.stringify(preKeys)
        }
      })
    }

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        deviceName: device.deviceName,
        isActive: device.isActive,
        lastActive: device.lastActive
      }
    })

  } catch (error) {
    console.error('Device registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's devices
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = extractToken(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const devices = await db.device.findMany({
      where: { userId: payload.userId },
      select: {
        id: true,
        deviceName: true,
        lastActive: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { lastActive: 'desc' }
    })

    return NextResponse.json({
      success: true,
      devices
    })

  } catch (error) {
    console.error('Get devices error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete device
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = extractToken(authHeader || undefined)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      )
    }

    // Verify device belongs to user
    const device = await db.device.findFirst({
      where: { id: deviceId, userId: payload.userId }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    await db.device.delete({
      where: { id: deviceId }
    })

    return NextResponse.json({
      success: true,
      message: 'Device removed successfully'
    })

  } catch (error) {
    console.error('Delete device error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
