# Thư mục lưu trữ ảnh KYC

## Cấu trúc
```
uploads/kyc/
├── cccd_front/    # Ảnh CCCD mặt trước
├── cccd_back/     # Ảnh CCCD mặt sau
└── selfie/        # Ảnh selfie xác thực
```

## Bảo mật
- **Không commit ảnh lên Git** - Đã thêm vào `.gitignore`
- Chỉ user và admin được phép truy cập ảnh
- Ảnh tự động xóa sau 30 ngày nếu KYC thất bại

## Permissions
- Server cần quyền write vào thư mục này
- Trên production: `chmod 755 uploads/kyc/`

## Dung lượng
- Max file size: 5MB/ảnh
- Định dạng: JPG, PNG
