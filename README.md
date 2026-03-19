# 🟢 WhatsApp Ultra - Full System

> A complete, production-ready WhatsApp-like messaging application with real-time communication, built with modern web technologies.

![WhatsApp Ultra Banner](https://img.shields.io/badge/WhatsApp-Ultra-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=flat-square&logo=socket.io)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

WhatsApp Ultra is a comprehensive messaging platform that replicates and extends the core functionality of WhatsApp. Built with a microservices-inspired architecture, it features real-time messaging, presence indicators, group chats, media sharing, and end-to-end encryption support.

### Key Highlights

- 🚀 **Real-time messaging** with Socket.io WebSocket
- 🔐 **JWT authentication** with multi-device support
- 💬 **Individual & group chats** with full management
- 🟢 **Online presence** and typing indicators
- 📱 **Responsive design** for all devices
- 🎨 **WhatsApp-like UI** with green theme
- 💾 **Prisma ORM** with SQLite database
- 📦 **Modular architecture** for easy scaling

---

## ✨ Features

### 🔐 Authentication System
| Feature | Description |
|---------|-------------|
| Phone Registration | Register with phone number verification |
| JWT Tokens | Secure token-based authentication |
| Multi-Device | Support for multiple devices per user |
| Session Management | HTTP-only cookie sessions |
| Device Fingerprinting | Track and manage connected devices |

### 💬 Messaging
| Feature | Description |
|---------|-------------|
| Real-time Delivery | Instant message delivery via WebSocket |
| Message Status | Sent ✓, Delivered ✓✓, Read ✓✓ (blue) |
| Typing Indicators | See when contacts are typing |
| Message Reactions | React to messages with emojis |
| Reply & Forward | Reply to specific messages |
| Edit & Delete | Edit or delete sent messages |
| Media Support | Images, videos, audio, documents |

### 👥 Group Chats
| Feature | Description |
|---------|-------------|
| Create Groups | Create groups with multiple members |
| Admin Controls | Add/remove members, promote admins |
| Group Info | Name, description, group photo |
| Member Management | View all members and their roles |

### 🟢 Presence System
| Feature | Description |
|---------|-------------|
| Online Status | Real-time online/offline status |
| Last Seen | Track when users were last active |
| Privacy Settings | Control who can see your status |

### 📱 User Interface
| Feature | Description |
|---------|-------------|
| Responsive Design | Works on mobile, tablet, desktop |
| Dark Mode | Toggle between light/dark themes |
| Chat List | Sidebar with all conversations |
| Message Bubbles | WhatsApp-style message display |
| Search | Search chats and messages |

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   Web Browser   │  │  Mobile Browser │  │   Desktop App   │            │
│  │   (React/Next)  │  │   (Responsive)  │  │   (Electron)    │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
└───────────┼─────────────────────┼─────────────────────┼────────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                           GATEWAY LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CDN + WAF (Cloudflare)                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                 Load Balancer (NGINX / Caddy)                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                          APPLICATION LAYER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Main Server    │  │ WebSocket Svc   │  │  Media Server   │            │
│  │  (Next.js:3000) │  │ (Socket.io:3003)│  │   (Upload)      │            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │
│           │                    │                    │                      │
│  ┌────────┴────────────────────┴────────────────────┴────────┐            │
│  │                     API Gateway                            │            │
│  │  /api/auth  /api/chats  /api/messages  /api/users  ...   │            │
│  └────────────────────────────────────────────────────────────┘            │
└─────────────────────────────────┬─────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │    SQLite DB    │  │  File Storage   │  │  Cache (In-Mem) │            │
│  │    (Prisma)     │  │   (Uploads)     │  │                 │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Message Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User A  │────▶│ WebSocket│────▶│  Server  │────▶│ Database │
│ (Client) │     │  Server  │     │  Logic   │     │ (Prisma) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      │ Fan-out to all recipients
                      ▼
               ┌──────────────┐
               │  Broadcast   │
               │ to Chat Room │
               └──────┬───────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │  User B  │ │  User C  │ │  User D  │
    │ (Online) │ │ (Online) │ │(Offline) │
    └──────────┘ └──────────┘ └──────────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │   Push   │
                              │   FCM/   │
                              │   APNs   │
                              └──────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1 | React framework with App Router |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | Latest | UI components |
| Zustand | 5 | State management |
| Socket.io Client | 4.8 | WebSocket client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.1 | REST API endpoints |
| Prisma | 6 | ORM for database |
| SQLite | 3 | Database |
| Socket.io | 4.8 | WebSocket server |
| Jose | 5 | JWT handling |

### Development
| Tool | Purpose |
|------|---------|
| Bun | Runtime & package manager |
| ESLint | Code linting |
| TypeScript | Type checking |

---

## 📁 Project Structure

```
whatsapp-ultra/
├── 📂 mini-services/
│   └── 📂 chat-ws/                    # WebSocket microservice
│       ├── index.ts                   # Socket.io server
│       └── package.json
│
├── 📂 prisma/
│   └── schema.prisma                  # Database schema
│
├── 📂 public/
│   ├── logo.svg
│   ├── robots.txt
│   └── 📂 uploads/                    # Media uploads
│
├── 📂 src/
│   ├── 📂 app/                        # Next.js App Router
│   │   ├── 📂 api/                    # API Routes
│   │   │   ├── 📂 auth/
│   │   │   │   ├── 📂 register/route.ts
│   │   │   │   ├── 📂 login/route.ts
│   │   │   │   └── 📂 me/route.ts
│   │   │   ├── 📂 chats/
│   │   │   │   ├── route.ts
│   │   │   │   └── 📂 [id]/messages/route.ts
│   │   │   ├── 📂 users/
│   │   │   │   └── 📂 search/route.ts
│   │   │   └── 📂 media/
│   │   │       └── 📂 upload/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Main application
│   │
│   ├── 📂 components/
│   │   └── 📂 ui/                     # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── dialog.tsx
│   │       ├── avatar.tsx
│   │       └── ...                    # 40+ components
│   │
│   ├── 📂 hooks/
│   │   ├── useSocket.ts               # WebSocket hook
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   │
│   ├── 📂 lib/
│   │   ├── auth.ts                    # Auth utilities
│   │   ├── db.ts                      # Prisma client
│   │   └── utils.ts                   # Utility functions
│   │
│   └── 📂 stores/                     # Zustand stores
│       ├── authStore.ts               # Authentication state
│       ├── chatStore.ts               # Chat & messages state
│       ├── presenceStore.ts           # Online presence
│       └── uiStore.ts                 # UI state
│
├── .gitignore
├── components.json                    # shadcn/ui config
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Device    │       │  KeyBundle  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │──┐    │ id          │
│ phoneNumber │  │    │ userId      │◀─┘    │ userId      │
│ name        │  │    │ deviceName  │       │ deviceId    │
│ profilePic  │  │    │ publicKey   │       │ identityKey │
│ lastSeen    │  │    │ lastActive  │       │ signedPreKey│
│ status      │  │    │ isActive    │       │ preKeys     │
└─────────────┘  │    └─────────────┘       └─────────────┘
      │          │
      │          │    ┌─────────────┐       ┌─────────────┐
      │          │    │    Chat     │       │ ChatMember  │
      │          │    ├─────────────┤       ├─────────────┤
      │          └───▶│ id          │───┐   │ id          │
      │               │ type        │   │   │ chatId      │
      │               │ name        │   └──▶│ userId      │
      │               │ createdAt   │       │ role        │
      │               └─────────────┘       │ joinedAt    │
      │                     │               └─────────────┘
      │                     │
      │               ┌─────┴─────┐
      │               ▼           ▼
      │         ┌──────────┐ ┌──────────┐
      │         │ Message  │ │  Group   │
      │         ├──────────┤ ├──────────┤
      │         │ id       │ │ id       │
      │         │ chatId   │ │ chatId   │
      │         │ senderId │ │ name     │
      │         │ content  │ │ adminId  │
      │         │ type     │ │ members  │
      │         │ timestamp│ └──────────┘
      │         └──────────┘
      │               │
      │               ▼
      │         ┌──────────────┐
      │         │MessageStatus │
      │         ├──────────────┤
      │         │ id           │
      │         │ messageId    │
      └────────▶│ userId       │
                │ deliveredAt  │
                │ readAt       │
                └──────────────┘
```

### Models Overview

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | User accounts | id, phoneNumber (hashed), name, profilePic, lastSeen |
| **Device** | Multi-device support | id, userId, deviceName, publicKey |
| **Chat** | Conversation container | id, type (individual/group), name |
| **ChatMember** | Chat membership | chatId, userId, role (admin/member) |
| **Message** | Chat messages | id, chatId, senderId, content, type, timestamp |
| **MessageStatus** | Delivery receipts | messageId, userId, deliveredAt, readAt |
| **Group** | Group details | chatId, name, description, adminId |
| **GroupMember** | Group membership | groupId, userId, role |
| **Status** | Stories (24h) | userId, mediaUrl, caption, expiresAt |
| **Contact** | User contacts | userId, contactUserId, isBlocked |
| **KeyBundle** | E2E encryption | userId, deviceId, identityKey, preKeys |

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx123...",
    "phoneNumber": "hashed...",
    "name": "John Doe",
    "profilePic": null,
    "status": null
  },
  "deviceId": "clx456...",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

#### Get Current User
```http
GET /api/auth/me
Cookie: auth_token=eyJhbGciOiJIUzI1NiIs...
```

### Chat Endpoints

#### Get All Chats
```http
GET /api/chats
Cookie: auth_token=...
```

**Response:**
```json
{
  "chats": [
    {
      "id": "clx123...",
      "type": "individual",
      "name": "Jane Doe",
      "members": [...],
      "lastMessage": {
        "id": "msg123",
        "content": "Hello!",
        "timestamp": "2026-03-19T12:00:00Z"
      },
      "unreadCount": 2
    }
  ]
}
```

#### Create Chat
```http
POST /api/chats
Content-Type: application/json

{
  "type": "individual",
  "memberIds": ["userId1"]
}
```

#### Get Messages
```http
GET /api/chats/{chatId}/messages?limit=50&before=msgId
Cookie: auth_token=...
```

#### Send Message
```http
POST /api/chats/{chatId}/messages
Content-Type: application/json

{
  "content": "Hello World!",
  "messageType": "text"
}
```

### User Endpoints

#### Search Users
```http
GET /api/users/search?q=john
Cookie: auth_token=...
```

### Media Endpoints

#### Upload Media
```http
POST /api/media/upload
Content-Type: multipart/form-data

file: [binary]
```

**Response:**
```json
{
  "url": "/uploads/abc123.jpg",
  "filename": "image.jpg",
  "size": 12345,
  "type": "image/jpeg"
}
```

---

## 🔌 WebSocket Events

### Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('/?XTransformPort=3003', {
  auth: { token: 'jwt_token_here' },
  transports: ['websocket', 'polling']
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_chat` | `chatId: string` | Join a chat room |
| `leave_chat` | `chatId: string` | Leave a chat room |
| `send_message` | `{ chatId, messageId, content, messageType }` | Send a message |
| `typing_start` | `chatId: string` | Start typing indicator |
| `typing_stop` | `chatId: string` | Stop typing indicator |
| `message_read` | `{ messageIds, chatId }` | Mark messages as read |
| `edit_message` | `{ messageId, chatId, content }` | Edit a message |
| `delete_message` | `{ messageId, chatId, deleteForEveryone }` | Delete a message |
| `update_presence` | `{ status: 'online' | 'away' }` | Update presence |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `Message` | New message received |
| `message_sync` | `Message` | Sync to other devices |
| `message_status` | `{ messageId, userId, status }` | Status update |
| `message_edited` | `{ messageId, content, editedAt }` | Message edited |
| `message_deleted` | `{ messageId, deletedBy }` | Message deleted |
| `user_typing` | `{ chatId, userId, userName, isTyping }` | Typing indicator |
| `presence_update` | `{ userId, status, lastSeen }` | Presence change |
| `online_users` | `User[]` | List of online users |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- **Git**
- 4GB+ RAM

### Installation

```bash
# Clone the repository
git clone https://github.com/fahad-ahamed/whatsapp-ultra.git
cd whatsapp-ultra

# Install dependencies
bun install

# Setup database
bun run db:push

# Start the main application (Terminal 1)
bun run dev

# Start WebSocket service (Terminal 2)
cd mini-services/chat-ws
bun install
bun run dev
```

### Access Points

| Service | URL | Port |
|---------|-----|------|
| Main App | http://localhost:3000 | 3000 |
| WebSocket | ws://localhost:3003 | 3003 |

### First Run

1. Open http://localhost:3000 in your browser
2. Register with a phone number (e.g., `+1234567890`)
3. Enter your name
4. Click "Register"
5. You're now logged in!

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-key-change-this"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# WebSocket Port
WS_PORT=3003
```

### Prisma Configuration

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"      // or "postgresql" for production
  url      = env("DATABASE_URL")
}
```

---

## 🐳 Deployment

### Docker

```dockerfile
# Dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run db:generate

EXPOSE 3000 3003

CMD ["sh", "-c", "bun run dev & cd mini-services/chat-ws && bun run dev"]
```

```bash
# Build and run
docker build -t whatsapp-ultra .
docker run -p 3000:3000 -p 3003:3003 whatsapp-ultra
```

### Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set up Redis for caching and sessions
- [ ] Configure CDN for media files
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure FCM/APNs for push notifications
- [ ] Set up monitoring (Prometheus/Grafana)

---

## 🧪 Testing

### Manual Testing

1. Open two browser tabs
2. Register different users in each tab
3. Search for each other
4. Start a chat
5. Test real-time messaging

### API Testing

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "name": "Test User"}'

# Get chats (use token from registration)
curl http://localhost:3000/api/chats \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use conventional commits
- Add JSDoc comments for functions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [WhatsApp](https://whatsapp.com) for inspiration
- [Next.js](https://nextjs.org) team for the amazing framework
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- [Socket.io](https://socket.io) for real-time capabilities
- [Prisma](https://prisma.io) for the excellent ORM

---

## 📞 Support

- 📧 Email: support@whatsappultra.com
- 💬 Discord: [Join our community](https://discord.gg/whatsappultra)
- 🐛 Issues: [GitHub Issues](https://github.com/fahad-ahamed/whatsapp-ultra/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/fahad-ahamed">fahad-ahamed</a>
</p>

<p align="center">
  ⭐ Star this repo if you find it useful! ⭐
</p>
