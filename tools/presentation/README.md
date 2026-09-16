# 🎓 Bộ Công Cụ Thuyết Trình Khóa Luận Tốt Nghiệp (Hommy BDS)

Thư mục này chứa các script tự động hóa thiết kế slide PowerPoint và thuyết minh giọng nói AI phục vụ bảo vệ đồ án:

| File | Mô tả chức năng |
| :--- | :--- |
| `generate_v3.py` | Tái cấu trúc bài thuyết trình sang phiên bản 15+1 slides chuẩn KLTN CNTT, bổ sung slide demo và chuẩn hóa phong cách thiết kế |
| `update_pptx.py` | Tự động hóa cập nhật layout, định dạng thẻ, căn lề và phối màu cho slide |
| `fix_pptx.py` | Sửa các lỗi tràn chữ, lệch font và chuẩn hóa tỷ lệ hiển thị trên PowerPoint |
| `verify_pptx.py` | Kiểm tra tính toàn vẹn cấu trúc file PowerPoint trước khi trình chiếu |
| `generate_audio.py` | Tạo file âm thanh thuyết minh tự động tương ứng với từng slide |

## Cách chạy

Sử dụng môi trường ảo Python của dự án:
```powershell
# Chạy sinh slide phiên bản v3:
.\.venv\Scripts\python.exe tools/presentation/generate_v3.py

# Kiểm tra file pptx sau khi sinh:
.\.venv\Scripts\python.exe tools/presentation/verify_pptx.py
```
