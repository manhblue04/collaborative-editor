# 📝 Collaborative Document Editor — Backend

Hệ thống chỉnh sửa tài liệu cộng tác theo thời gian thực, sử dụng **Yjs CRDT** và **WebSocket** để đồng bộ nội dung giữa nhiều người dùng.

## 📋 Mục lục

- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tech Stack](#-tech-stack)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
  - [Authentication](#1-authentication)
  - [Document Management](#2-document-management)
  - [Permission / Sharing](#3-permission--sharing)
  - [Users](#4-users)
- [WebSocket Documentation](#-websocket-documentation)
- [Error Handling](#-error-handling)

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────┐        REST API         ┌──────────────────┐         ┌───────────┐
│                 │ ◄─────────────────────► │                  │ ◄─────► │  MongoDB  │
│   Frontend      │                         │   Express.js     │         │           │
│   (React +      │        WebSocket        │   Server         │         │ • users   │
│    TipTap +     │ ◄─────────────────────► │   (Port 3001)    │         │ • docs    │
│    Yjs)         │   Yjs Sync + Awareness  │                  │         │ • perms   │
│                 │                         │   Yjs WS Server  │         │           │
└─────────────────┘                         └──────────────────┘         └───────────┘
```

**Nguyên tắc quan trọng:**

- REST API chỉ xử lý **metadata** (title, owner, permissions)
- **Nội dung tài liệu** được đồng bộ hoàn toàn qua **Yjs + WebSocket** (CRDT)
- Server **KHÔNG** xử lý merge logic — Yjs tự động xử lý xung đột
- Mỗi document = 1 WebSocket room

---

## 🛠 Tech Stack

| Công nghệ | Mục đích |
|------------|----------|
| **Node.js** | Runtime |
| **Express.js** | REST API framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Yjs** | CRDT cho collaborative editing |
| **y-protocols** | Sync & Awareness protocol |
| **ws** | WebSocket server |
| **JWT (jsonwebtoken)** | Authentication |
| **bcryptjs** | Password hashing |

---

## 🚀 Cài đặt & Chạy

### 1. Clone & Install

```bash
git clone <repo-url>
cd collaborative-editor/backend
npm install
```

### 2. Cấu hình environment

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Chạy server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server sẽ chạy tại:
- **REST API:** `http://localhost:3001`
- **WebSocket:** `ws://localhost:3001/<documentId>`

---

## 📂 Cấu trúc thư mục

```
src/
├── config/
│   ├── db.js                  # MongoDB connection
│   └── websocket.js           # Yjs WebSocket server
├── controllers/
│   ├── auth.controller.js     # Login, Register, GetMe
│   ├── document.controller.js # CRUD + Share document
│   └── user.controller.js     # Search, List users
├── middlewares/
│   ├── auth.middleware.js     # JWT authenticate + authorize
│   └── error.middleware.js    # Global error handler
├── models/
│   ├── User.js                # User schema
│   ├── Document.js            # Document schema
│   └── DocumentPermission.js  # Permission schema
├── routes/
│   ├── auth.routes.js
│   ├── document.routes.js
│   └── user.routes.js
└── index.js                   # Entry point (Express + WebSocket)
```

---

## 💾 Database Schema

### 1. `users`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `name` | String | Tên người dùng (2–50 ký tự) |
| `email` | String | Email (unique) |
| `password` | String | Hashed password (bcrypt, select: false) |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated |

**Index:** `email: unique`

### 2. `documents`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `title` | String | Tiêu đề tài liệu |
| `owner` | ObjectId → User | Người tạo |
| `ydocState` | Buffer | Yjs binary state snapshot (optional, backup) |
| `isDeleted` | Boolean | Soft delete flag (default: false) |
| `createdAt` | Date | Auto-generated |
| `updatedAt` | Date | Auto-generated |

**Index:** `{ owner: 1, createdAt: -1 }`, `{ isDeleted: 1 }`

### 3. `document_permissions`

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `documentId` | ObjectId → Document | Tài liệu |
| `userId` | ObjectId → User | Người dùng |
| `role` | String | `"owner"` \| `"editor"` \| `"viewer"` |
| `createdAt` | Date | Auto-generated |

**Index:** `{ documentId: 1, userId: 1 }` unique, `{ userId: 1 }`

---

## 📡 API Documentation

> **Base URL:** `http://localhost:3001`
>
> **Authentication:** Tất cả API (trừ login/register) yêu cầu header:
> ```
> Authorization: Bearer <jwt_token>
> ```

---

### 1. Authentication

#### `POST /auth/register`

Đăng ký tài khoản mới.

**Request Body:**

```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "123456"
}
```

**Response `201 Created`:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "6650a1b2c3d4e5f6a7b8c9d0",
    "name": "Nguyễn Văn A",
    "email": "user@example.com"
  }
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Thiếu field / validation lỗi |
| `409` | Email đã tồn tại |

---

#### `POST /auth/login`

Đăng nhập và nhận JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response `200 OK`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6650a1b2c3d4e5f6a7b8c9d0",
    "name": "Nguyễn Văn A",
    "email": "user@example.com"
  }
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Thiếu email hoặc password |
| `401` | Email hoặc password sai |

---

#### `GET /auth/me`

Lấy thông tin người dùng hiện tại.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**

```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d0",
  "name": "Nguyễn Văn A",
  "email": "user@example.com"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `401` | Token không hợp lệ / hết hạn |

---

### 2. Document Management

> Tất cả endpoint yêu cầu **Authorization: Bearer \<token\>**

#### `POST /documents`

Tạo document mới. Tự động gán quyền `owner` cho người tạo.

**Request Body:**

```json
{
  "title": "Báo cáo hệ thống phân tán"
}
```

> `title` là optional, mặc định: `"Untitled Document"`

**Response `201 Created`:**

```json
{
  "id": "6650b2c3d4e5f6a7b8c9d0e1",
  "title": "Báo cáo hệ thống phân tán",
  "ownerId": "6650a1b2c3d4e5f6a7b8c9d0",
  "createdAt": "2026-04-04T07:00:00.000Z"
}
```

---

#### `GET /documents`

Lấy danh sách tất cả document mà user có quyền truy cập (owned + shared).

**Response `200 OK`:**

```json
[
  {
    "id": "6650b2c3d4e5f6a7b8c9d0e1",
    "title": "Báo cáo hệ thống phân tán",
    "ownerId": "6650a1b2c3d4e5f6a7b8c9d0",
    "ownerName": "Nguyễn Văn A",
    "role": "owner",
    "updatedAt": "2026-04-04T07:30:00.000Z"
  },
  {
    "id": "6650c3d4e5f6a7b8c9d0e1f2",
    "title": "Tài liệu nhóm",
    "ownerId": "6650f6a7b8c9d0e1f2a3b4c5",
    "ownerName": "Trần Văn B",
    "role": "editor",
    "updatedAt": "2026-04-04T06:00:00.000Z"
  }
]
```

> Danh sách được sắp xếp theo `updatedAt` giảm dần.

---

#### `GET /documents/:id`

Lấy metadata của document (KHÔNG bao gồm nội dung — nội dung qua WebSocket).

**Response `200 OK`:**

```json
{
  "id": "6650b2c3d4e5f6a7b8c9d0e1",
  "title": "Báo cáo hệ thống phân tán",
  "ownerId": "6650a1b2c3d4e5f6a7b8c9d0",
  "ownerName": "Nguyễn Văn A",
  "role": "editor",
  "createdAt": "2026-04-04T07:00:00.000Z",
  "updatedAt": "2026-04-04T07:30:00.000Z"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Không có quyền truy cập |
| `404` | Document không tồn tại |

---

#### `PATCH /documents/:id`

Cập nhật tiêu đề document. Yêu cầu quyền `owner` hoặc `editor`.

**Request Body:**

```json
{
  "title": "Tiêu đề mới"
}
```

**Response `200 OK`:**

```json
{
  "message": "Document updated"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Không phải owner/editor |
| `404` | Document không tồn tại |

---

#### `DELETE /documents/:id`

Xóa document (soft delete). Chỉ `owner` mới có quyền xóa.

**Response `200 OK`:**

```json
{
  "message": "Document deleted"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `403` | Không phải owner |
| `404` | Document không tồn tại |

---

### 3. Permission / Sharing

#### `POST /documents/:id/share`

Chia sẻ document cho người dùng khác. Chỉ `owner` mới có quyền chia sẻ.

**Request Body:**

```json
{
  "userId": "6650f6a7b8c9d0e1f2a3b4c5",
  "role": "editor"
}
```

> `role` phải là `"editor"` hoặc `"viewer"`.
> Nếu user đã có quyền, role sẽ được cập nhật (upsert).

**Response `200 OK`:**

```json
{
  "message": "Document shared successfully."
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Thiếu userId/role, role không hợp lệ, chia sẻ cho chính mình |
| `403` | Không phải owner |
| `404` | Document không tồn tại |

---

#### `DELETE /documents/:id/share/:userId`

Thu hồi quyền truy cập của một user. Chỉ `owner` mới có quyền.

**Response `200 OK`:**

```json
{
  "message": "Permission revoked."
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `400` | Cố xóa quyền owner |
| `403` | Không phải owner |
| `404` | Permission không tồn tại |

---

#### `GET /documents/:id/permissions`

Lấy danh sách tất cả user có quyền truy cập document. Yêu cầu quyền `owner` hoặc `editor`.

**Response `200 OK`:**

```json
[
  {
    "userId": "6650a1b2c3d4e5f6a7b8c9d0",
    "name": "Nguyễn Văn A",
    "email": "a@example.com",
    "role": "owner"
  },
  {
    "userId": "6650f6a7b8c9d0e1f2a3b4c5",
    "name": "Trần Văn B",
    "email": "b@example.com",
    "role": "editor"
  }
]
```

---

### 4. Users

#### `GET /users/search?email=<query>`

Tìm kiếm user theo email (dùng cho tính năng chia sẻ document). Tự động loại trừ bản thân.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `email` | string | Chuỗi tìm kiếm (tối thiểu 2 ký tự) |

**Response `200 OK`:**

```json
[
  {
    "id": "6650f6a7b8c9d0e1f2a3b4c5",
    "name": "Trần Văn B",
    "email": "b@example.com"
  }
]
```

> Trả về tối đa 10 kết quả.

---

#### `GET /users`

Lấy danh sách tất cả user.

**Response `200 OK`:**

```json
[
  {
    "id": "6650a1b2c3d4e5f6a7b8c9d0",
    "name": "Nguyễn Văn A",
    "email": "a@example.com"
  }
]
```

---

#### `GET /users/:id`

Lấy thông tin user theo ID.

**Response `200 OK`:**

```json
{
  "id": "6650a1b2c3d4e5f6a7b8c9d0",
  "name": "Nguyễn Văn A",
  "email": "a@example.com"
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| `404` | User không tồn tại |

---

## 🔌 WebSocket Documentation

### Tổng quan

WebSocket server dùng **Yjs protocol** để đồng bộ nội dung tài liệu theo thời gian thực giữa nhiều client. Server hoạt động như một **relay** — toàn bộ logic merge/xung đột được xử lý bởi **Yjs CRDT** trên client.

### Endpoint

```
ws://localhost:3001/<documentId>
```

**Ví dụ:**

```
ws://localhost:3001/6650b2c3d4e5f6a7b8c9d0e1
```

### Room Mapping

- Mỗi `documentId` tương ứng với **1 WebSocket room**
- Nhiều client kết nối cùng `documentId` sẽ ở trong cùng 1 room
- Khi tất cả client rời room → Y.Doc bị destroy và giải phóng bộ nhớ

### Message Types

Server xử lý 2 loại message (binary protocol):

| Type ID | Name | Description |
|---------|------|-------------|
| `0` | **Sync** | Đồng bộ nội dung Y.Doc (sync step 1, step 2, update) |
| `1` | **Awareness** | Đồng bộ cursor, trạng thái online, tên user |

### Connection Flow

```
Client                                 Server
  │                                      │
  │ ──── WebSocket connect ────────────► │  Join room (documentId)
  │                                      │
  │ ◄──── Sync Step 1 ──────────────── │  Gửi state vector
  │                                      │
  │ ──── Sync Step 2 ────────────────► │  Client gửi missing updates
  │                                      │
  │ ◄──── Awareness states ─────────── │  Gửi trạng thái user đang online
  │                                      │
  │ ◄───► Sync updates ◄────────────► │  Realtime bidirectional sync
  │ ◄───► Awareness updates ◄───────► │  Cursor & presence sync
  │                                      │
  │ ──── disconnect ───────────────── ► │  Cleanup awareness, leave room
  │                                      │
```

### Tích hợp phía Client (TipTap + Yjs)

```javascript
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEditor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'

// 1. Tạo Y.Doc
const ydoc = new Y.Doc()

// 2. Kết nối WebSocket provider
const provider = new WebsocketProvider(
  'ws://localhost:3001',  // WebSocket server URL
  documentId,             // Room name = documentId
  ydoc
)

// 3. Set awareness (user info cho cursor)
provider.awareness.setLocalStateField('user', {
  name: 'Nguyễn Văn A',
  color: '#ff0000'
})

// 4. Tạo TipTap editor
const editor = useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Tắt history mặc định
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({
      provider,
      user: { name: 'Nguyễn Văn A', color: '#ff0000' }
    })
  ]
})

// 5. Cleanup khi rời trang
// provider.destroy()
// ydoc.destroy()
```

### Awareness Data Structure

Mỗi user online trong room sẽ có awareness state:

```json
{
  "user": {
    "name": "Nguyễn Văn A",
    "color": "#ff0000"
  },
  "cursor": {
    "anchor": 10,
    "head": 12
  }
}
```

### Quan trọng

| Rule | Mô tả |
|------|--------|
| ⚠️ 1 Y.Doc / document | Chỉ tạo **MỘT** `Y.Doc` instance cho mỗi document |
| ⚠️ Destroy on unmount | **BẮT BUỘC** gọi `provider.destroy()` và `ydoc.destroy()` khi rời trang |
| ⚠️ Không gửi content qua REST | Nội dung document **KHÔNG** được gửi/nhận qua REST API |
| ⚠️ Tắt TipTap history | Phải disable default history extension khi dùng Collaboration |
| ⚠️ Không lưu từng edit | Server **KHÔNG** lưu từng thao tác edit vào MongoDB |

---

## ❌ Error Handling

### Format lỗi chuẩn

Tất cả lỗi trả về theo format:

```json
{
  "error": "Mô tả lỗi"
}
```

> Trong môi trường `development`, response sẽ có thêm field `stack` (stack trace).

### Mã lỗi HTTP

| Status Code | Ý nghĩa |
|-------------|----------|
| `400` | Bad Request — thiếu field, validation lỗi, input không hợp lệ |
| `401` | Unauthorized — thiếu token, token sai, token hết hạn |
| `403` | Forbidden — không có quyền truy cập resource |
| `404` | Not Found — resource không tồn tại |
| `409` | Conflict — duplicate (email đã tồn tại) |
| `500` | Internal Server Error |

### Xử lý lỗi đặc biệt

| Loại lỗi | Xử lý |
|-----------|--------|
| MongoDB Duplicate Key (`code: 11000`) | Trả về `409` với message rõ ràng |
| Mongoose ValidationError | Trả về `400` với danh sách lỗi |
| Mongoose CastError (invalid ObjectId) | Trả về `400` |
| JWT JsonWebTokenError | Trả về `401 Invalid token` |
| JWT TokenExpiredError | Trả về `401 Token has expired` |

---

## 📊 Data Flow

### Khi mở document

```
GET /documents/:id          →  Lấy metadata (title, owner, role)
                            →  Check permission
WebSocket connect           →  Yjs load state từ server
                            →  Editor render nội dung
```

### Khi chỉnh sửa document

```
User gõ phím                →  TipTap update
                            →  Yjs tạo update (CRDT)
                            →  WebSocket gửi update
                            →  Server relay tới các client khác
                            →  Client khác nhận + Yjs merge
                            →  Render thay đổi
```

### Khi chia sẻ document

```
GET /users/search?email=... →  Tìm user
POST /documents/:id/share   →  Gán quyền
                            →  User được share thấy doc trong GET /documents
```

---

## 📜 License

ISC
