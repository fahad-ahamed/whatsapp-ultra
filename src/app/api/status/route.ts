import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

// Status expires after 24 hours
const STATUS_EXPIRY_HOURS = 24

// GET statuses (my status and contacts' statuses)
export async function GET(request: NextRequest) {
  try {
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
    const type = searchParams.get('type') // 'my' or 'contacts'

    const now = new Date()

    if (type === 'my') {
      // Get my statuses
      const myStatuses = await db.status.findMany({
        where: {
          userId: payload.userId,
          expiresAt: { gt: now }
        },
        include: {
          views: {
            include: {
              viewer: {
                select: {
                  id: true,
                  name: true,
                  profilePic: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        success: true,
        statuses: myStatuses.map(s => ({
          id: s.id,
          mediaUrl: s.mediaUrl,
          caption: s.caption,
          type: s.type,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
          views: s.views.map(v => ({
            viewerId: v.viewerId,
            viewer: v.viewer,
            viewedAt: v.viewedAt
          })),
          viewCount: s.views.length
        }))
      })
    }

    // Get contacts' statuses
    // First, get user's contacts
    const contacts = await db.contact.findMany({
      where: {
        userId: payload.userId,
        isBlocked: false
      },
      select: { contactUserId: true }
    })

    const contactIds = contacts
      .map(c => c.contactUserId)
      .filter(Boolean) as string[]

    // Get statuses from contacts
    const contactStatuses = await db.status.findMany({
      where: {
        userId: { in: contactIds },
        expiresAt: { gt: now }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        },
        views: {
          where: { viewerId: payload.userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by user
    const groupedStatuses: Record<string, {
      user: { id: string; name: string; profilePic: string | null }
      statuses: Array<{
        id: string
        mediaUrl: string
        caption: string | null
        type: string
        createdAt: Date
        expiresAt: Date
        viewed: boolean
      }>
    }> = {}

    contactStatuses.forEach(status => {
      if (!groupedStatuses[status.userId]) {
        groupedStatuses[status.userId] = {
          user: status.user,
          statuses: []
        }
      }

      groupedStatuses[status.userId].statuses.push({
        id: status.id,
        mediaUrl: status.mediaUrl,
        caption: status.caption,
        type: status.type,
        createdAt: status.createdAt,
        expiresAt: status.expiresAt,
        viewed: status.views.length > 0
      })
    })

    return NextResponse.json({
      success: true,
      contactsStatuses: Object.values(groupedStatuses)
    })

  } catch (error) {
    console.error('Get statuses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new status
export async function POST(request: NextRequest) {
  try {
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
    const { mediaUrl, caption, type } = body

    if (!mediaUrl) {
      return NextResponse.json(
        { error: 'Media URL is required' },
        { status: 400 }
      )
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + STATUS_EXPIRY_HOURS)

    const status = await db.status.create({
      data: {
        userId: payload.userId,
        mediaUrl,
        caption: caption || null,
        type: type || 'image',
        expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      status: {
        id: status.id,
        mediaUrl: status.mediaUrl,
        caption: status.caption,
        type: status.type,
        createdAt: status.createdAt,
        expiresAt: status.expiresAt
      }
    })

  } catch (error) {
    console.error('Create status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a status
export async function DELETE(request: NextRequest) {
  try {
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
    const statusId = searchParams.get('statusId')

    if (!statusId) {
      return NextResponse.json(
        { error: 'Status ID is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const status = await db.status.findFirst({
      where: { id: statusId, userId: payload.userId }
    })

    if (!status) {
      return NextResponse.json(
        { error: 'Status not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    await db.status.delete({
      where: { id: statusId }
    })

    return NextResponse.json({
      success: true,
      message: 'Status deleted successfully'
    })

  } catch (error) {
    console.error('Delete status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
