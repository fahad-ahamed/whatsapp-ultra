'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message } from '@/stores/chatStore';
import { usePresenceStore } from '@/stores/presenceStore';

interface ServerToClientEvents {
  new_message: (message: Message) => void;
  message_sync: (message: Message) => void;
  message_status: (data: { messageId?: string; messageIds?: string[]; userId: string; status: string; timestamp: Date }) => void;
  message_edited: (data: { messageId: string; content: string; editedAt: Date }) => void;
  message_deleted: (data: { messageId: string; deletedBy: string; deletedAt: Date }) => void;
  user_typing: (data: { chatId: string; userId: string; userName: string; isTyping: boolean }) => void;
  presence_update: (data: { userId: string; status: string; lastSeen?: Date }) => void;
  online_users: (users: { userId: string; status: string; lastSeen: Date }[]) => void;
  added_to_group: (data: { groupId: string; chatId: string; name: string }) => void;
  removed_from_group: (data: { groupId: string; chatId: string }) => void;
  member_joined: (data: { chatId: string; userId: string }) => void;
  member_left: (data: { chatId: string; userId: string }) => void;
  incoming_call: (data: { callerId: string; callerName: string; offer: any; callType: string }) => void;
  call_answered: (data: { userId: string; answer: any }) => void;
  ice_candidate: (data: { userId: string; candidate: any }) => void;
  call_ended: (data: { userId: string }) => void;
  status_view: (data: { statusId: string; viewerId: string; viewerName: string; viewedAt: Date }) => void;
}

interface ClientToServerEvents {
  join_chat: (chatId: string) => void;
  leave_chat: (chatId: string) => void;
  send_message: (data: { chatId: string; messageId: string; content: string; messageType: string; mediaUrl?: string; timestamp: string }) => void;
  typing_start: (chatId: string) => void;
  typing_stop: (chatId: string) => void;
  message_delivered: (data: { messageId: string; chatId: string }) => void;
  message_read: (data: { messageIds: string[]; chatId: string }) => void;
  edit_message: (data: { messageId: string; chatId: string; content: string }) => void;
  delete_message: (data: { messageId: string; chatId: string; deleteForEveryone: boolean }) => void;
  update_presence: (data: { status: string }) => void;
  call_offer: (data: { targetUserId: string; offer: any; callType: string }) => void;
  call_answer: (data: { targetUserId: string; answer: any }) => void;
  call_ice_candidate: (data: { targetUserId: string; candidate: any }) => void;
  call_hangup: (data: { targetUserId: string }) => void;
  status_viewed: (data: { statusId: string; statusOwnerId: string }) => void;
}

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessage, deleteMessage: deleteMsgFromStore, setTypingUser, activeChat } = useChatStore();
  const { setPresence, setPresences } = usePresenceStore();

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io('/?XTransformPort=3003', {
      auth: { token },
      transports: ['websocket', 'polling']
    }) as Socket<ServerToClientEvents, ClientToServerEvents>;

    socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    // Message handlers
    socket.on('new_message', (message) => {
      addMessage(message.chatId, message);
    });

    socket.on('message_sync', (message) => {
      addMessage(message.chatId, message);
    });

    socket.on('message_status', (data) => {
      // Update message status
    });

    socket.on('message_edited', (data) => {
      if (activeChat) {
        updateMessage(activeChat.id, data.messageId, {
          content: data.content,
          isEdited: true
        });
      }
    });

    socket.on('message_deleted', (data) => {
      if (activeChat) {
        deleteMsgFromStore(activeChat.id, data.messageId);
      }
    });

    // Typing handlers
    socket.on('user_typing', (data) => {
      setTypingUser(data.chatId, data.userId, data.userName, data.isTyping);
    });

    // Presence handlers
    socket.on('presence_update', (data) => {
      setPresence(data.userId, {
        userId: data.userId,
        status: data.status as 'online' | 'offline',
        lastSeen: data.lastSeen
      });
    });

    socket.on('online_users', (users) => {
      setPresences(users.map(u => ({
        userId: u.userId,
        status: u.status as 'online' | 'offline',
        lastSeen: u.lastSeen
      })));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, addMessage, updateMessage, deleteMsgFromStore, setTypingUser, setPresence, setPresences, activeChat]);

  // Helper functions
  const joinChat = useCallback((chatId: string) => {
    socketRef.current?.emit('join_chat', chatId);
  }, []);

  const leaveChat = useCallback((chatId: string) => {
    socketRef.current?.emit('leave_chat', chatId);
  }, []);

  const sendMessage = useCallback((data: {
    chatId: string;
    messageId: string;
    content: string;
    messageType: string;
    mediaUrl?: string;
  }) => {
    socketRef.current?.emit('send_message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }, []);

  const startTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing_start', chatId);
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    socketRef.current?.emit('typing_stop', chatId);
  }, []);

  const markAsRead = useCallback((messageIds: string[], chatId: string) => {
    socketRef.current?.emit('message_read', { messageIds, chatId });
  }, []);

  const editMessage = useCallback((messageId: string, chatId: string, content: string) => {
    socketRef.current?.emit('edit_message', { messageId, chatId, content });
  }, []);

  const emitDeleteMessage = useCallback((messageId: string, chatId: string, deleteForEveryone: boolean) => {
    socketRef.current?.emit('delete_message', { messageId, chatId, deleteForEveryone });
  }, []);

  const updatePresence = useCallback((status: 'online' | 'away' | 'busy') => {
    socketRef.current?.emit('update_presence', { status });
  }, []);

  return {
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    editMessage,
    emitDeleteMessage,
    updatePresence
  };
}
