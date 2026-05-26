# 📝 Collaborative Editor

Ứng dụng soạn thảo văn bản cộng tác thời gian thực — tương tự Google Docs. Nhiều người dùng có thể cùng chỉnh sửa một tài liệu đồng thời, với con trỏ trực tiếp, quản lý phiên bản, phân quyền và xuất tài liệu.

---

## 🏗️ Công nghệ sử dụng

### Backend

| Công nghệ           | Mục đích                           |
| ------------------- | ---------------------------------- |
| Node.js + Express 5 | HTTP server & REST API             |
| MongoDB + Mongoose  | Lưu trữ dữ liệu                    |
| Yjs + y-protocols   | CRDT engine đồng bộ thời gian thực |
| WebSocket (`ws`)    | Kết nối thời gian thực             |
| JWT + bcryptjs      | Xác thực & mã hóa mật khẩu         |

### Frontend

| Công nghệ                    | Mục đích                  |
| ---------------------------- | ------------------------- |
| React 18 + Vite 6            | UI framework & build tool |
| TipTap v2 (ProseMirror)      | Rich text editor          |
| Yjs + y-websocket            | Đồng bộ CRDT phía client  |
| Zustand                      | Quản lý state             |
| Ant Design v6 + Tailwind CSS | UI components & styling   |
| React Router v7              | Client-side routing       |

---

## ✨ Tính năng

### 🔐 Xác thực & Người dùng

- **Đăng ký / Đăng nhập** — Form tab-switch trên cùng một trang
- **JWT Authentication** — Token được gửi qua HTTP Authorization header và WebSocket query param
- **Auto logout** — Tự động chuyển về `/login` khi token hết hạn (401)

---

### 📄 Quản lý Tài liệu

- **Tạo tài liệu** — Tạo tài liệu mới từ Dashboard
- **Danh sách tài liệu** — Hiển thị tất cả tài liệu (sở hữu + được chia sẻ) dưới dạng lưới card
- **Đổi tên tài liệu** — Cập nhật tiêu đề ngay trong Dashboard hoặc header của Editor
- **Xóa tài liệu** — Chỉ chủ sở hữu (owner) mới được xóa
- **Badge phân quyền** — Hiển thị role (owner / editor / viewer) và số lượng cộng tác viên trên mỗi card

---

### ✏️ Soạn thảo Văn bản (Rich Text)

Trình soạn thảo được xây dựng trên TipTap v2 + ProseMirror với đầy đủ công cụ định dạng:

#### Định dạng văn bản

- **Tiêu đề** — H1, H2, H3
- **In đậm / In nghiêng / Gạch chân / Gạch ngang**
- **Màu chữ** — Color picker với bảng màu sẵn có
- **Màu nền (Highlight)** — Tô sáng văn bản với nhiều màu
- **Căn lề** — Trái, Giữa, Phải, Đều hai bên

#### Cấu trúc nội dung

- **Danh sách dấu đầu dòng** (bullet list)
- **Danh sách đánh số** (ordered list)
- **Danh sách checkbox** (task list) — có thể tick/bỏ tick
- **Blockquote** — Trích dẫn
- **Code block** — Khối mã nguồn

#### Chèn nội dung

- **Link** — Chèn/sửa/xóa liên kết; bubble menu xuất hiện khi chọn text
- **Hình ảnh** — Chèn từ URL hoặc base64
- **Bảng (Table)** — Chọn kích thước bằng grid picker; hỗ trợ thay đổi kích thước cột
- **Table Context Menu** — Thêm/xóa hàng, thêm/xóa cột, xóa toàn bộ bảng
- **Đường kẻ ngang (HR)**

#### Công cụ soạn thảo

- **Undo / Redo**
- **Word count & Character count** — Hiển thị trên status bar
- **Tìm kiếm & Thay thế** — Mở bằng `Ctrl+F`; highlight match, điều hướng Prev/Next, thay một / thay tất cả

---

### 🤝 Cộng tác Thời gian Thực

- **Đồng bộ CRDT (Yjs)** — Nhiều người cùng chỉnh sửa, tự động giải quyết xung đột, không mất dữ liệu
- **Con trỏ trực tiếp (Live Cursors)** — Mỗi người dùng có màu riêng, hiển thị tên bên cạnh con trỏ
- **Hiển thị người đang online** — Avatar group trên header + danh sách trong sidebar
- **Trạng thái kết nối** — Icon cloud + banner thông báo khi mất kết nối / đang kết nối lại
- **Auto-reconnect** — Tự động kết nối lại khi mạng gián đoạn

---

### 🔒 Phân Quyền & Chia sẻ

- **Ba cấp độ quyền:**
  - `owner` — Toàn quyền (chỉnh sửa, chia sẻ, xóa tài liệu)
  - `editor` — Chỉnh sửa + xem
  - `viewer` — Chỉ xem (các thao tác ghi bị chặn cả ở WebSocket lẫn REST API)
- **Chia sẻ qua Email** — Mời cộng tác viên bằng địa chỉ email, chọn role
- **Chia sẻ qua Link** — Tạo link share; tùy chọn đặt mật khẩu bảo vệ
- **Thu hồi quyền** — Xóa quyền truy cập của từng cộng tác viên
- **Thu hồi Link** — Vô hiệu hóa link share bất kỳ lúc nào
- **Tham gia qua Link** — Trang `JoinPage` với ô nhập mật khẩu nếu link có bảo vệ

---

### 📜 Lịch sử Phiên bản

- **Snapshot thủ công** — Lưu phiên bản với nhãn tùy chỉnh
- **Snapshot tự động** — Tự động lưu khi người cuối rời khỏi tài liệu (debounce 10s, rate limit 2 phút)
- **Xem trước** — Xem nội dung văn bản của từng phiên bản (plain text)
- **Khôi phục** — Restore về phiên bản bất kỳ; tự động tạo backup trước khi restore; kick tất cả kết nối WS để tránh ghi đè
- **Giới hạn** — Tối đa 50 phiên bản mỗi tài liệu (tự động xóa cũ nhất)

---

### 💾 Auto-save

- Yjs state được debounce **3 giây** và tự động lưu vào MongoDB
- Keepalive ping/pong mỗi **30 giây** để giữ kết nối WebSocket

---

### 📤 Xuất Tài liệu

Tất cả hoạt động **hoàn toàn phía client**, không cần server:

| Định dạng      | Phương thức                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| **PDF**        | In qua `window.print()` (mở tab mới với CSS tối ưu in ấn)                                                            |
| **HTML**       | File `.html` đầy đủ với CSS nhúng sẵn                                                                                |
| **Markdown**   | Chuyển đổi tùy chỉnh từ JSON của TipTap → Markdown (hỗ trợ heading, list, table, code block, link, image, task list) |
| **Plain Text** | File `.txt` thuần văn bản                                                                                            |

---

## 📁 Cấu trúc Project

```
collaborative-editor/
├── package.json              # Root — chạy đồng thời cả backend & frontend
│
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point — Express + WS server
│   │   ├── models/
│   │   │   ├── User.js       # User model (bcrypt, role)
│   │   │   ├── Document.js   # Document model (Yjs state, permissions)
│   │   │   └── Version.js    # Version snapshot model
│   │   ├── routes/
│   │   │   ├── auth.js       # /auth/*
│   │   │   ├── documents.js  # /documents/*
│   │   │   ├── versions.js   # /documents/:id/versions/*
│   │   │   └── users.js      # /users/*
│   │   ├── middleware/
│   │   │   ├── auth.js       # authenticate, authorize
│   │   │   └── errorHandler.js
│   │   └── ws/
│   │       └── yjsServer.js  # Yjs WebSocket server
│   └── .env                  # Biến môi trường backend
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx           # Routes
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── EditorPage.jsx
    │   │   └── JoinPage.jsx
    │   ├── components/
    │   │   ├── editor/       # EditorWrapper, EditorToolbar, StatusBar, ...
    │   │   ├── layout/       # Navbar, Sidebar
    │   │   └── modals/       # ShareModal, VersionHistoryDrawer
    │   ├── hooks/
    │   │   ├── useCollaborativeEditor.js
    │   │   ├── useSocket.js
    │   │   ├── useAuth.js
    │   │   └── useSearchReplace.js
    │   ├── store/
    │   │   ├── authStore.js
    │   │   └── documentStore.js
    │   ├── services/         # api.js, authService, documentService, versionService
    │   ├── yjs/              # yjsConfig, provider, awareness
    │   ├── extensions/       # SearchHighlight plugin
    │   └── utils/
    │       └── exportDocument.js
    └── .env                  # Biến môi trường frontend
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- MongoDB đang chạy (local hoặc Atlas)

### Cài đặt nhanh

```bash
# Clone project
git clone <repo-url>
cd collaborative-editor

# Cài tất cả dependencies (root + backend + frontend)
npm run install:all
```

### Cấu hình môi trường

**Backend** — tạo file `backend/.env`:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=your_random_64_byte_hex_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**Frontend** — tạo file `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/yjs
```

### Chạy Development

```bash
# Chạy đồng thời backend + frontend
npm run dev

# Hoặc chạy riêng lẻ
npm run dev:backend    # Backend tại http://localhost:3001
npm run dev:frontend   # Frontend tại http://localhost:5173

# Chạy với network (truy cập qua LAN)
npm run dev:host
```

### Build Production

```bash
npm run build:frontend   # Build frontend
npm start                # Chạy backend (phục vụ cả frontend đã build)
```

---

## 🌐 API Reference

### Authentication

| Method | Endpoint         | Mô tả                       |
| ------ | ---------------- | --------------------------- |
| POST   | `/auth/register` | Đăng ký tài khoản           |
| POST   | `/auth/login`    | Đăng nhập, trả về JWT       |
| GET    | `/auth/me`       | Lấy thông tin user hiện tại |

### Tài liệu

| Method | Endpoint               | Mô tả                     |
| ------ | ---------------------- | ------------------------- |
| POST   | `/documents`           | Tạo tài liệu mới          |
| GET    | `/documents`           | Danh sách tài liệu        |
| GET    | `/documents/:id`       | Chi tiết tài liệu         |
| PATCH  | `/documents/:id`       | Đổi tên tài liệu          |
| DELETE | `/documents/:id`       | Xóa tài liệu (owner only) |
| GET    | `/documents/:id/state` | Lấy Yjs state (base64)    |
| PUT    | `/documents/:id/state` | Lưu Yjs state             |

### Chia sẻ & Phân quyền

| Method | Endpoint                       | Mô tả                       |
| ------ | ------------------------------ | --------------------------- |
| POST   | `/documents/:id/share`         | Mời cộng tác viên qua email |
| GET    | `/documents/:id/permissions`   | Danh sách cộng tác viên     |
| DELETE | `/documents/:id/share/:userId` | Thu hồi quyền               |
| POST   | `/documents/:id/share-link`    | Tạo share link              |
| GET    | `/documents/:id/share-link`    | Lấy share link hiện tại     |
| DELETE | `/documents/:id/share-link`    | Thu hồi share link          |
| POST   | `/documents/join/:token`       | Tham gia qua share link     |

### Phiên bản

| Method | Endpoint                               | Mô tả                   |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `/documents/:id/versions`              | Danh sách phiên bản     |
| POST   | `/documents/:id/versions`              | Lưu phiên bản thủ công  |
| GET    | `/documents/:id/versions/:vId/state`   | Lấy state của phiên bản |
| POST   | `/documents/:id/versions/:vId/restore` | Khôi phục về phiên bản  |

### WebSocket

```
ws://host/yjs/<documentId>?token=<JWT>
```

- Đồng bộ Yjs sync protocol (step 1/2 + update broadcast)
- Awareness: presence & cursor của từng người dùng
- Viewer role: các message ghi bị drop silently

---

## 🔑 Phân quyền

| Hành động                 | Owner | Editor | Viewer |
| ------------------------- | :---: | :----: | :----: |
| Xem tài liệu              |  ✅   |   ✅   |   ✅   |
| Chỉnh sửa nội dung        |  ✅   |   ✅   |   ❌   |
| Chia sẻ / Quản lý quyền   |  ✅   |   ❌   |   ❌   |
| Xóa tài liệu              |  ✅   |   ❌   |   ❌   |
| Lưu / Khôi phục phiên bản |  ✅   |   ✅   |   ❌   |
| Xuất tài liệu             |  ✅   |   ✅   |   ✅   |
