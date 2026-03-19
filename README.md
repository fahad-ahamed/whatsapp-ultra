# WhatsApp Ultra Full System 🚀

A comprehensive, production-ready WhatsApp-like messaging application built with modern web technologies.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=flat-square&logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-6-blue?style=flat-square&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### Core Messaging
- 📱 Real-time messaging with WebSocket (Socket.io)
- 💬 Individual and group chats
- ✍️ Typing indicators
- ✓✓ Message status (sent, delivered, read - blue ticks)
- 🖼️ Media upload support (images, videos, documents)
- 🔔 Push notifications ready

### Authentication & Security
- 🔐 JWT-based authentication
- 📞 Phone number registration/login
- 🔑 Multi-device support
- 🛡️ Signal Protocol encryption schema ready

### Social Features
- 👥 Group chat with admin controls
- 🟢 Online/offline presence
- 👤 User profiles with status/ bio
- 🔍 User search functionality

### UI/UX
- 🎨 WhatsApp-like green theme
- 📱 Fully responsive design
- 🌙 Dark mode ready
- ⚡ Optimistic UI updates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │  Zustand    │  │  Tailwind   │         │
│  │  Components │  │   Stores    │  │    CSS      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Socket.io │
                    │   (3003)    │
                    └──────┬──────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Next.js API)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Auth     │  │    Chat     │  │   Media     │         │
│  │   Routes    │  │   Routes    │  │   Routes    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (Prisma)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Users    │  │   Chats     │  │  Messages   │         │
│  │   Devices   │  │   Groups    │  │   Status    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
whatsapp-ultra/
├── mini-services/
│   └── chat-ws/          # WebSocket service (Socket.io)
├── prisma/
│   └── schema.prisma     # Database schema
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   │   ├── auth/     # Authentication endpoints
│   │   │   ├── chats/    # Chat endpoints
│   │   │   ├── groups/   # Group endpoints
│   │   │   ├── media/    # Media upload
│   │   │   └── users/    # User search
│   │   ├── page.tsx      # Main application
│   │   └── layout.tsx    # Root layout
│   ├── components/       # UI components (shadcn/ui)
│   ├── hooks/
│   │   └── useSocket.ts  # WebSocket hook
│   ├── lib/
│   │   ├── auth.ts       # Auth utilities
│   │   └── db.ts         # Prisma client
│   └── stores/           # Zustand stores
│       ├── authStore.ts
│       ├── chatStore.ts
│       ├── presenceStore.ts
│       └── uiStore.ts
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm
- SQLite (included)

### Installation

```bash
# Clone the repository
git clone https://github.com/fahad-ahamed/whatsapp-ultra.git
cd whatsapp-ultra

# Install dependencies
bun install

# Setup database
bun run db:push

# Start the main app
bun run dev

# In another terminal, start WebSocket service
cd mini-services/chat-ws
bun install
bun run dev
```

### Access the Application
- Main App: http://localhost:3000
- WebSocket: Port 3003

## 📊 Database Schema

### Core Models
| Model | Description |
|-------|-------------|
| `User` | User accounts with phone numbers |
| `Device` | Multi-device support |
| `Chat` | Individual and group chats |
| `ChatMember` | Chat membership |
| `Message` | Chat messages with encryption support |
| `MessageStatus` | Delivery and read receipts |
| `Group` | Group chat details |
| `GroupMember` | Group membership with roles |
| `Status` | WhatsApp-like stories (24h expiry) |
| `Contact` | User contacts |
| `KeyBundle` | Signal Protocol keys |

## 🔌 WebSocket Events

### Client → Server
| Event | Description |
|-------|-------------|
| `join_chat` | Join a chat room |
| `leave_chat` | Leave a chat room |
| `send_message` | Send a new message |
| `typing_start` | Start typing indicator |
| `typing_stop` | Stop typing indicator |
| `message_read` | Mark message as read |
| `update_presence` | Update online status |

### Server → Client
| Event | Description |
|-------|-------------|
| `new_message` | Receive new message |
| `user_typing` | User typing notification |
| `presence_update` | Contact online/offline |
| `message_status` | Message delivery/read status |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| State Management | Zustand |
| Database | Prisma ORM + SQLite |
| Real-time | Socket.io |
| Authentication | JWT (jose) |

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Chats
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/[id]/messages` - Get messages
- `POST /api/chats/[id]/messages` - Send message

### Users
- `GET /api/users/search?q=query` - Search users

### Media
- `POST /api/media/upload` - Upload file

## 🔐 Security Features

- JWT token-based authentication
- HTTP-only cookie sessions
- Phone number hashing
- Device fingerprinting
- Signal Protocol encryption schema ready
- Rate limiting ready

## 📜 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

⭐ Star this repo if you find it useful!
