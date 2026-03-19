import { create } from 'zustand';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice';
  mediaUrl?: string;
  timestamp: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  deliveredTo?: string[];
  readBy?: string[];
}

export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name: string | null;
  members: ChatMember[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    profilePic: string | null;
    phoneNumber: string;
  };
  role: 'admin' | 'member';
}

interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, TypingUser[]>;
  isLoading: boolean;
  isSending: boolean;

  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  setActiveChat: (chat: Chat | null) => void;
  
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  
  setTypingUser: (chatId: string, userId: string, userName: string, isTyping: boolean) => void;
  clearTypingUsers: (chatId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  isLoading: false,
  isSending: false,

  setChats: (chats) => set({ chats }),

  addChat: (chat) => set((state) => ({
    chats: [chat, ...state.chats]
  })),

  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, ...updates } : chat
    ),
    activeChat: state.activeChat?.id === chatId
      ? { ...state.activeChat, ...updates }
      : state.activeChat
  })),

  removeChat: (chatId) => set((state) => ({
    chats: state.chats.filter((chat) => chat.id !== chatId),
    activeChat: state.activeChat?.id === chatId ? null : state.activeChat
  })),

  setActiveChat: (chat) => set({ activeChat: chat }),

  setMessages: (chatId, messages) => set((state) => ({
    messages: { ...state.messages, [chatId]: messages }
  })),

  addMessage: (chatId, message) => set((state) => {
    const existingMessages = state.messages[chatId] || [];
    // Avoid duplicates
    if (existingMessages.some((m) => m.id === message.id)) {
      return state;
    }
    return {
      messages: {
        ...state.messages,
        [chatId]: [...existingMessages, message]
      }
    };
  }),

  updateMessage: (chatId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }
  })),

  deleteMessage: (chatId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: (state.messages[chatId] || []).filter((msg) => msg.id !== messageId)
    }
  })),

  prependMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...messages, ...(state.messages[chatId] || [])]
    }
  })),

  setTypingUser: (chatId, userId, userName, isTyping) => set((state) => {
    const currentTyping = state.typingUsers[chatId] || [];
    const filtered = currentTyping.filter((t) => t.userId !== userId);
    
    if (isTyping) {
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: [...filtered, { userId, userName, isTyping }]
        }
      };
    } else {
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: filtered
        }
      };
    }
  }),

  clearTypingUsers: (chatId) => set((state) => ({
    typingUsers: { ...state.typingUsers, [chatId]: [] }
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setSending: (isSending) => set({ isSending }),

  incrementUnread: (chatId) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, unreadCount: chat.unreadCount + 1 } : chat
    )
  })),

  clearUnread: (chatId) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    )
  }))
}));
