# Cập nhật logic tiền cọc và hoa hồng

Ngày: 2025-12-10

## Tổng quan
- Điều chỉnh công thức tiền cọc: `Số tiền cọc = SoThangCocToiThieu × Giá phòng` (không phụ thuộc vào số tháng ký hợp đồng).
- Doanh thu công ty: `Doanh thu = Số tiền cọc × % hoa hồng theo tháng cọc` (lấy theo bảng `BangHoaHong`).
- Thu nhập NVBH: `Doanh thu × 50%` (hoặc theo `hosonhanvien.TyLeHoaHong`).
- Thu nhập NVDH: `Doanh thu × 10%` (hoặc theo `hosonhanvien.TyLeHoaHong`).

## Thay đổi Backend
- `server/controllers/HopDongCustomerController.js`
  - Join thêm bảng `duan` để lấy `SoThangCocToiThieu`.
  - Tính `SoTienCoc` = `GiaPhong × SoThangCocToiThieu`.
- `server/models/PublicTinDangModel.js`
  - Trả về thêm các trường: `BangHoaHong`, `SoThangCocToiThieu` trong API chi tiết tin đăng (`GET /api/public/tin-dang/:id`).

## Thay đổi Frontend
- `client/src/pages/chitiettindang/index.jsx`
  - Preview hợp đồng: `soTienCoc` = `SoThangCocToiThieu × GiaPhong`.
  - Kiểm tra số dư ví trước đặt cọc: so sánh với `SoThangCocToiThieu × GiaPhong`.
  - Hiển thị số tiền cọc hiện tại theo công thức mới.
  - Giữ `soThangKy` (tháng ký hợp đồng) để tính `NgayKetThuc`, không ảnh hưởng đến tiền cọc.

## Ảnh hưởng API
- `GET /api/public/tin-dang/:id`: bổ sung trường `BangHoaHong`, `SoThangCocToiThieu`.
- `POST /api/hop-dong/:tinDangId/confirm-deposit`: không đổi schema, nhưng backend luôn tính `SoTienCoc` theo công thức mới.

## Kiểm thử đề xuất
- Case phòng có `GiaTinDang`, dự án có `SoThangCocToiThieu = 1`: tiền cọc = giá tháng.
- Case `SoThangCocToiThieu = 2`: tiền cọc = 2 × giá tháng; số dư ví phải ≥ tiền cọc.
- Case tiers `BangHoaHong = [{6,30},{12,70}]`: sau khi tạo hợp đồng, `HoaHongService` tính `soThangCocThucTe` từ tiền cọc/giá phòng và áp dụng đúng %.

## Ghi chú
- Chưa thay đổi `HopDongTemplateService` vì preview đã nhận `soTienCoc` qua overrides.
- Nếu cần hiển thị chi tiết hoa hồng trên UI, dùng các trường mới từ API chi tiết tin đăng để map tier.
