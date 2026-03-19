import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - Get messages for a chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const before = searchParams.get('before'); // message ID for pagination
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify user is member of chat
    const membership = await db.chatMember.findFirst({
      where: { chatId, userId: user.id, leftAt: null }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query
    const whereClause: any = { chatId, isDeleted: false };
    if (before) {
      const beforeMessage = await db.message.findUnique({
        where: { id: before },
        select: { timestamp: true }
      });
      if (beforeMessage) {
        whereClause.timestamp = { lt: beforeMessage.timestamp };
      }
    }

    const messages = await db.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, profilePic: true }
        },
        statuses: {
          where: { userId: user.id }
        },
        replyTo: {
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      sender: msg.sender,
      content: msg.content,
      messageType: msg.messageType,
      mediaUrl: msg.mediaUrl,
      mediaName: msg.mediaName,
      mediaSize: msg.mediaSize,
      timestamp: msg.timestamp.toISOString(),
      isEdited: msg.isEdited,
      isDeleted: msg.isDeleted,
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
        senderName: msg.replyTo.sender.name
      } : undefined,
      status: msg.statuses[0]?.readAt
        ? 'read'
        : msg.statuses[0]?.deliveredAt
          ? 'delivered'
          : 'sent'
    }));

    return NextResponse.json({
      messages: formattedMessages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    const body = await request.json();
    const { content, messageType = 'text', mediaUrl, mediaName, mediaSize, replyToId } = body;

    // Verify user is member of chat
    const membership = await db.chatMember.findFirst({
      where: { chatId, userId: user.id, leftAt: null }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message
    const message = await db.message.create({
      data: {
        id: uuidv4(),
        chatId,
        senderId: user.id,
        content: content || '',
        messageType,
        mediaUrl,
        mediaName,
        mediaSize,
        replyToId
      },
      include: {
        sender: {
          select: { id: true, name: true, profilePic: true }
        }
      }
    });

    // Create message status for all chat members
    const chatMembers = await db.chatMember.findMany({
      where: { chatId, leftAt: null }
    });

    await db.messageStatus.createMany({
      data: chatMembers.map((member) => ({
        id: uuidv4(),
        messageId: message.id,
        userId: member.userId,
        deliveredAt: new Date()
      }))
    });

    // Update chat's updatedAt
    await db.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      message: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        sender: message.sender,
        content: message.content,
        messageType: message.messageType,
        mediaUrl: message.mediaUrl,
        timestamp: message.timestamp.toISOString(),
        isEdited: false,
        isDeleted: false,
        replyToId: message.replyToId
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
