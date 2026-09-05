# Migration Script: Thêm các trường Hoa hồng vào bảng DUAN
# Date: 2025-11-06
# Run this in PowerShell: .\migrations\run-hoa-hong-migration.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  💰 MIGRATION: HOA HỒNG DỰ ÁN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Config
$MYSQL_USER = "root"
$MYSQL_PASS = ""  # Thay đổi nếu có password
$DATABASE = "thue_tro"
$MYSQL_PATH = "C:\xampp\mysql\bin\mysql.exe"  # XAMPP default path
$MIGRATION_FILE = "migrations\2025_11_06_add_hoa_hong_to_duan.sql"

# Check if MySQL exists
if (-not (Test-Path $MYSQL_PATH)) {
    Write-Host "❌ Không tìm thấy MySQL tại: $MYSQL_PATH" -ForegroundColor Red
    Write-Host "Vui lòng cập nhật `$MYSQL_PATH trong script này." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tìm thấy MySQL" -ForegroundColor Green

# Check if migration file exists
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ Không tìm thấy file migration: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tìm thấy file migration" -ForegroundColor Green

# Warning
Write-Host ""
Write-Host "⚠️  CẢNH BÁO:" -ForegroundColor Yellow
Write-Host "   - Migration này sẽ thêm các trường hoa hồng vào bảng DUAN" -ForegroundColor Yellow
Write-Host "   - Nên backup database trước khi chạy:" -ForegroundColor Yellow
Write-Host "     mysqldump -u root -p thue_tro > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql" -ForegroundColor Gray
Write-Host ""
$confirm = Read-Host "Bạn có muốn tiếp tục? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Đã hủy migration" -ForegroundColor Red
    exit 0
}

# Run migration
Write-Host ""
Write-Host "🔄 Đang chạy migration..." -ForegroundColor Yellow

$migrationPath = Resolve-Path $MIGRATION_FILE

if ($MYSQL_PASS -eq "") {
    & $MYSQL_PATH -u $MYSQL_USER $DATABASE -e "source $($migrationPath.Path)"
} else {
    & $MYSQL_PATH -u $MYSQL_USER -p$MYSQL_PASS $DATABASE -e "source $($migrationPath.Path)"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration thành công!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Các trường đã được thêm vào bảng DUAN:" -ForegroundColor Cyan
    Write-Host "   - TrangThaiDuyetHoaHong (ENUM)" -ForegroundColor Gray
    Write-Host "   - BangHoaHong (DECIMAL)" -ForegroundColor Gray
    Write-Host "   - SoThangCocToiThieu (INT)" -ForegroundColor Gray
    Write-Host "   - LyDoTuChoiHoaHong (TEXT)" -ForegroundColor Gray
    Write-Host "   - GhiChuHoaHong (TEXT)" -ForegroundColor Gray
    Write-Host "   - NguoiDuyetHoaHongID (INT)" -ForegroundColor Gray
    Write-Host "   - ThoiGianDuyetHoaHong (DATETIME)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 Để verify migration, chạy:" -ForegroundColor Cyan
    Write-Host "   SHOW COLUMNS FROM duan LIKE '%HoaHong%';" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Lỗi khi chạy migration!" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra lại database và thử lại." -ForegroundColor Yellow
    exit 1
}







