# Splitly

Splitly là ứng dụng quản lý chi tiêu nhóm: tạo nhóm, thêm thành viên, theo dõi chi phí, xem dashboard và hỗ trợ luồng đăng nhập/đăng ký/quên mật khẩu bằng OTP qua email.

## Tính năng chính

- Đăng ký, đăng nhập và lưu phiên người dùng bằng JWT.
- Quên mật khẩu theo flow OTP: nhập email, nhận OTP qua email, xác thực OTP, đặt mật khẩu mới và đăng nhập lại bằng mật khẩu mới.
- Quản lý profile cá nhân và đổi mật khẩu khi đã đăng nhập.
- Quản lý nhóm: tạo nhóm, xem danh sách nhóm, xem chi tiết nhóm, cập nhật/xóa nhóm, thêm/xóa thành viên.
- Giao diện web React/Vite cho landing page, dashboard, groups, expenses, settlement, receipts, admin và settings.
- Backend Express + MongoDB có Swagger UI để kiểm thử API.

## Tech stack

- Frontend: React, Vite, React Router, Tailwind CSS, Radix UI, Lucide Icons.
- Backend: Node.js, Express, TypeScript, MongoDB native driver.
- Auth/Security: bcryptjs, JWT, password reset OTP được hash trước khi lưu DB.
- Email: Nodemailer Gmail SMTP cho local/dev, Resend cho production khi đã verify domain.
- Dev tools: Docker Compose cho MongoDB local, Swagger UI cho API docs.

## Cấu trúc dự án

```text
project-fcaj/
├─ src/                  # Frontend React/Vite
│  ├─ main.tsx
│  ├─ styles/
│  └─ web/
│     ├─ api/            # API client cho auth, users, groups
│     ├─ components/     # Pages và UI components
│     └─ context/
├─ be/                   # Backend Express/TypeScript
│  ├─ src/
│  │  ├─ config/         # env + swagger config
│  │  ├─ db/             # MongoDB connection
│  │  ├─ middleware/     # auth/error middleware
│  │  ├─ modules/        # auth, users, groups, system
│  │  └─ server.ts
│  └─ package.json
├─ docker-compose.yml
└─ package.json
```

## Yêu cầu môi trường

- Node.js 20+ khuyến nghị.
- npm.
- MongoDB Atlas hoặc MongoDB local qua Docker.
- Nếu muốn gửi OTP thật bằng Gmail: tài khoản Gmail đã bật 2-Step Verification và App Password.

## Cài đặt local

1. Cài dependencies frontend:

```powershell
npm install
```

2. Cài dependencies backend:

```powershell
npm --prefix be install
```

3. Tạo file môi trường backend:

```powershell
Copy-Item .\be\.env.example .\be\.env
```

4. Mở `be/.env` và điền thông tin MongoDB, JWT secret, email provider.

5. Chạy MongoDB local bằng Docker nếu không dùng MongoDB Atlas:

```powershell
npm run db:up
```

6. Chạy backend:

```powershell
npm run backend
```

Backend mặc định chạy tại `http://localhost:5000`.

7. Chạy frontend ở terminal khác:

```powershell
npm run dev
```

Frontend mặc định chạy tại `http://localhost:5173`.

## Cấu hình `.env`

Không commit `be/.env` lên Git. File này chứa secret riêng của từng máy/dev.

Ví dụ cơ bản:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=Splitly
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=console
```

### Email OTP bằng console

Dùng cho dev nhanh, OTP và reset link sẽ hiện trong terminal backend:

```env
EMAIL_PROVIDER=console
```

### Email OTP bằng Gmail SMTP

Dùng khi muốn gửi OTP thật tới nhiều email khác nhau trong lúc chạy local:

```env
EMAIL_PROVIDER=gmail
GMAIL_SMTP_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_character_google_app_password
EMAIL_FROM=Splitly <your-gmail@gmail.com>
```

Lưu ý: `GMAIL_APP_PASSWORD` không phải mật khẩu Gmail thường. Hãy bật 2-Step Verification trong Google Account rồi tạo App Password.

### Email OTP bằng Resend

Dùng tốt cho production hoặc khi đã verify domain trong Resend:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key
RESEND_API_URL=https://api.resend.com/emails
EMAIL_FROM=Splitly <no-reply@your-verified-domain.com>
```

Nếu dùng `onboarding@resend.dev`, Resend chỉ cho gửi test tới email chủ tài khoản Resend.

## Luồng quên mật khẩu

1. User bấm `Forgot password` ở trang login.
2. User nhập email tài khoản.
3. Backend tạo OTP 6 số, hash OTP và lưu vào MongoDB kèm thời hạn.
4. Backend gửi OTP qua email provider đang cấu hình.
5. Frontend chuyển user sang trang nhập OTP.
6. Nếu OTP sai hoặc hết hạn, backend trả lỗi và user vẫn đứng ở trang OTP.
7. Nếu OTP đúng, frontend chuyển sang form đặt mật khẩu mới.
8. Backend hash mật khẩu mới, cập nhật DB và xóa các field reset token/OTP.
9. Frontend chuyển user về trang login.

## API docs

Khi backend đang chạy:

- Swagger UI: `http://localhost:5000`
- OpenAPI JSON: `http://localhost:5000/docs.json`
- Health check: `GET http://localhost:5000/health`
- MongoDB test: `GET http://localhost:5000/api/test`

Các nhóm API chính:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-reset-otp`
- `POST /api/auth/reset-password`
- `GET/PATCH /api/users/me`
- `PATCH /api/users/me/password`
- `GET/POST /api/groups`
- `GET/PATCH/DELETE /api/groups/:groupId`
- `POST /api/groups/:groupId/members`
- `DELETE /api/groups/:groupId/members/:memberId`

## Scripts

Frontend/root:

```powershell
npm run dev              # Chạy Vite frontend
npm run build            # Build frontend production
npm run backend          # Chạy backend dev từ root
npm run backend:start    # Chạy backend dist sau khi build backend
npm run db:up            # Chạy MongoDB local bằng Docker
npm run db:down          # Tắt Docker Compose
```

Backend:

```powershell
npm --prefix be run dev
npm --prefix be run build
npm --prefix be run start
```

## Kiểm tra trước khi mở Pull Request

```powershell
npm run build
npm --prefix be run build
```

Nếu có thay đổi liên quan auth/email, nên test lại flow:

- Register user mới.
- Login bằng mật khẩu ban đầu.
- Forgot password để nhận OTP.
- Nhập OTP sai và kiểm tra vẫn đứng ở trang OTP.
- Nhập OTP đúng, đặt mật khẩu mới.
- Login lại bằng mật khẩu mới.

## Ghi chú bảo mật

- Không commit `be/.env`, Gmail App Password, Resend API key, MongoDB URI thật hoặc JWT secret.
- OTP/reset token chỉ lưu dạng hash trong MongoDB.
- Sau khi reset mật khẩu thành công, backend xóa OTP/reset token khỏi user document.
- Với production, nên dùng domain email đã verify và JWT secret đủ dài/ngẫu nhiên.
