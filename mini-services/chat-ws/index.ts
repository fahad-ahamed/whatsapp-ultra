import { createServer } from 'http';
import { Server } from 'socket.io';
import { jwtVerify, SignJWT } from 'jose';

// In-memory stores for demo (would use Redis in production)
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
const userSockets = new Map<string, { userId: string; deviceId: string }>(); // socketId -> user info
const typingUsers = new Map<string, Set<string>>(); // chatId -> Set of userIds
const presenceCache = new Map<string, { status: 'online' | 'offline'; lastSeen: Date }>();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = new TextEncoder().encode('whatsapp-ultra-secret-key-2024');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// JWT Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    socket.data.userId = payload.userId as string;
    socket.data.deviceId = payload.deviceId as string;
    socket.data.name = payload.name as string;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  const deviceId = socket.data.deviceId;
  const userName = socket.data.name || 'Unknown User';

  console.log(`[WS] User connected: ${userName} (${userId}) on device ${deviceId}`);

  // Track connected user
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId)!.add(socket.id);
  userSockets.set(socket.id, { userId, deviceId });

  // Update presence to online
  presenceCache.set(userId, { status: 'online', lastSeen: new Date() });

  // Broadcast user online status to all contacts
  socket.broadcast.emit('presence_update', {
    userId,
    status: 'online',
    timestamp: new Date()
  });

  // Send current online users to the newly connected user
  const onlineUsers = Array.from(presenceCache.entries())
    .filter(([id]) => id !== userId)
    .filter(([, data]) => data.status === 'online')
    .map(([id, data]) => ({ userId: id, ...data }));
  
  socket.emit('online_users', onlineUsers);

  // ============== CHAT EVENTS ==============

  // Join a chat room
  socket.on('join_chat', (chatId: string) => {
    socket.join(`chat:${chatId}`);
    console.log(`[WS] User ${userName} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
    console.log(`[WS] User ${userName} left chat ${chatId}`);
  });

  // ============== MESSAGE EVENTS ==============

  // Send a new message
  socket.on('send_message', async (data: {
    chatId: string;
    messageId: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
    timestamp: string;
    replyToId?: string;
  }) => {
    console.log(`[WS] Message from ${userName} in chat ${data.chatId}: ${data.content.substring(0, 50)}...`);

    const messageData = {
      ...data,
      senderId: userId,
      senderName: userName,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // Broadcast to all users in the chat (including sender for multi-device sync)
    io.to(`chat:${data.chatId}`).emit('new_message', messageData);

    // Emit to all user's devices for sync
    const userSocketIds = connectedUsers.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        if (socketId !== socket.id) {
          io.to(socketId).emit('message_sync', messageData);
        }
      });
    }
  });

  // Message delivered receipt
  socket.on('message_delivered', (data: { messageId: string; chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('message_status', {
      messageId: data.messageId,
      userId,
      status: 'delivered',
      timestamp: new Date()
    });
  });

  // Message read receipt
  socket.on('message_read', (data: { messageIds: string[]; chatId: string }) => {
    socket.to(`chat:${data.chatId}`).emit('message_status', {
      messageIds: data.messageIds,
      userId,
      status: 'read',
      timestamp: new Date()
    });
  });

  // Edit message
  socket.on('edit_message', (data: { messageId: string; chatId: string; content: string }) => {
    io.to(`chat:${data.chatId}`).emit('message_edited', {
      messageId: data.messageId,
      content: data.content,
      editedAt: new Date(),
      editedBy: userId
    });
  });

  // Delete message
  socket.on('delete_message', (data: { messageId: string; chatId: string; deleteForEveryone: boolean }) => {
    if (data.deleteForEveryone) {
      io.to(`chat:${data.chatId}`).emit('message_deleted', {
        messageId: data.messageId,
        deletedBy: userId,
        deletedAt: new Date()
      });
    } else {
      // Delete for me only - just notify sender's other devices
      const userSocketIds = connectedUsers.get(userId);
      if (userSocketIds) {
        userSocketIds.forEach(socketId => {
          if (socketId !== socket.id) {
            io.to(socketId).emit('message_deleted_for_me', {
              messageId: data.messageId,
              chatId: data.chatId
            });
          }
        });
      }
    }
  });

  // ============== TYPING EVENTS ==============

  socket.on('typing_start', (chatId: string) => {
    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Set());
    }
    typingUsers.get(chatId)!.add(userId);

    socket.to(`chat:${chatId}`).emit('user_typing', {
      chatId,
      userId,
      userName,
      isTyping: true
    });
  });

  socket.on('typing_stop', (chatId: string) => {
    const typers = typingUsers.get(chatId);
    if (typers) {
      typers.delete(userId);
    }

    socket.to(`chat:${chatId}`).emit('user_typing', {
      chatId,
      userId,
      userName,
      isTyping: false
    });
  });

  // ============== PRESENCE EVENTS ==============

  socket.on('update_presence', (data: { status: 'online' | 'away' | 'busy' }) => {
    presenceCache.set(userId, {
      status: data.status === 'online' ? 'online' : 'offline',
      lastSeen: new Date()
    });

    socket.broadcast.emit('presence_update', {
      userId,
      status: data.status,
      timestamp: new Date()
    });
  });

  // ============== GROUP EVENTS ==============

  socket.on('group_created', (data: { groupId: string; chatId: string; name: string; members: string[] }) => {
    // Notify all group members
    data.members.forEach(memberId => {
      const memberSockets = connectedUsers.get(memberId);
      if (memberSockets) {
        memberSockets.forEach(socketId => {
          io.to(socketId).emit('added_to_group', data);
        });
      }
    });
  });

  socket.on('group_member_added', (data: { groupId: string; chatId: string; userId: string; addedBy: string }) => {
    const newMemberSockets = connectedUsers.get(data.userId);
    if (newMemberSockets) {
      newMemberSockets.forEach(socketId => {
        io.to(socketId).emit('added_to_group', data);
      });
    }

    io.to(`chat:${data.chatId}`).emit('member_joined', {
      chatId: data.chatId,
      userId: data.userId,
      addedBy: data.addedBy
    });
  });

  socket.on('group_member_removed', (data: { groupId: string; chatId: string; userId: string; removedBy: string }) => {
    const removedSockets = connectedUsers.get(data.userId);
    if (removedSockets) {
      removedSockets.forEach(socketId => {
        io.to(socketId).emit('removed_from_group', data);
      });
    }

    io.to(`chat:${data.chatId}`).emit('member_left', {
      chatId: data.chatId,
      userId: data.userId,
      removedBy: data.removedBy
    });
  });

  // ============== CALL SIGNALING ==============

  socket.on('call_offer', (data: { targetUserId: string; offer: any; callType: 'audio' | 'video' }) => {
    const targetSockets = connectedUsers.get(data.targetUserId);
    if (targetSockets) {
      targetSockets.forEach(socketId => {
        io.to(socketId).emit('incoming_call', {
          callerId: userId,
          callerName: userName,
          offer: data.offer,
          callType: data.callType
        });
      });
    }
  });

  socket.on('call_answer', (data: { targetUserId: string; answer: any }) => {
    const targetSockets = connectedUsers.get(data.targetUserId);
    if (targetSockets) {
      targetSockets.forEach(socketId => {
        io.to(socketId).emit('call_answered', {
          userId,
          answer: data.answer
        });
      });
    }
  });

  socket.on('call_ice_candidate', (data: { targetUserId: string; candidate: any }) => {
    const targetSockets = connectedUsers.get(data.targetUserId);
    if (targetSockets) {
      targetSockets.forEach(socketId => {
        io.to(socketId).emit('ice_candidate', {
          userId,
          candidate: data.candidate
        });
      });
    }
  });

  socket.on('call_hangup', (data: { targetUserId: string }) => {
    const targetSockets = connectedUsers.get(data.targetUserId);
    if (targetSockets) {
      targetSockets.forEach(socketId => {
        io.to(socketId).emit('call_ended', { userId });
      });
    }
  });

  // ============== STATUS/STORY EVENTS ==============

  socket.on('status_viewed', (data: { statusId: string; statusOwnerId: string }) => {
    const ownerSockets = connectedUsers.get(data.statusOwnerId);
    if (ownerSockets) {
      ownerSockets.forEach(socketId => {
        io.to(socketId).emit('status_view', {
          statusId: data.statusId,
          viewerId: userId,
          viewerName: userName,
          viewedAt: new Date()
        });
      });
    }
  });

  // ============== DISCONNECT ==============

  socket.on('disconnect', () => {
    console.log(`[WS] User disconnected: ${userName} (${userId})`);

    // Remove from connected users
    const userSocketIds = connectedUsers.get(userId);
    if (userSocketIds) {
      userSocketIds.delete(socket.id);
      if (userSocketIds.size === 0) {
        connectedUsers.delete(userId);
        
        // Update presence to offline
        presenceCache.set(userId, { status: 'offline', lastSeen: new Date() });

        // Broadcast offline status
        socket.broadcast.emit('presence_update', {
          userId,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    }

    // Remove socket mapping
    userSockets.delete(socket.id);

    // Clean up typing status
    typingUsers.forEach((typers, chatId) => {
      if (typers.has(userId)) {
        typers.delete(userId);
        socket.to(`chat:${chatId}`).emit('user_typing', {
          chatId,
          userId,
          userName,
          isTyping: false
        });
      }
    });
  });
});

// Generate JWT token helper (for testing)
async function generateToken(userId: string, deviceId: string, name: string): Promise<string> {
  return await new SignJWT({ userId, deviceId, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[WS] Chat WebSocket Server running on port ${PORT}`);
});

export { generateToken };
