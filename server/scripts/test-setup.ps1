# Test Setup Script cho Windows
# Run this in PowerShell: .\test-setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🧪 CHAT FEATURE TEST SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Config
$MYSQL_USER = "root"
$MYSQL_PASS = ""  # Thay đổi nếu có password
$DATABASE = "thue_tro"
$MYSQL_PATH = "C:\xampp\mysql\bin\mysql.exe"  # XAMPP default path

# Check if MySQL exists
if (-not (Test-Path $MYSQL_PATH)) {
    Write-Host "❌ Không tìm thấy MySQL tại: $MYSQL_PATH" -ForegroundColor Red
    Write-Host "Vui lòng cập nhật `$MYSQL_PATH trong script này." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tìm thấy MySQL" -ForegroundColor Green

# Step 1: Import Test Data
Write-Host ""
Write-Host "📦 Step 1: Import test data..." -ForegroundColor Yellow

if (Test-Path "server\tests\test-data.sql") {
    Write-Host "Đang import test-data.sql..." -ForegroundColor Gray
    
    if ($MYSQL_PASS -eq "") {
        & $MYSQL_PATH -u $MYSQL_USER $DATABASE -e "source server/tests/test-data.sql"
    } else {
        & $MYSQL_PATH -u $MYSQL_USER -p$MYSQL_PASS $DATABASE -e "source server/tests/test-data.sql"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Import test data thành công!" -ForegroundColor Green
    } else {
        Write-Host "❌ Lỗi khi import test data" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Không tìm thấy file server\tests\test-data.sql" -ForegroundColor Red
    exit 1
}

# Step 2: Run Migrations
Write-Host ""
Write-Host "🔄 Step 2: Chạy migrations..." -ForegroundColor Yellow

# Migration 1
if (Test-Path "migrations\2025_11_04_add_hopdong_filescan.sql") {
    Write-Host "Đang chạy migration: add_hopdong_filescan..." -ForegroundColor Gray
    
    if ($MYSQL_PASS -eq "") {
        & $MYSQL_PATH -u $MYSQL_USER $DATABASE -e "source migrations/2025_11_04_add_hopdong_filescan.sql"
    } else {
        & $MYSQL_PATH -u $MYSQL_USER -p$MYSQL_PASS $DATABASE -e "source migrations/2025_11_04_add_hopdong_filescan.sql"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration 1 thành công!" -ForegroundColor Green
    }
}

# Migration 2
if (Test-Path "migrations\2025_11_04_update_chat_schema.sql") {
    Write-Host "Đang chạy migration: update_chat_schema..." -ForegroundColor Gray
    
    if ($MYSQL_PASS -eq "") {
        & $MYSQL_PATH -u $MYSQL_USER $DATABASE -e "source migrations/2025_11_04_update_chat_schema.sql"
    } else {
        & $MYSQL_PATH -u $MYSQL_USER -p$MYSQL_PASS $DATABASE -e "source migrations/2025_11_04_update_chat_schema.sql"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration 2 thành công!" -ForegroundColor Green
    }
}

# Step 3: Create directories
Write-Host ""
Write-Host "📁 Step 3: Tạo thư mục uploads..." -ForegroundColor Yellow

$dirs = @(
    "public\uploads\temp",
    "public\uploads\hop-dong"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Write-Host "✅ Tạo thư mục: $dir" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Thư mục đã tồn tại: $dir" -ForegroundColor Yellow
    }
}

# Step 4: Verify installation
Write-Host ""
Write-Host "🔍 Step 4: Verify database..." -ForegroundColor Yellow

$verifyQuery = @"
SELECT 
    (SELECT COUNT(*) FROM cuochoithoai WHERE CuocHoiThoaiID >= 201) as Conversations,
    (SELECT COUNT(*) FROM tinnhan WHERE CuocHoiThoaiID >= 201) as Messages,
    (SELECT COUNT(*) FROM nguoidung WHERE NguoiDungID >= 201) as TestUsers;
"@

Write-Host "Kiểm tra dữ liệu test..." -ForegroundColor Gray

if ($MYSQL_PASS -eq "") {
    $result = & $MYSQL_PATH -u $MYSQL_USER $DATABASE -e $verifyQuery -s -N
} else {
    $result = & $MYSQL_PATH -u $MYSQL_USER -p$MYSQL_PASS $DATABASE -e $verifyQuery -s -N
}

if ($result) {
    $stats = $result -split "`t"
    Write-Host ""
    Write-Host "📊 Thống kê:" -ForegroundColor Cyan
    Write-Host "   - Conversations: $($stats[0])" -ForegroundColor White
    Write-Host "   - Messages: $($stats[1])" -ForegroundColor White
    Write-Host "   - Test Users: $($stats[2])" -ForegroundColor White
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP HOÀN TẤT!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Install packages:" -ForegroundColor White
Write-Host "      cd server && npm install socket.io isomorphic-dompurify multer" -ForegroundColor Gray
Write-Host "      cd client && npm install socket.io-client" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Start servers:" -ForegroundColor White
Write-Host "      Terminal 1: cd server && npm start" -ForegroundColor Gray
Write-Host "      Terminal 2: cd client && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Login và test:" -ForegroundColor White
Write-Host "      Email: hopboy553@gmail.com" -ForegroundColor Gray
Write-Host "      Pass:  123456" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Test tool:" -ForegroundColor White
Write-Host "      Mở: server\tests\test-chat-quick.html" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Đọc thêm: QUICK_START_TEST.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy Testing! 🚀" -ForegroundColor Green


