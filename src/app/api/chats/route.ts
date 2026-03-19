import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - List all chats for the authenticated user
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatMembers = await db.chatMember.findMany({
      where: {
        userId: user.id,
        leftAt: null
      },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePic: true,
                    phoneNumber: true,
                    lastSeen: true
                  }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { timestamp: 'desc' }
            },
            group: true
          }
        }
      },
      orderBy: {
        chat: {
          updatedAt: 'desc'
        }
      }
    });

    const chats = chatMembers.map((cm) => {
      const otherMembers = cm.chat.members.filter((m) => m.userId !== user.id);
      const unreadCount = 0; // Would calculate from message statuses

      return {
        id: cm.chat.id,
        type: cm.chat.type,
        name: cm.chat.type === 'group' 
          ? cm.chat.group?.name 
          : otherMembers[0]?.user.name || 'Unknown',
        members: cm.chat.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          user: m.user,
          role: m.role
        })),
        lastMessage: cm.chat.messages[0] ? {
          id: cm.chat.messages[0].id,
          content: cm.chat.messages[0].content,
          senderId: cm.chat.messages[0].senderId,
          timestamp: cm.chat.messages[0].timestamp.toISOString(),
          messageType: cm.chat.messages[0].messageType
        } : undefined,
        unreadCount,
        createdAt: cm.chat.createdAt.toISOString(),
        updatedAt: cm.chat.updatedAt.toISOString()
      };
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new chat
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, memberIds } = body;

    if (type === 'individual' && memberIds?.length === 1) {
      // Check if chat already exists between these users
      const existingChat = await db.chatMember.findFirst({
        where: {
          userId: user.id,
          leftAt: null,
          chat: {
            type: 'individual',
            members: {
              some: {
                userId: memberIds[0]
              }
            }
          }
        },
        include: { chat: true }
      });

      if (existingChat) {
        return NextResponse.json({ chat: existingChat.chat });
      }
    }

    // Create new chat
    const chatId = uuidv4();
    const chat = await db.chat.create({
      data: {
        id: chatId,
        type: type || 'individual',
        name: type === 'group' ? name : null
      }
    });

    // Add current user as member (admin for groups)
    await db.chatMember.create({
      data: {
        id: uuidv4(),
        chatId: chat.id,
        userId: user.id,
        role: type === 'group' ? 'admin' : 'member'
      }
    });

    // Add other members
    if (memberIds && memberIds.length > 0) {
      await db.chatMember.createMany({
        data: memberIds.map((memberId: string) => ({
          id: uuidv4(),
          chatId: chat.id,
          userId: memberId,
          role: 'member'
        }))
      });
    }

    // Create group record if group chat
    if (type === 'group') {
      await db.group.create({
        data: {
          id: uuidv4(),
          chatId: chat.id,
          name: name || 'New Group',
          adminId: user.id
        }
      });
    }

    // Fetch complete chat data
    const completeChat = await db.chat.findUnique({
      where: { id: chat.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePic: true,
                phoneNumber: true
              }
            }
          }
        },
        group: true
      }
    });

    return NextResponse.json({ chat: completeChat });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
