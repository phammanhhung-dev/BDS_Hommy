# 🚀 Hướng Dẫn Deploy Hommy Website

## Tổng Quan

| Service | Nền tảng | URL sau deploy |
|---------|----------|----------------|
| Frontend (React) | Vercel | `https://hommy-website.vercel.app` |
| Backend (Node.js) | Railway | `https://hommy-backend.up.railway.app` |
| Database (MySQL) | Railway | (internal, không có URL public) |
| ML Service (Python) | Railway | `https://hommy-ml.up.railway.app` |

---

## BƯỚC 1: Push Code Lên GitHub

Mở terminal tại thư mục gốc dự án và chạy:

```bash
# 1. Khởi tạo git (nếu chưa có)
git init

# 2. Thêm tất cả file
git add .

# 3. Commit
git commit -m "chore: prepare for production deployment"

# 4. Tạo repo trên GitHub tại: https://github.com/new
#    Đặt tên: hommy-website
#    Chọn: Private hoặc Public
#    KHÔNG tick "Add README" (đã có sẵn)

# 5. Kết nối và push
git remote add origin https://github.com/TEN_CUA_BAN/hommy-website.git
git branch -M main
git push -u origin main
```

> ⚠️ Thay `TEN_CUA_BAN` bằng username GitHub của bạn

---

## BƯỚC 2: Setup MySQL Database Trên Railway

### 2.1 Tạo Project Railway
1. Truy cập: **https://railway.app**
2. Đăng nhập bằng GitHub
3. Click **"New Project"** → **"Empty project"**
4. Đặt tên project: `hommy-production`

### 2.2 Thêm MySQL Database
1. Trong project, click **"+ New"** → **"Database"** → **"Add MySQL"**
2. Đợi MySQL khởi động (khoảng 30 giây)
3. Click vào MySQL service → tab **"Variables"**
4. Sao chép các giá trị sau (sẽ dùng ở bước 3):
   - `MYSQL_HOST` (hoặc `MYSQLHOST`)
   - `MYSQL_PORT` (hoặc `MYSQLPORT`)
   - `MYSQL_USER` (hoặc `MYSQLUSER`)
   - `MYSQL_PASSWORD` (hoặc `MYSQLPASSWORD`)
   - `MYSQL_DATABASE` (hoặc `MYSQLDATABASE`)

### 2.3 Import Database
1. Click MySQL service → tab **"Connect"**
2. Copy **MySQL Public URL** (dạng: `mysql://user:pass@host:port/db`)
3. Mở **MySQL Workbench** hoặc **TablePlus** trên máy
4. Kết nối với thông tin từ Railway
5. Import file `realestate.sql`:
   ```sql
   -- Trong MySQL Workbench: Server > Data Import > Import from File
   -- Chọn file: realestate.sql
   ```

> 💡 Hoặc dùng lệnh MySQL CLI:
> ```bash
> mysql -h HOST -P PORT -u USER -pPASSWORD DATABASE < realestate.sql
> ```

---

## BƯỚC 3: Deploy Backend (Node.js) Lên Railway

### 3.1 Thêm Service Backend
1. Trong project Railway, click **"+ New"** → **"GitHub Repo"**
2. Chọn repo `hommy-website`
3. Đặt tên service: `backend`

### 3.2 Cấu hình Service
1. Click service backend → tab **"Settings"**
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `node index.js`

### 3.3 Thêm Biến Môi Trường
Click tab **"Variables"** và thêm:

```env
NODE_ENV=production
PORT=5000

# Database (copy từ MySQL service Railway)
DB_HOST=<MYSQLHOST từ Railway>
DB_PORT=<MYSQLPORT từ Railway>
DB_USER=<MYSQLUSER từ Railway>
DB_PASSWORD=<MYSQLPASSWORD từ Railway>
DB_NAME=<MYSQLDATABASE từ Railway>

# Security (TẠO SECRET MẠNH - ví dụ: openssl rand -base64 64)
JWT_SECRET=<chuoi_secret_rat_dai_va_ngau_nhien>
JWT_EXPIRES_IN=7d

# URLs (điền sau khi có URL)
CLIENT_URL=https://<ten-app>.vercel.app
ML_SERVICE_URL=https://<ml-service>.up.railway.app

# Địa chỉ API
ADDRESS_API_URL=https://<backend-url>.up.railway.app
```

### 3.4 Deploy
1. Click **"Deploy"** → Đợi build xong (~2-3 phút)
2. Click tab **"Settings"** → **"Networking"** → **"Generate Domain"**
3. Sao chép URL (dạng: `https://backend-production-xxxx.up.railway.app`)

---

## BƯỚC 4: Deploy ML Service (Python) Lên Railway

### 4.1 Thêm Service ML
1. Trong cùng project Railway, click **"+ New"** → **"GitHub Repo"**
2. Chọn cùng repo `hommy-website`
3. Đặt tên service: `ml-service`

### 4.2 Cấu hình Service
1. Click service → tab **"Settings"**
2. **Root Directory**: `ml-service`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`

### 4.3 Thêm Biến Môi Trường
```env
PORT=8000
```

### 4.4 Deploy và Lấy URL
1. Click **"Deploy"** → Đợi (~3-5 phút vì phải load model.pkl 14MB)
2. Generate Domain → sao chép URL ML service
3. **Quay lại service Backend** → cập nhật `ML_SERVICE_URL` = URL ML vừa copy

---

## BƯỚC 5: Deploy Frontend Lên Vercel

### 5.1 Import Project
1. Truy cập: **https://vercel.com**
2. Đăng nhập bằng GitHub
3. Click **"Add New..."** → **"Project"**
4. Import repo `hommy-website`

### 5.2 Cấu Hình Build
| Setting | Giá trị |
|---------|---------|
| **Framework Preset** | Vite |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 5.3 Thêm Biến Môi Trường
Click **"Environment Variables"** và thêm:

```env
VITE_API_BASE_URL=https://<backend-url>.up.railway.app
VITE_APP_NAME=Hommy
VITE_VAPID_PUBLIC_KEY=BIzyifyBg5pZR8I45YdNobtHYWAXumLC7xlRwdVGtKZpPNPAQupBHHyfQkdzCGF-v9Ae5jvk8T2wNfj5jneuFtU
```

### 5.4 Deploy
1. Click **"Deploy"**
2. Đợi ~2-3 phút
3. Sao chép URL Vercel (dạng: `https://hommy-website.vercel.app`)

### 5.5 Cập nhật Backend
Quay lại Railway backend → cập nhật:
```env
CLIENT_URL=https://hommy-website.vercel.app
```
Redeploy backend.

---

## BƯỚC 6: Kiểm Tra Sau Deploy

### Checklist
- [ ] Truy cập URL Vercel → thấy trang chủ Hommy
- [ ] Đăng nhập thành công
- [ ] Xem danh sách tin đăng
- [ ] Tạo tin đăng mới
- [ ] Tính năng dự đoán giá AI (`/api/health` của ML service)
- [ ] Chat realtime hoạt động

### Test API Backend
```bash
# Kiểm tra backend
curl https://<backend>.up.railway.app/

# Kiểm tra ML service
curl https://<ml-service>.up.railway.app/api/health
```

---

## Xử Lý Lỗi Thường Gặp

### ❌ Frontend trắng sau deploy
→ Kiểm tra `VITE_API_BASE_URL` đúng URL Railway chưa

### ❌ CORS error
→ Kiểm tra `CLIENT_URL` trong Railway Backend đúng domain Vercel

### ❌ Database connection failed
→ Kiểm tra `DB_HOST`, `DB_PASSWORD` đúng với thông tin Railway MySQL

### ❌ ML Service timeout
→ Model.pkl (14MB) mất thời gian load. Đợi 1-2 phút sau khi deploy xong

### ❌ 502 Bad Gateway
→ Service đang khởi động. Đợi 1-2 phút và reload

---

## Lưu Ý Quan Trọng

> [!WARNING]
> **JWT_SECRET** PHẢI được đổi thành chuỗi ngẫu nhiên mạnh trên production. Dùng lệnh:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

> [!NOTE]
> Railway free tier có **$5 credit/tháng**. Project này chạy ~3 services (backend + MySQL + ML) sẽ tiêu khoảng **$3-5/tháng** — vừa đủ cho demo đồ án.

> [!TIP]
> Sau khi có URL Vercel và Railway, cần **redeploy backend** một lần để `CLIENT_URL` và `ML_SERVICE_URL` được cập nhật đúng.
