import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET group members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params
    
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

    // Check if user is a member of the group
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId: payload.userId }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    // Get all group members
    const members = await db.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            status: true,
            lastSeen: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    })

    return NextResponse.json({
      success: true,
      members: members.map(m => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user
      }))
    })

  } catch (error) {
    console.error('Get group members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST add member to group
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params
    
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

    // Check if user is admin of the group
    const adminMembership = await db.groupMember.findFirst({
      where: { groupId, userId: payload.userId, role: 'admin' }
    })

    if (!adminMembership) {
      return NextResponse.json(
        { error: 'Only group admins can add members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMember = await db.groupMember.findFirst({
      where: { groupId, userId }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 400 }
      )
    }

    // Get the group to find chatId
    const group = await db.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Add to group members
    const newMember = await db.groupMember.create({
      data: {
        groupId,
        userId,
        role: role || 'member'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        }
      }
    })

    // Also add to chat members
    await db.chatMember.create({
      data: {
        chatId: group.chatId,
        userId,
        role: role || 'member'
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        userId: newMember.userId,
        role: newMember.role,
        joinedAt: newMember.joinedAt,
        user: newMember.user
      }
    })

  } catch (error) {
    console.error('Add group member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params
    
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

    // Check if user is admin
    const adminMembership = await db.groupMember.findFirst({
      where: { groupId, userId: payload.userId, role: 'admin' }
    })

    if (!adminMembership) {
      return NextResponse.json(
        { error: 'Only group admins can update member roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Update member role
    const member = await db.groupMember.update({
      where: { groupId_userId: { groupId, userId } },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        }
      }
    })

    // Also update in chat members
    const group = await db.group.findUnique({
      where: { id: groupId }
    })

    if (group) {
      await db.chatMember.update({
        where: {
          chatId_userId: { chatId: group.chatId, userId }
        },
        data: { role }
      })
    }

    return NextResponse.json({
      success: true,
      member: {
        userId: member.userId,
        role: member.role,
        user: member.user
      }
    })

  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE remove member from group
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: groupId } = await params
    
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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user is admin or removing themselves
    const membership = await db.groupMember.findFirst({
      where: { groupId, userId: payload.userId }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    if (membership.role !== 'admin' && userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Only group admins can remove other members' },
        { status: 403 }
      )
    }

    // Get the group to find chatId
    const group = await db.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Remove from group members
    await db.groupMember.delete({
      where: { groupId_userId: { groupId, userId } }
    })

    // Update chat member (set leftAt instead of deleting)
    await db.chatMember.update({
      where: {
        chatId_userId: { chatId: group.chatId, userId }
      },
      data: { leftAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: userId === payload.userId ? 'You left the group' : 'Member removed from group'
    })

  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
