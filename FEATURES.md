# Collaborative Editor — Tính năng

## Tổng quan

| Nhóm | Đã hoàn thiện | Chưa hoàn thiện | Còn thiếu |
|------|--------------|-----------------|-----------|
| Xác thực | 11 | 1 | 7 |
| Quản lý tài liệu | 12 | 0 | 8 |
| Cộng tác thời gian thực | 14 | 0 | 5 |
| Phân quyền & Chia sẻ | 11 | 0 | 4 |
| Trình soạn thảo | 18 | 0 | 9 |
| UI/UX | 16 | 0 | 9 |
| Kỹ thuật / Hạ tầng | 18 | 0 | 14 |
| **TỔNG** | **100** | **2** | **56** |

---

## Tính năng đã triển khai

### Xác thực
- [x] Đăng ký (name, email, password, validate email format, password >= 6 ký tự)
- [x] Đăng nhập, nhận JWT token (7 ngày)
- [x] Lấy thông tin người dùng hiện tại (`GET /auth/me`)
- [x] JWT middleware — trích xuất Bearer token, verify, lookup user
- [x] Phân quyền admin — middleware `authorize(...roles)`, User model có field `role: user|admin`
- [x] Axios interceptor — tự động attach token, redirect `/login` khi 401
- [x] Token + user persist trong localStorage, Zustand store hydration
- [x] Giao diện Login/Register dạng tab (Ant Design Tabs), validation form, error alert
- [x] Auto-login sau khi đăng ký thành công
- [x] Logout — xóa localStorage, reset store
- [x] ProtectedRoute / PublicRoute wrapper cho React Router

### Quản lý tài liệu
- [x] Tạo tài liệu (title optional, mặc định "Untitled Document")
- [x] Danh sách tài liệu — owned + shared, sắp xếp `updatedAt` giảm dần
- [x] Xem metadata tài liệu + kiểm tra quyền truy cập (owner/collaborator)
- [x] Đổi tên tài liệu (yêu cầu editor+)
- [x] Xóa tài liệu (chỉ owner, xóa cứng khỏi MongoDB)
- [x] Dashboard grid — card hiển thị title, date, role badge
- [x] Modal tạo tài liệu (Ant Design Modal + Form)
- [x] Modal đổi tên tại chỗ
- [x] Xác nhận xóa (modal.confirm)
- [x] Skeleton loading (6 cards) khi đang tải
- [x] Empty state — illustration + CTA khi chưa có tài liệu

### Cộng tác thời gian thực (Yjs + WebSocket)
- [x] CRDT sync qua Yjs + y-protocols (messageSync=0, messageAwareness=1)
- [x] WebSocket server tùy chỉnh với `ws` library
- [x] Kiến trúc Room — 1 Y.Doc + Awareness mỗi document, in-memory Map
- [x] Persist Yjs state — binary Buffer lưu vào MongoDB field `yjsState`
- [x] Auto-save debounce 3 giây + final save khi user cuối disconnect
- [x] Load state từ MongoDB khi có client đầu tiên join room
- [x] JWT auth trên WebSocket upgrade — token qua query param
- [x] Authorization — kiểm tra quyền truy cập document trước khi cho join
- [x] Viewer write blocking — server drop các sync update từ viewer
- [x] Ping/pong keepalive 30 giây, terminate kết nối stale
- [x] Room cleanup — destroy Y.Doc, xóa khỏi memory khi không còn ai
- [x] Resync interval 1 giây — đảm bảo client nhận SyncStep2 và set `synced=true`
- [x] SyncStep1 / SyncStep2 / Update được xử lý đúng theo y-protocols spec

### Phân quyền & Chia sẻ
- [x] 3 vai trò: owner / editor / viewer
- [x] Permission model nhúng trong Document (`collaborators: [{userId, role}]`)
- [x] `doc.getRole(userId)`, `canRead()`, `canEdit()`, `canManage()` instance methods
- [x] Share bằng email hoặc userId, tự động tìm user
- [x] Upsert — nếu user đã có quyền thì update role, không duplicate
- [x] Ngăn tự share cho chính mình
- [x] Danh sách permissions — populated name, email, role (cả owner + collaborators)
- [x] Thu hồi quyền — owner xóa collaborator khỏi mảng
- [x] ShareModal UI — form (email + role select) + danh sách người có quyền
- [x] Role tag màu — gold (owner), blue (editor), default (viewer) + icon Crown
- [x] Viewer mode — editor bị disable, hiển thị banner xanh "view-only"

### Trình soạn thảo (TipTap)
- [x] Bold, Italic, Underline, Strikethrough, Highlight
- [x] Heading 1/2/3 — với active state riêng từng level
- [x] Bullet list, Ordered list, Task list (checkbox)
- [x] Blockquote, Code block, Horizontal rule
- [x] Undo / Redo (qua Yjs, không qua TipTap history) — disable khi hết lịch sử
- [x] Placeholder "Start writing..." / "Loading..."
- [x] TipTap StarterKit (doc, paragraph, text, hardBreak, history=disabled)
- [x] Collaboration cursor — tên + màu hiển thị trên con trỏ từ xa
- [x] Toolbar bị disable khi là viewer (`pointer-events-none` + opacity)
- [x] CSS ProseMirror đầy đủ — typography, code block dark theme, task list, blockquote

### UI/UX
- [x] Responsive — grid layout, breakpoints sm/md/lg/xl
- [x] Spin overlay "Syncing document..." khi đang tải document
- [x] Connection status indicator — green/red dot + Wifi/WifiOff icon
- [x] Viewer notice banner — info bar "You have view-only access"
- [x] Toast notifications — success/error cho rename, share, delete, revoke
- [x] Navbar sticky — logo "CE", user avatar dropdown (profile + logout)
- [x] Sidebar — Online users list + connection status + role tag
- [x] User avatars — initials + random color, Avatar.Group tối đa 5
- [x] Gradient branding — "CollabEdit" + logo gradient blue→indigo
- [x] Ant Design theme tùy chỉnh — primary #2563eb, border radius, font Inter
- [x] Form validation client-side với Ant Design Form rules
- [x] Login page gradient background

### Kỹ thuật / Hạ tầng
- [x] Monorepo — `concurrently` chạy backend + frontend từ 1 lệnh `npm run dev`
- [x] Express 5, Node.js ESM (`"type": "module"`)
- [x] MongoDB + Mongoose — schema validation, index, refs
- [x] bcryptjs hash password — 12 salt rounds, pre-save hook
- [x] Global error handler — bắt Mongoose ValidationError, CastError, duplicate key 11000
- [x] 404 handler cho route không tồn tại
- [x] CORS enabled
- [x] Morgan request logger (development mode)
- [x] dotenv — env vars cho PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN
- [x] Axios interceptors — attach token + redirect 401
- [x] Zustand stores — authStore (localStorage hydration), documentStore
- [x] React 18 StrictMode
- [x] Vite 6 — HMR, React plugin, port 5173
- [x] React Router 7 — route protection wrappers
- [x] Tailwind CSS 3 — custom primary color palette, animations (fade-in, slide-up, scale-in)
- [x] PostCSS + Autoprefixer
- [x] Debounced title update (800ms) khi gõ tiêu đề trong editor
- [x] Relative date formatting — "Just now", "5m ago", "3h ago", "Jan 5"

---

## Tính năng chưa hoàn thiện (bug / partial)

| Tính năng | Trạng thái | Mô tả |
|-----------|-----------|-------|
| Cập nhật thông tin user | **Hỏng** | `user.controller.js:updateUser` destructure `password` và `role` nhưng không dùng đến → không thể đổi mật khẩu hoặc role |
| Quản lý role admin | **Hỏng** | Middleware authorize hoạt động đúng nhưng controller không thể set role |
| Document state REST API | **Không dùng** | `GET/PUT /documents/:id/state` hoạt động nhưng frontend không gọi (sync hoàn toàn qua WS) |
| SocketService | **Orphan** | `socketService.js` được định nghĩa nhưng không file nào import |
| User awareness | **Fragile** | `setAwarenessUser` trong `useSocket.js` bị gọi lại mỗi render do user object thay đổi tham chiếu |

---

## Tính năng cần triển khai tiếp theo

### Ưu tiên CAO — Bảo mật & Xác thực
- [ ] **Đổi mật khẩu** — yêu cầu xác nhận mật khẩu hiện tại
- [ ] **Quên mật khẩu** — gửi email reset link
- [ ] **Rate limiting** — chống brute-force trên endpoint login/register (express-rate-limit)
- [ ] **Input validation** — dùng thư viện chuyên dụng (zod / express-validator)
- [ ] **Helmet.js** — security headers (CSP, X-Frame-Options, v.v.)
- [ ] **Refresh token** — hiện chỉ có 1 JWT 7 ngày, không có cơ chế revoke

### Ưu tiên CAO — Soạn thảo
- [ ] **Hỗ trợ ảnh** — upload, embed, resize trong tài liệu
- [ ] **Bảng (table)** — tạo, thêm/xóa hàng/cột
- [ ] **Link** — chèn/sửa/xóa hyperlink
- [ ] **Căn lề** — trái, giữa, phải, justify
- [ ] **Đếm từ** — hiển thị số từ/ký tự trực tiếp
- [ ] **Tìm kiếm & thay thế** — search trong nội dung tài liệu
- [ ] **Text color / highlight color** — color picker cho chữ và nền

### Ưu tiên TRUNG BÌNH — Quản lý tài liệu
- [ ] **Tìm kiếm tài liệu** — search bar trên dashboard gọi API backend
- [ ] **Nhân bản tài liệu** — clone document + nội dung
- [ ] **Export** — PDF, Markdown, HTML, plain text
- [ ] **Import** — mở file Markdown/HTML
- [ ] **Lịch sử phiên bản** — track & restore phiên bản cũ (Yjs đã lưu toàn bộ thay đổi)
- [ ] **Sắp xếp** — sort by name, date, role trên dashboard
- [ ] **Phân trang** — limit + offset cho API list documents/users
- [ ] **Chuyển quyền sở hữu** — owner chuyển quyền cho người khác

### Ưu tiên TRUNG BÌNH — Cộng tác
- [ ] **Comment inline** — thread thảo luận trên đoạn văn bản
- [ ] **Chat panel** — chat text bên cạnh tài liệu cho collaborators
- [ ] **Typing indicator** — "John is typing..." khi người khác đang gõ
- [ ] **Join/leave notification** — toast khi collaborator kết nối/ngắt kết nối
- [ ] **Theo dõi người dùng** — scroll đến vị trí con trỏ của collaborator khác

### Ưu tiên TRUNG BÌNH — Chia sẻ & Phân quyền
- [ ] **Chia sẻ bằng link** — tạo link share (có thể kèm password)
- [ ] **Audit log** — ghi lại ai share/revoke, lúc nào
- [ ] **Nhóm người dùng** — share cho nhóm/team có sẵn
- [ ] **Quyền tạm thời** — đặt ngày hết hạn cho collaborator

### Ưu tiên THẤP — UI/UX
- [ ] **Dark mode** — Ant Design dark theme + Tailwind dark class
- [ ] **Keyboard shortcuts** — modal liệt kê tất cả phím tắt
- [ ] **Onboarding** — hướng dẫn lần đầu cho người dùng mới
- [ ] **Breadcrumb** — navigation từ dashboard đến editor
- [ ] **Save status indicator** — "Saving...", "Saved", "Unsaved changes"
- [ ] **Accessibility** — ARIA labels, keyboard nav, screen reader
- [ ] **i18n** — đa ngôn ngữ
- [ ] **Mobile PWA** — Progressive Web App + offline support

### Ưu tiên THẤP — Hạ tầng kỹ thuật
- [ ] **Testing** — unit test (Vitest), integration test, E2E (Playwright)
- [ ] **TypeScript** — chuyển đổi sang TS cho cả frontend và backend
- [ ] **Docker** — Dockerfile + docker-compose
- [ ] **CI/CD** — GitHub Actions: lint → test → build → deploy
- [ ] **API documentation** — OpenAPI/Swagger
- [ ] **Database seeding** — script tạo dữ liệu mẫu cho dev/test
- [ ] **Graceful shutdown** — SIGTERM handler persist Yjs rooms trước khi exit
- [ ] **Horizontal scaling** — Redis pub/sub cho Yjs awareness khi có nhiều server instance
- [ ] **Monitoring** — health check endpoints, Prometheus metrics, Sentry error tracking
- [ ] **HTTPS/WSS** — TLS termination cho production
- [ ] **Compression** — gzip/brotli response compression
- [ ] **WebSocket hardening** — connection rate limit, message size limit
- [ ] **.env.example** — file mẫu cho developer mới

---

## Bug đã phát hiện & sửa

| # | Bug | Trạng thái |
|---|-----|-----------|
| 1 | `yjsServer.js` import `verifyToken` nhưng auth middleware không export | Đã fix — `verifyToken` đã được thêm vào middleware |
| 2 | Thiếu `getRole` method trên Document model → authorizeConnection crash | Đã fix — Document model đã được refactor có `getRole` |
| 3 | `DocumentPermission` model bị xóa nhưng controller cũ import → crash | Đã fix — controller đã refactor sang collaborators nhúng |
| 4 | MongoDB index `username_1` sót lại gây lỗi duplicate `{username: null}` | Đã fix — xóa stale index, chỉ giữ `email_1` |
| 5 | `y-websocket` client `synced` không bao giờ `true` → spinner vô hạn | Đã fix — thêm `resyncInterval: 1000` |
| 6 | `updateUser` controller destructure `password`, `role` nhưng bỏ qua | Chưa sửa |
| 7 | Không có pagination cho API list documents/users | Chưa sửa |
| 8 | `GET /users/:id` không giới hạn quyền truy cập | Chưa sửa |
| 9 | `ROUTES.REGISTER` được định nghĩa nhưng không có route `/register` | Chưa sửa |
| 10 | `SocketService` class không được sử dụng ở đâu | Chưa sửa |
