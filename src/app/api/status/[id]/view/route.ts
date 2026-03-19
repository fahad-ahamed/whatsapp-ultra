import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST mark status as viewed
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: statusId } = await params
    
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

    // Check if status exists
    const status = await db.status.findUnique({
      where: { id: statusId }
    })

    if (!status) {
      return NextResponse.json(
        { error: 'Status not found' },
        { status: 404 }
      )
    }

    // Don't allow viewing own status
    if (status.userId === payload.userId) {
      return NextResponse.json({
        success: true,
        message: 'Cannot mark own status as viewed'
      })
    }

    // Check if already viewed
    const existingView = await db.statusView.findUnique({
      where: {
        statusId_viewerId: {
          statusId,
          viewerId: payload.userId
        }
      }
    })

    if (existingView) {
      return NextResponse.json({
        success: true,
        message: 'Status already viewed',
        viewedAt: existingView.viewedAt
      })
    }

    // Create view record
    const view = await db.statusView.create({
      data: {
        statusId,
        viewerId: payload.userId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Status marked as viewed',
      viewedAt: view.viewedAt
    })

  } catch (error) {
    console.error('View status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET viewers of a status (only for status owner)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: statusId } = await params
    
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

    // Verify ownership
    const status = await db.status.findFirst({
      where: { id: statusId, userId: payload.userId }
    })

    if (!status) {
      return NextResponse.json(
        { error: 'Status not found or you do not have permission' },
        { status: 404 }
      )
    }

    // Get all views
    const views = await db.statusView.findMany({
      where: { statusId },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      views: views.map(v => ({
        viewerId: v.viewerId,
        viewer: v.viewer,
        viewedAt: v.viewedAt
      }))
    })

  } catch (error) {
    console.error('Get status viewers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
