import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, extractToken } from '@/lib/auth'

// GET all groups for current user
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

    // Get all groups the user is part of
    const groupMemberships = await db.groupMember.findMany({
      where: { userId: payload.userId },
      include: {
        group: {
          include: {
            chat: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profilePic: true
                      }
                    }
                  }
                }
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePic: true,
                    lastSeen: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const groups = groupMemberships.map(membership => {
      const group = membership.group
      return {
        id: group.id,
        chatId: group.chatId,
        name: group.name,
        description: group.description,
        adminId: group.adminId,
        role: membership.role,
        members: group.members.map(m => ({
          userId: m.userId,
          role: m.role,
          user: m.user
        })),
        chatMembers: group.chat.members,
        createdAt: group.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      groups
    })

  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new group
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
    const { name, description, memberIds } = body

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Group name and at least one member are required' },
        { status: 400 }
      )
    }

    // Create chat and group together
    const chat = await db.chat.create({
      data: {
        type: 'group',
        name,
        members: {
          create: [
            { userId: payload.userId, role: 'admin' },
            ...memberIds.map((userId: string) => ({
              userId,
              role: 'member' as const
            }))
          ]
        },
        group: {
          create: {
            name,
            description: description || null,
            adminId: payload.userId,
            members: {
              create: [
                { userId: payload.userId, role: 'admin' },
                ...memberIds.map((userId: string) => ({
                  userId,
                  role: 'member' as const
                }))
              ]
            }
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePic: true
              }
            }
          }
        },
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePic: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      group: {
        id: chat.group!.id,
        chatId: chat.id,
        name: chat.group!.name,
        description: chat.group!.description,
        adminId: chat.group!.adminId,
        members: chat.group!.members,
        chatMembers: chat.members
      }
    })

  } catch (error) {
    console.error('Create group error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
