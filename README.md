# GhostChat

Anonymous, instant, ephemeral chat. Join any room by name, or spin up an unguessable random room, and start talking. No sign-up, no accounts, and messages delete themselves automatically.

**Live:** https://hellenicdev.eu/ghost-chat/

## Features

- Real-time messaging over Socket.IO
- Join or create rooms by ID, or generate a random unguessable room
- Random anonymous nicknames, live online-user count and typing indicators
- Message history per room, removed automatically after a configurable TTL
- Per-connection rate limiting and message length limits
- One-click "Copy ID" to invite others
- Dark, responsive UI with keyboard focus styles and reduced-motion support

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, socket.io-client |
| Backend | Node.js, Express 5, Socket.IO 4 |
| Storage | SQLite (better-sqlite3) |
| Hosting | GitHub Pages via GitHub Actions (client), Render (server) |

## Getting started

Requirements: Node.js 20+.

```bash
git clone https://github.com/hellenicdev/ghost-chat.git
cd ghost-chat

# Server
cd server
npm install
npm run dev          # http://localhost:3001
npm test             # node:test suite

# Client (new terminal)
cd ../client
npm install
npm run dev          # http://localhost:5173/ghost-chat/
```

### Environment variables

Server:

| Name | Purpose |
| --- | --- |
| `PORT` | Server port (default `3001`) |
| `CLIENT_ORIGIN` | Allowed CORS origin (defaults to `https://hellenicdev.eu`) |
| `MESSAGE_TTL_HOURS` | How long messages are kept |
| `MESSAGE_CLEANUP_INTERVAL_MS` | How often expired messages are purged |

Client:

| Name | Purpose |
| --- | --- |
| `VITE_SOCKET_URL` | URL of the Socket.IO server |

## Project structure

```
ghost-chat/
├── .github/workflows/deploy-client.yml   Builds client/ and publishes it to Pages
├── client/
│   └── src/
│       ├── components/   MessageList, MessageInput, TypingIndicator
│       ├── hooks/        useSocket
│       ├── pages/        JoinPage, ChatPage
│       ├── styles/       Tailwind entry
│       └── utils/        Room IDs, socket client
├── server/
│   ├── src/
│   │   ├── config/       CORS origin, SQLite
│   │   ├── routes/       Health check
│   │   ├── services/     Messages, rooms
│   │   ├── sockets/      Chat events
│   │   └── utils/        Rate limiter
│   └── test/             node:test suites
├── shared/               Nickname generator
└── render.yaml
```

## License

© 2026 HellenicDev. All rights reserved.

Built by [HellenicDev](https://hellenicdev.eu).
