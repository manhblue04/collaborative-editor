# Collaborative Editor

Real-time collaborative document editor (a Google Docs lite) built with **React + TipTap + Yjs** on the front and **Express + MongoDB + native WebSocket (y-protocols)** on the back.

## Features

- JWT auth (register / login / me)
- Document CRUD with `owner` / `editor` / `viewer` roles
- Realtime collaborative editing via Yjs CRDT
- Multiple user cursors with name + color
- Online users panel with awareness
- WebSocket auth: JWT validated on upgrade, room access enforced per document
- Auto-save: Yjs binary state persisted to MongoDB (debounced)
- Sharing: invite by email, revoke, role-based permissions
- Offline-friendly: local Yjs edits sync on reconnect
- Modern UI: Ant Design + Tailwind CSS

## Tech stack

| Layer | Stack |
|-------|------|
| Frontend | React 18, Vite 6, React Router 7, Zustand, TipTap, Yjs, y-websocket, Ant Design, Tailwind CSS |
| Backend | Node.js, Express 5, Mongoose, ws, y-protocols, JWT, bcryptjs |
| Database | MongoDB |

## Project structure

```
collaborative-editor/
├── package.json            # root: concurrently scripts
├── backend/
│   ├── .env                # MongoDB URI, JWT secret, etc.
│   └── src/
│       ├── index.js
│       ├── config/db.js
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       └── ws/yjsServer.js # Custom y-websocket server with JWT auth
└── frontend/
    ├── .env                # VITE_API_URL, VITE_WS_URL
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── services/
        ├── store/
        ├── yjs/
        └── utils/
```

## Setup

### 1. Prerequisites

- Node.js 18+
- A running MongoDB (local or Atlas)

### 2. Install all dependencies (one-shot)

```bash
npm run install:all
```

### 3. Configure environment

`backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=replace_me_with_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/yjs
```

### 4. Run dev (backend + frontend together)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend REST: http://localhost:3001
- Yjs WebSocket: ws://localhost:3001/yjs/<documentId>?token=<JWT>

## API contract

### Auth

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | `/auth/register` | – | `{ name, email, password }` | `{ message, user }` |
| POST | `/auth/login` | – | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | JWT | – | `{ id, name, email, role }` |

### Documents

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/documents` | JWT | Owned + shared with you |
| POST | `/documents` | JWT | Body: `{ title? }` |
| GET | `/documents/:id` | JWT | Metadata + your role |
| PATCH | `/documents/:id` | JWT (editor+) | Body: `{ title }` |
| DELETE | `/documents/:id` | JWT (owner) | – |
| GET | `/documents/:id/state` | JWT | Returns `{ state }` (base64 Yjs state) |
| PUT | `/documents/:id/state` | JWT (editor+) | Body: `{ state }` (base64) |
| POST | `/documents/:id/share` | JWT (owner) | Body: `{ email, role }` |
| GET | `/documents/:id/permissions` | JWT | List of `{ userId, name, email, role }` |
| DELETE | `/documents/:id/share/:userId` | JWT (owner) | Revoke collaborator |

### WebSocket (Yjs sync)

```
ws://localhost:3001/yjs/<documentId>?token=<JWT>
```

- JWT verified on upgrade.
- Server checks the user is `owner | editor | viewer` of `documentId`.
- Viewer connections receive sync but their write attempts are silently dropped.
- Server holds one `Y.Doc` per document in memory; persisted to MongoDB on update (debounced 3s) and on last disconnect.

## Error format

All non-success responses follow:

```json
{ "error": "Human-readable message" }
```

## License

MIT
