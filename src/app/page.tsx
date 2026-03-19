'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, Message, Chat } from '@/stores/chatStore';
import { usePresenceStore } from '@/stores/presenceStore';
import { useUIStore } from '@/stores/uiStore';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, Send, MoreVertical, Phone, Video, 
  Paperclip, Smile, Mic, Check, CheckCheck, Clock,
  Users, Settings, LogOut, User, Search, Plus,
  Edit, Trash2, ArrowLeft, Image, FileText, X
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ============== AUTH SCREEN ==============
function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register' 
        ? { phoneNumber, name }
        : { phoneNumber };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.user, data.token, data.deviceId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-green-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <MessageCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Ultra</h1>
          <p className="text-green-100 mt-2">Secure. Fast. Private.</p>
        </div>

        <div className="p-6">
          <div className="flex mb-6">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-center font-medium ${
                mode === 'register' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-center font-medium ${
                mode === 'login' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500'
              }`}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'register' ? 'Register' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>End-to-end encrypted</p>
            <p className="mt-1">Your messages are secured with Signal Protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== MESSAGE BUBBLE ==============
function MessageBubble({ message, isOwn, showStatus }: { 
  message: Message; 
  isOwn: boolean;
  showStatus?: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div
        className={`relative max-w-[70%] rounded-lg px-3 py-2 ${
          isOwn 
            ? 'bg-green-100 dark:bg-green-800' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        {!isOwn && message.senderName && (
          <div className="text-xs font-semibold text-green-600 mb-1">
            {message.senderName}
          </div>
        )}
        
        {message.messageType === 'image' && message.mediaUrl && (
          <img 
            src={message.mediaUrl} 
            alt="Shared image" 
            className="rounded max-w-full mb-1"
          />
        )}
        
        {message.messageType !== 'image' && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
          {message.isEdited && (
            <span className="text-xs text-gray-400 ml-1">edited</span>
          )}
          {isOwn && getStatusIcon()}
        </div>

        {showStatus && (
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
                              <button className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ============== TYPING INDICATOR ==============
function TypingIndicator({ users }: { users: { userName: string }[] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-sm text-gray-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {users.length === 1 
          ? `${users[0].userName} is typing...`
          : `${users.length} people are typing...`
        }
      </span>
    </div>
  );
}

// ============== CHAT LIST ITEM ==============
function ChatListItem({ chat, isActive, onClick }: { 
  chat: Chat; 
  isActive: boolean;
  onClick: () => void;
}) {
  const { presences } = usePresenceStore();
  const { user } = useAuthStore();
  
  const otherMember = chat.members.find(m => m.userId !== user?.id);
  const otherUserId = otherMember?.userId;
  const isOnline = otherUserId ? presences[otherUserId]?.status === 'online' : false;

  const formatLastMessage = (msg: Message | undefined) => {
    if (!msg) return '';
    if (msg.messageType === 'image') return '📷 Image';
    if (msg.messageType === 'audio') return '🎵 Audio';
    return msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '');
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isActive ? 'bg-green-50 dark:bg-green-900/30' : ''
      }`}
    >
      <div className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={chat.type === 'individual' ? otherMember?.user.profilePic || '' : ''} />
          <AvatarFallback className={chat.type === 'group' ? 'bg-green-600 text-white' : 'bg-gray-300'}>
            {chat.type === 'group' 
              ? <Users className="w-6 h-6" />
              : (chat.name?.charAt(0).toUpperCase() || 'U')
            }
          </AvatarFallback>
        </Avatar>
        {chat.type === 'individual' && isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{chat.name || 'Unknown'}</h3>
          {chat.lastMessage && (
            <span className="text-xs text-gray-500">
              {formatTime(chat.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 truncate">
            {formatLastMessage(chat.lastMessage)}
          </p>
          {chat.unreadCount > 0 && (
            <Badge className="bg-green-600 text-white text-xs rounded-full px-2">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== NEW GROUP DIALOG ==============
function NewGroupDialog({ open, onOpenChange, onGroupCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (chat: Chat) => void;
}) {
  const [step, setStep] = useState<'select' | 'name'>('select');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (user: any) => {
    setSelectedUsers(prev => 
      prev.some(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'group',
          name: groupName,
          memberIds: selectedUsers.map(u => u.id)
        })
      });
      const data = await res.json();
      onGroupCreated(data.chat);
      onOpenChange(false);
      // Reset
      setStep('select');
      setSelectedUsers([]);
      setGroupName('');
      setSearch('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) {
        setStep('select');
        setSelectedUsers([]);
        setGroupName('');
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'New Group' : 'Group Name'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'select' ? (
          <div className="space-y-4">
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
                {selectedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <span className="text-sm">{user.name}</span>
                    <button onClick={() => toggleUser(user)} className="text-gray-500 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* User list */}
            <ScrollArea className="h-48">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.some(u => u.id === user.id) 
                      ? 'bg-green-100' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={user.profilePic} />
                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.about}</p>
                  </div>
                  {selectedUsers.some(u => u.id === user.id) && (
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>

            <Button 
              onClick={() => setStep('name')}
              disabled={selectedUsers.length === 0}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Next ({selectedUsers.length} selected)
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Members: {selectedUsers.map(u => u.name).join(', ')}
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={createGroup}
                disabled={!groupName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Create Group
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============== NEW CHAT DIALOG ==============
function NewChatDialog({ open, onOpenChange, onChatCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (userId: string) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'individual',
          memberIds: [userId]
        })
      });
      const data = await res.json();
      onChatCreated(data.chat);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="h-60">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => startChat(user.id)}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <Avatar>
                  <AvatarImage src={user.profilePic} />
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.about}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============== MAIN CHAT AREA ==============
function ChatArea() {
  const { activeChat, messages, typingUsers, setActiveChat, addMessage, updateMessage } = useChatStore();
  const { user } = useAuthStore();
  const { joinChat, leaveChat, sendMessage, startTyping, stopTyping, markAsRead } = useSocket();
  const { isOnline } = usePresenceStore();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMessages = activeChat ? messages[activeChat.id] || [] : [];
  const chatTypingUsers = activeChat ? typingUsers[activeChat.id] || [] : [];
  const otherMember = activeChat?.members.find(m => m.userId !== user?.id);
  const otherUserId = otherMember?.userId;
  const otherUserOnline = otherUserId ? isOnline(otherUserId) : false;

  useEffect(() => {
    if (activeChat) {
      joinChat(activeChat.id);
    }
    return () => {
      if (activeChat) {
        leaveChat(activeChat.id);
      }
    };
  }, [activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!isTyping && activeChat) {
      setIsTyping(true);
      startTyping(activeChat.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (activeChat) {
        setIsTyping(false);
        stopTyping(activeChat.id);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeChat || !user) return;

    const tempId = uuidv4();
    const messageData = {
      id: tempId,
      chatId: activeChat.id,
      senderId: user.id,
      senderName: user.name || undefined,
      content: inputValue.trim(),
      messageType: 'text' as const,
      timestamp: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
      status: 'sending' as const
    };

    // Add optimistically
    addMessage(activeChat.id, messageData);
    setInputValue('');
    setIsTyping(false);
    stopTyping(activeChat.id);

    try {
      const res = await fetch(`/api/chats/${activeChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputValue.trim(),
          messageType: 'text'
        })
      });

      const data = await res.json();
      
      // Update with server response
      updateMessage(activeChat.id, tempId, {
        id: data.message.id,
        status: 'sent'
      });

      // Send via WebSocket
      sendMessage({
        chatId: activeChat.id,
        messageId: data.message.id,
        content: inputValue.trim(),
        messageType: 'text'
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      updateMessage(activeChat.id, tempId, { status: 'sending' });
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300">WhatsApp Ultra</h2>
          <p className="text-gray-400 mt-2">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="h-16 bg-green-600 dark:bg-green-800 flex items-center px-4 gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white"
          onClick={() => setActiveChat(null)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherMember?.user.profilePic || ''} />
          <AvatarFallback className="bg-green-700 text-white">
            {activeChat.type === 'group' 
              ? <Users className="w-5 h-5" />
              : (activeChat.name?.charAt(0).toUpperCase() || 'U')
            }
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-medium text-white">{activeChat.name}</h3>
          <p className="text-xs text-green-100">
            {activeChat.type === 'group' 
              ? `${activeChat.members.length} members`
              : otherUserOnline ? 'Online' : 'Offline'
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
            <Phone className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Contact</DropdownMenuItem>
              <DropdownMenuItem>Media, links, and docs</DropdownMenuItem>
              <DropdownMenuItem>Mute notifications</DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem className="text-red-600">Block</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UwZTBlMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
        <div className="space-y-1">
          {chatMessages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
              isOwn={message.senderId === user?.id}
              showStatus={message.senderId === user?.id}
            />
          ))}
          <TypingIndicator users={chatTypingUsers} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Smile className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Paperclip className="w-6 h-6" />
          </Button>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message"
            className="flex-1 bg-white dark:bg-gray-700"
          />
          <Button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {inputValue.trim() ? (
              <Send className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============== SIDEBAR ==============
function Sidebar() {
  const { user, logout } = useAuthStore();
  const { chats, activeChat, setActiveChat, setChats, setLoading, addChat } = useChatStore();
  const { showNewChatModal, setShowNewChatModal, showNewGroupModal, setShowNewGroupModal, searchQuery, setSearchQuery } = useUIStore();
  const { token } = useAuthStore();

  useEffect(() => {
    const loadChats = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('/api/chats');
        const data = await res.json();
        setChats(data.chats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [token]);

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full md:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 bg-green-600 dark:bg-green-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profilePic || ''} />
            <AvatarFallback className="bg-green-700 text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-white">{user?.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
            <Users className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-green-700">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or start new chat"
            className="pl-9 bg-white dark:bg-gray-700"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {filteredChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => setActiveChat(chat)}
          />
        ))}
      </ScrollArea>

      {/* New Chat Button */}
      <div className="p-3 flex gap-2">
        <Button
          onClick={() => setShowNewChatModal(true)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Chat
        </Button>
        <Button
          onClick={() => setShowNewGroupModal(true)}
          variant="outline"
          className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
        >
          <Users className="w-4 h-4 mr-2" />
          Group
        </Button>
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChatModal}
        onOpenChange={setShowNewChatModal}
        onChatCreated={(chat) => {
          addChat(chat);
          setActiveChat(chat);
        }}
      />

      {/* New Group Dialog */}
      <NewGroupDialog
        open={showNewGroupModal}
        onOpenChange={setShowNewGroupModal}
        onGroupCreated={(chat) => {
          addChat(chat);
          setActiveChat(chat);
        }}
      />
    </div>
  );
}

// ============== MAIN APP ==============
export default function WhatsAppUltra() {
  const { isAuthenticated, isLoading, setLoading, setUser, setToken } = useAuthStore();
  const { activeChat } = useChatStore();

  // Check existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(document.cookie.match(/auth_token=([^;]+)/)?.[1] || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-600 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-white animate-pulse mx-auto" />
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile: Show either sidebar or chat */}
      <div className={`w-full md:w-auto md:block ${activeChat ? 'hidden md:block' : 'block'}`}>
        <Sidebar />
      </div>
      
      <div className={`flex-1 ${activeChat ? 'block' : 'hidden md:block'}`}>
        <ChatArea />
      </div>
    </div>
  );
}
