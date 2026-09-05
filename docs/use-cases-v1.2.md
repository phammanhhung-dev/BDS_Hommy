# Đặc tả Use Case — Hệ thống Cho thuê Phòng trọ (Managed Marketplace)

**Phiên bản:** 1.2 (2025-09-26)

> Bản 1.2 giữ nguyên 100% nội dung chức năng của v1.1 và **bổ sung/chỉnh lý** để bám sát nghiệp vụ VN ở giai đoạn development theo các điểm đã thống nhất. Các mục sửa đổi đều được ghi chú rõ trong phần Quy tắc & Use Case liên quan.

---

## 0) Mục tiêu & Phạm vi

* **Mục tiêu:** Hiện đại hoá quy trình cho thuê; tăng minh bạch, an toàn; tối ưu tỉ lệ chuyển đổi Nhu cầu → Hẹn → Cọc → Hợp đồng → Bàn giao → Lấp đầy.
* **Phạm vi:** Cho thuê phòng trọ (TinĐăng, hẹn xem, đặt cọc, ký hợp đồng, **bàn giao**).
* **Nguyên tắc:** Trung gian có kiểm soát (KYC, duyệt tin, phân công NVBH, **chính sách cọc theo từng TinĐăng**, ghi NhậtKýHệThống), security-by-default, đo lường được.

---

## 1) Tác nhân (Actors)

* **KhachHang (Customer):** Tìm–hẹn–cọc–ký hợp đồng; **không bắt buộc có số dư ví nội bộ** (hỗ trợ payment hold qua cổng PG; ví nội bộ là tùy chọn, bật khi cần).
* **ChuDuAn (Project Owner):** Đăng tin, theo dõi hiệu suất, xác nhận theo chính sách, tham gia bàn giao.
* **NhanVienBanHang (Sales):** Đăng ký lịch, quản lý CuộcHẹn, xác nhận đặt cọc (nếu quy trình yêu cầu), báo cáo kết quả.
* **NhanVienDieuHanh (Operator):** Duyệt tin, điều phối, có thể act-as (bắt buộc log đầy đủ).
* **QuanTriVien (Admin):** Quản trị tài khoản, dự án, khu vực, MẫuHợpĐồng, chính sách, RBAC, NhậtKýHệThống.
* **Tài khoản đa vai trò:** Một người dùng có thể đảm nhiệm nhiều vai trò; hệ thống hỗ trợ chuyển đổi vai trò tức thời mà không cần đăng xuất.

---

## 2) Từ điển khái niệm (mở rộng)

* **TinĐăng (Listing):** Tin đăng cho thuê bao gồm mô tả, hình ảnh, giá, vị trí, và các thuộc tính khác.
* **Phòng (Unit):** Một đơn vị cho thuê cụ thể (ví dụ: một phòng trong một tòa nhà), được gắn với một TinĐăng.
* **CuộcHẹn (Appointment):** Một cuộc hẹn đã được lên lịch để xem Phòng.
* **MẫuHợpĐồng (Contract Template):** Mẫu hợp đồng có quản lý phiên bản. Hợp đồng khi được tạo ra phải là một bản sao (snapshot) nội dung của mẫu tại thời điểm đó.
* **NhậtKýHệThống (Audit Log):** Bảng ghi lại toàn bộ các hành động quan trọng trên hệ thống để phục vụ việc kiểm toán và theo dõi.
* **BútToánSổCái (Ledger Entry):** Một dòng ghi nhận Ghi Nợ/Ghi Có trong sổ cái tài chính, đảm bảo tính toàn vẹn và không thể thay đổi của các giao dịch.
* **TiềnTạmGiữ (Escrow):** Khoản tiền do hệ thống giữ đến khi đạt điều kiện giải tỏa.
* **CọcGiữChỗ (Reservation Deposit):** Khoản cọc nhỏ, **cho phép đặt trước khi đi xem**; có **TTL ngắn**; nếu không tiến triển sang bước tiếp theo trong TTL sẽ tự động hoàn theo chính sách.
* **CọcAnNinh (Security Deposit):** Khoản cọc chuẩn khi chốt thuê; thường **được giữ đến sau Biên bản bàn giao** và/hoặc bù tiền kỳ đầu theo hợp đồng.
* **BiênBảnBànGiao (Handover Report):** Hồ sơ chốt chỉ số công tơ, hiện trạng tài sản; là **điều kiện giải tỏa** với CọcAnNinh.

---

## 3) Mô hình trạng thái (cập nhật nhẹ)

### 3.1 TinĐăng

`Nhap -> ChoDuyet -> DaDuyet -> DaDang -> (TamNgung | TuChoi) -> LuuTru`

* **Ràng buộc:** Có thể **tạo TinĐăng trước khi KYC** (ở trạng thái Nhap/ChoDuyet); **chỉ được DaDang sau khi KYC đạt**.

### 3.2 Phòng

`Trong <-> GiuCho -> DaThue -> DonDep -> Trong`

* **Ràng buộc:** Trạng thái **GiuCho** có thể đến từ **CọcGiữChỗ** (TTL ngắn) hoặc **CọcAnNinh**. Hết TTL mà không ký/tiến triển → auto release theo chính sách của TinĐăng.

### 3.3 CuộcHẹn

`DaYeuCau -> ChoXacNhan* -> DaXacNhan -> (DaDoiLich | HuyBoiKhach | HuyBoiHeThong | KhachKhongDen) -> HoanThanh`

### 3.4 GiaoDịch / Ví

`KhoiTao -> DaUyQuyen -> DaGhiNhan/DaThanhToan -> (DaHoanTien | DaDaoNguoc)`

* **SổCái:** Append-only; hỗ trợ BútToánĐảoNgược; **Phí nền tảng hạch toán tách giao dịch** (không khấu trừ trực tiếp vào khoản cọc).

### 3.5 Bàn giao

`ChuaBanGiao -> DangBanGiao -> DaBanGiao`

* **Điều kiện giải tỏa CọcAnNinh** gắn với trạng thái **DaBanGiao** (có chữ ký số/hồ sơ đối chứng).

---

## 4) Quy tắc nghiệp vụ toàn cục (điều chỉnh trọng điểm)

### 4.1 Cọc & hoàn cọc (policy-based)

* **Chính sách theo TinĐăng**: Mỗi TinĐăng có thể đính **ChinhSachCoc** (mẫu chuẩn của hệ thống, chủ nhà có thể chọn/ghi đè trong phạm vi cho phép).
* **Loại cọc**:
    * **CọcGiữChỗ**: cho phép đặt **không phụ thuộc CuộcHẹn DaXacNhan**; có **TTL (ví dụ 24–72h)**; hoàn/phạt theo chính sách của TinĐăng.
    * **CọcAnNinh**: đặt ở bước chốt thuê; **điều kiện giải tỏa: BiênBảnBànGiao = DaBanGiao** (trừ khi chính sách quy định khác rõ ràng).
* **Giải tỏa**: Khi **DaBanGiao**, hệ thống **giải tỏa/đối trừ** CọcAnNinh theo chính sách (bù tiền tháng đầu, khấu trừ hư hỏng nếu có biên bản).
* **Phí nền tảng**: **Không khấu trừ từ khoản cọc**; thu bằng giao dịch/hoá đơn riêng, vẫn **hạch toán trên dòng Sổ Cái riêng**.

### 4.2 Idempotency & Rate limits

* Các hành động quan trọng như đặt lịch hoặc đặt cọc sử dụng KhóaĐịnhDanh (Idempotency Key) để chống trùng lặp yêu cầu.
* Áp dụng giới hạn: 5 lần đăng nhập/phút/IP; 3 lần đặt cọc/phút/người dùng; và các cơ chế chống spam chat.

### 4.3 KYC & Tin cậy

* Cho phép **tạo TinĐăng ở trạng thái Nhap/ChoDuyet** trước; **KYC bắt buộc trước khi DaDang**.

### 4.4 SLA vận hành

* Thời gian duyệt tin: ≤ 4 giờ làm việc.
* Thời gian phản hồi chat đầu tiên của NhanVienBanHang trong ca: ≤ 10 phút.
* *Ghi chú*: Giữ như v1.1 và đánh dấu là **mục tiêu/OKR** ở giai đoạn dev (không chặn luồng giao dịch). Alerting có thể bổ sung ở phase sau.

---

## 5) Đặc tả Use Case chi tiết

### 5.1 Chung (GEN)

##### UC-GEN-01: Đăng Nhập

* **Mục tiêu:** Xác thực và tạo phiên truy cập an toàn cho người dùng.
* **Tác nhân:** Tất cả các vai trò.
* **Kích hoạt:** Người dùng mở trang đăng nhập.
* **Tiền điều kiện:** Tài khoản đã tồn tại. Nếu xác thực đa yếu tố (MFA) được bật, người dùng đã cài đặt phương thức MFA.
* **Ràng buộc:** Giới hạn 5 lần/phút/IP. Form đăng nhập được bảo vệ chống lại tấn công CSRF.
* **Hậu điều kiện (Thành công):** Phiên làm việc hoặc JWT hợp lệ; người dùng được chuyển đến trang dashboard tương ứng với vai trò hiện tại.
* **Luồng chính:**
    1.  Người dùng nhập tên đăng nhập/mật khẩu và gửi.
    2.  Hệ thống kiểm tra rate limit và xác thực thông tin (sử dụng password hash).
    3.  (Nếu MFA được bật) Hệ thống yêu cầu mã OTP và xác minh.
    4.  Tạo session/JWT, thiết lập cookie an toàn, và ghi nhận `dang_nhap_thanh_cong` vào NhậtKýHệThống.
    5.  (Mới) Reset bộ đếm số lần đăng nhập sai về 0 cho tài khoản/thiết bị.
    6.  Điều hướng người dùng đến Dashboard.
* **Nhánh/Ngoại lệ:**
    * **2a. Vượt rate limit:** Chặn tạm thời, hiển thị thông báo và TTL.
    * **2b. Sai thông tin:** Tăng bộ đếm sai; đủ ngưỡng → khóa tạm tài khoản trong x phút.
    * **3a. MFA sai/quá hạn:** Yêu cầu nhập lại mã mới.
    * **4a. CSRF token không hợp lệ:** Từ chối yêu cầu, yêu cầu tải lại trang.
* **Audit:** `dang_nhap_thanh_cong`, `dang_nhap_that_bai`, `tai_khoan_bi_khoa`, thông tin IP/UA/thời điểm.
* **Nghiệm thu:** Thử sai 5 lần dẫn đến khóa tạm; đăng nhập hợp lệ P95 ≤ 1.5s; cookie có cờ HttpOnly/SameSite; sau đăng nhập thành công, bộ đếm sai được reset.

#### UC-GEN-02: Đăng Ký Tài Khoản

* **Mục tiêu:** Cho phép người dùng mới tạo tài khoản.
* **Tác nhân:** KhachHang, ChuDuAn.
* **Tiền điều kiện:** Email hoặc số điện thoại chưa được đăng ký trong hệ thống.
* **Ràng buộc:** Mật khẩu phải đạt độ mạnh yêu cầu; người dùng phải đồng ý với điều khoản dịch vụ.
* **Hậu điều kiện (Thành công):** Một người dùng mới được tạo với trạng thái ChờXácMinh. Hệ thống gửi email/SMS chứa mã hoặc đường dẫn xác minh.
* **Luồng chính:**
    1.  Người dùng mở form đăng ký và nhập thông tin (tên, email/SĐT, mật khẩu) và đồng ý với điều khoản.
    2.  Hệ thống thực hiện kiểm tra và xác thực dữ liệu phía server.
    3.  Tạo một bản ghi người dùng mới với trạng thái là ChoXacMinh.
    4.  Gửi mã/đường dẫn xác minh đến email/SĐT của người dùng.
    5.  Hiển thị thông báo hướng dẫn người dùng kiểm tra và xác minh tài khoản.
* **Nhánh/Ngoại lệ:**
    * **2a. Email/SĐT đã tồn tại:** Hiển thị thông báo lỗi.
    * **2b. Mật khẩu yếu:** Gợi ý người dùng tăng cường độ mạnh của mật khẩu.
    * **4a. Gửi mail/SMS lỗi:** Thực hiện retry và hiển thị banner thông báo.
* **Audit:** `nguoi_dung_dang_ky`.
* **Nghiệm thu:** Không thể đăng ký email/SĐT trùng; link xác minh chỉ có hiệu lực một lần hoặc trong một khoảng thời gian nhất định (TTL).

#### UC-GEN-03: Chuyển Đổi Vai Trò

* **Mục tiêu:** Cho phép người dùng có nhiều vai trò chuyển đổi giữa các vai trò đang hoạt động.
* **Tác nhân:** Người dùng có ≥ 2 vai trò.
* **Tiền điều kiện:** Người dùng đã đăng nhập và được gán ít nhất 2 vai trò.
* **Hậu điều kiện:** Quyền truy cập (permission) được cập nhật theo vai trò mới, giao diện người dùng được làm mới.
* **Luồng chính:**
    1.  Người dùng mở menu tài khoản và chọn vai trò mục tiêu.
    2.  Server cập nhật VaiTroHoatDongID trong session/JWT của người dùng.
    3.  Tải lại trang hoặc API guard nạp các quyền mới tương ứng.
* **Ngoại lệ:** Vai trò không khả dụng → báo lỗi và giữ vai trò cũ.
* **Audit:** `chuyen_doi_vai_tro (from → to)`.
* **Nghiệm thu:** API trả về claim quyền mới; các tài nguyên bị chặn trước đó vẫn bị chặn sau khi đổi vai trò nếu vai trò mới không có quyền truy cập.

#### UC-GEN-04: Xem Danh Sách Cuộc Hẹn

* **Mục tiêu:** Hiển thị danh sách các CuộcHẹn phù hợp với vai trò của người dùng.
* **Tác nhân:** KhachHang, NhanVienBanHang, ChuDuAn, NhanVienDieuHanh.
* **Luồng chính:**
    1.  Người dùng truy cập trang quản lý CuộcHẹn.
    2.  Server trả về danh sách CuộcHẹn dựa trên phạm vi vai trò:
        * **KhachHang:** Chỉ thấy các cuộc hẹn do chính họ tạo.
        * **NhanVienBanHang:** Chỉ thấy các cuộc hẹn được giao cho họ.
        * **ChuDuAn:** Thấy các cuộc hẹn liên quan đến TinĐăng/Phòng của họ.
        * **NhanVienDieuHanh:** Thấy tất cả các cuộc hẹn và có bộ lọc nâng cao.
    3.  Người dùng có thể lọc danh sách theo trạng thái, khoảng thời gian, khu vực, v.v.
* **Ngoại lệ:** Không có dữ liệu → hiển thị trạng thái trống.
* **Audit:** `xem_danh_sach_cuoc_hen`.
* **Nghiệm thu:** Phân trang và lọc hoạt động chính xác; người dùng chỉ thấy được dữ liệu trong phạm vi cho phép của mình.

#### UC-GEN-05: Trung Tâm Thông Báo

* **Mục tiêu:** Cho phép người dùng xem, điều hướng và quản lý thông báo. Cho phép QuanTriVien quản lý các mẫu thông báo.
* **Tác nhân:** Tất cả người dùng (xem thông báo), QuanTriVien (quản lý mẫu).
* **Luồng chính (Người dùng):** Xem danh sách thông báo → nhấp vào một mục → được điều hướng đến tài nguyên liên quan → thông báo được đánh dấu là đã đọc.
* **Luồng chính (QuanTriVien):** Mở trang cấu hình → tạo/sửa mẫu thông báo (trigger, biến, kênh gửi...) → lưu lại.
* **Ngoại lệ:** Tài nguyên đích không tồn tại → hiển thị thông báo thân thiện.
* **Audit:** `doc_thong_bao`, `cap_nhat_mau_thong_bao`.
* **Nghiệm thu:** Nhấp vào thông báo dẫn đến đúng đích; template render đúng các biến dữ liệu.

### 5.2 KhachHang (CUST)

#### UC-CUST-01: Tìm Kiếm Phòng Trọ — *không đổi*

* **Mục tiêu:** Tìm TinĐăng phù hợp.
* **Tác nhân:** KhachHang / Public.
* **Luồng chính:** Nhập từ khóa/áp dụng bộ lọc → Tìm kiếm → Xem kết quả → Mở trang chi tiết.
* **Ràng buộc:** P95 ≤ 2s; chống SQLi.
* **Ngoại lệ:** Không có kết quả → Gợi ý nới lỏng điều kiện tìm kiếm.
* **Audit:** `tim_kiem_tin_dang`.
* **Nghiệm thu:** Bộ lọc (khu vực, giá, tiện ích…) hoạt động chính xác; sắp xếp đúng.

#### UC-CUST-02: Quản Lý Yêu Thích — *không đổi*

* **Mục tiêu:** Lưu lại các TinĐăng quan tâm.
* **Tác nhân:** KhachHang.
* **Tiền điều kiện:** Đã đăng nhập.
* **Luồng chính:** Nhấn nút “Yêu thích” trên TinĐăng → tạo liên kết; xem danh sách yêu thích; bỏ yêu thích.
* **Ngoại lệ:** Chưa đăng nhập → hiển thị popup yêu cầu đăng nhập.
* **Audit:** `them_yeu_thich`, `xoa_yeu_thich`.
* **Nghiệm thu:** Không có bản ghi trùng; trạng thái UI cập nhật tức thời.

#### UC-CUST-03: Hẹn Lịch Xem Phòng — *bổ sung nhỏ*

* **Mục tiêu:** Tạo CuộcHẹn hợp lệ, chống trùng slot.
* **Tiền điều kiện:** Phòng ở trạng thái Trống; KhachHang đã KYC tối thiểu; chưa quá giới hạn đổi lịch (SoLanDoiLich < N).
* **Ràng buộc:** Giữ chỗ tạm thời slot ≤ 5 phút; KhóaĐịnhDanh (user, unit, slot) để chống trùng lặp.
* **Hậu điều kiện:** CuộcHẹn được DaXacNhan, NhanVienBanHang được gán; gửi thông báo.
* **Luồng chính:**
    1.  Mở “Hẹn lịch” trên Phòng → tải các slot còn trống.
    2.  Chọn slot → server xác thực (trùng lịch, TTL giữ chỗ).
    3.  Xác nhận → tạo CuộcHẹn với trạng thái DaYeuCau (hoặc ChoXacNhan*) → tự động gán NhanVienBanHang → chuyển trạng thái sang DaXacNhan.
    4.  Gửi thông báo cho KhachHang/NhanVienBanHang/ChuDuAn.
* **Nhánh/Ngoại lệ:**
    * **2a. Overbook:** Hết slot trong lúc chọn → gợi ý slot gần nhất.
    * **3a. Dự án yêu cầu duyệt:** CuộcHẹn ở trạng thái ChoXacNhan cho đến khi ChuDuAn/NhanVienDieuHanh duyệt.
    * **4a. DoiLich:** Giới hạn N lần/tuần, khi đổi lịch giữ nguyên NhanVienBanHang nếu phù hợp.
    * **4b. No-show:** Đánh dấu KhachKhongDen; áp dụng chế tài từ lần thứ 2.
* **Audit:** `tao_cuoc_hen`, `doi_lich`, `huy_lich`, `khach_khong_den`.
* **Nghiệm thu:** Hai người dùng cùng tạo một slot → chỉ một người thành công; chức năng đổi lịch bị giới hạn.
* **Ghi chú:** Cho phép tồn tại CọcGiữChỗ **trước khi** hẹn xem (không bắt buộc hẹn đã DaXacNhan).

#### UC-CUST-04: Thực Hiện Đặt Cọc (tách case)

* **Mục tiêu:** Giữ chỗ Phòng bằng cọc phù hợp ngữ cảnh.
* **Biến thể A — CọcGiữChỗ:**
    * **Tiền điều kiện:** **Không yêu cầu** CuộcHẹn = DaXacNhan; chỉ cần TinĐăng/Phòng còn khả dụng và chính sách cho phép.
    * **Ràng buộc:** TTL cọc; KhóaĐịnhDanh; thanh toán **payment hold qua PG** hoặc ví nội bộ (nếu bật).
    * **Hậu điều kiện:** Phòng → **GiuCho** trong TTL; hết TTL mà không tiến triển → auto release theo chính sách.
* **Biến thể B — CọcAnNinh:**
    * **Tiền điều kiện:** Đã chốt thuê (qua hợp đồng), hoặc theo quy trình yêu cầu.
    * **Ràng buộc:** KhóaĐịnhDanh; số tiền theo chính sách; hạch toán SổCái; **không trừ phí nền tảng từ khoản cọc**.
    * **Hậu điều kiện:** Phòng → GiuCho; chờ **BiênBảnBànGiao** để giải tỏa/đối trừ.

#### UC-CUST-05: Hủy Giao Dịch (Hoàn tiền/Đảo ngược) — *điều chỉnh*

* **Mục tiêu:** Yêu cầu hoàn cọc theo chính sách.
* **Tiền điều kiện:** GiaoDịch ở trạng thái DaGhiNhan/DaThanhToan và trong khung thời gian cho phép hoàn tiền.
* **Hậu điều kiện:** Tạo lệnh hoàn tiền (Refund/Reversal) theo chính sách; có thể giải phóng Phòng về trạng thái Trống.
* **Luồng chính:**
    1.  Vào lịch sử giao dịch → chọn giao dịch → “Hủy/Hoàn tiền”.
    2.  Hiển thị mức hoàn và phí (nếu có) dựa trên **ChinhSachCoc của TinĐăng** → xác nhận.
    3.  Tạo lệnh hoàn tiền → cập nhật trạng thái giao dịch & Phòng.
* **Ngoại lệ:** Quá hạn/không hợp lệ → từ chối kèm lý do.
* **Audit:** `yeu_cau_hoan_tien`, `da_hoan_tien`, `tu_choi`.
* **Nghiệm thu:** Số tiền hoàn chính xác; bút toán đối ứng đảm bảo tổng hệ thống không đổi.

#### UC-CUST-06: Quản Lý Ví Điện Tử — *nhắc lại*

* **Mục tiêu:** Xem số dư, nạp tiền, và lịch sử giao dịch.
* **Tác nhân:** KhachHang.
* **Ghi chú:** Ví là **tùy chọn**; nếu không bật, người dùng vẫn có thể thanh toán qua cổng PG (authorize/capture/void/refund).
* **Luồng chính:** Mở “Ví của tôi” → xem số dư & lịch sử → “Nạp tiền” → cập nhật số dư.
* **Ngoại lệ:** Nạp tiền lỗi → thực hiện retry/backoff.
* **Audit:** `nap_vi_thanh_cong`, `nap_vi_that_bai`.
* **Nghiệm thu:** Lịch sử được sắp xếp theo thời gian; số dư = đầu kỳ + ∑(các dòng hợp lệ).

#### UC-CUST-07: Nhắn Tin — *không đổi*

* **Mục tiêu:** Trao đổi với NhanVienBanHang/ChuDuAn.
* **Luồng chính:** Mở hội thoại → Soạn tin → Gửi → Hiển thị real-time/near-real-time.
* **Ngoại lệ:** Spam/rate limit → chặn tạm thời.
* **Audit:** `gui_tin_nhan`.
* **Nghiệm thu:** Tin nhắn mới hiển thị ở cả hai phía; thông báo đẩy hoạt động.

### 5.3 NhanVienBanHang (SALE)

#### UC-SALE-01: Đăng ký Lịch làm việc

* **Mục tiêu:** Khai báo các khung giờ rảnh để hệ thống có thể tự động gán CuộcHẹn.
* **Tác nhân:** NhanVienBanHang.
* **Tiền điều kiện:** Đã đăng nhập với vai trò NhanVienBanHang.
* **Hậu điều kiện:** Ca làm việc (`lichlamviec`) được lưu vào hệ thống, sẵn sàng cho việc phân công. Hệ thống chống xung đột lịch.
* **Luồng chính:** Mở trang “Lịch làm việc” → chọn ngày/ca làm việc (`BatDau`, `KetThuc`) → Lưu.
* **Ngoại lệ:** Cố gắng xóa một ca làm việc đã có CuộcHẹn DaXacNhan → hệ thống từ chối và thông báo.
* **Audit:** `tao_ca_lam_viec_sales`, `cap_nhat_ca_lam_viec_sales`.
* **Nghiệm thu:** Gỡ bỏ một ca làm việc trống thì thành công; không thể gỡ bỏ ca đã có hẹn.

#### UC-SALE-02: Xem Chi tiết Cuộc hẹn

* **Mục tiêu:** Nắm bắt đầy đủ thông tin về CuộcHẹn để chuẩn bị và thực hiện.
* **Tác nhân:** NhanVienBanHang.
* **Luồng chính:** Chọn một CuộcHẹn từ danh sách → xem thông tin chi tiết (thông tin khách hàng, Phòng, thời gian, địa điểm, ghi chú, trạng thái, lịch sử).
* **Audit:** `xem_chi_tiet_cuoc_hen`.
* **Nghiệm thu:** Dữ liệu hiển thị đầy đủ và chính xác; các thông tin nhạy cảm nằm ngoài quyền hạn sẽ được ẩn đi.

#### UC-SALE-03: Quản lý Cuộc hẹn (Xác nhận/Đổi lịch/Hủy)

* **Tác nhân:** NhanVienBanHang.
* **Tiền điều kiện:** CuộcHẹn đã được phân công cho NhanVienBanHang đó.
* **Luồng chính:**
    * **Xác nhận:** Nhấn nút “Xác nhận” → trạng thái CuộcHẹn được cập nhật → gửi thông báo.
    * **Đổi lịch:** Chọn một slot thời gian mới hợp lệ → Lưu → gửi thông báo cho các bên liên quan.
    * **Hủy:** Nhập lý do hủy → trạng thái CuộcHẹn được cập nhật → gửi thông báo và áp dụng chính sách (nếu hủy sát giờ).
* **Ngoại lệ:** Vượt quá giới hạn số lần đổi lịch cho phép → cần NhanVienDieuHanh duyệt.
* **Audit:** `xac_nhan_cuoc_hen`, `doi_lich_cuoc_hen`, `huy_cuoc_hen (bởi NhanVienBanHang)`.
* **Nghiệm thu:** Hệ thống không cho phép đổi vào slot đã có lịch; thông báo được gửi đến đủ 3 bên (KhachHang, NhanVienBanHang, ChuDuAn).

#### UC-SALE-04: Xác nhận Cọc của Khách hàng

* **Mục tiêu:** Xác nhận giao dịch đặt cọc đã được thực hiện thành công (nếu quy trình yêu cầu).
* **Tác nhân:** NhanVienBanHang.
* **Tiền điều kiện:** GiaoDịch đang ở trạng thái DaUyQuyen hoặc DaGhiNhan; có quyền xem GiaoDịch.
* **Luồng chính:** Truy cập danh sách GiaoDịch → chọn giao dịch cần xác nhận → Nhấn “Xác nhận” → hệ thống cập nhật trạng thái và tính hoa hồng (nếu có).
* **Audit:** `coc_xac_nhan_boi_sales`.
* **Nghiệm thu:** Hoa hồng được tính toán và hiển thị đúng trong báo cáo thu nhập cá nhân.

#### UC-SALE-05: Báo cáo Kết quả Cuộc hẹn

* **Mục tiêu:** Ghi nhận lại kết quả của CuộcHẹn (thành công, thất bại, cần theo dõi thêm).
* **Tác nhân:** NhanVienBanHang.
* **Luồng chính:** Chọn một CuộcHẹn đã diễn ra → nhập kết quả (ví dụ: khách đã cọc, khách từ chối...) và ghi chú → Lưu.
* **Ngoại lệ:** Quá hạn khai báo kết quả → hệ thống cảnh báo hoặc ghi nhận vi phạm SLA.
* **Audit:** `bao_cao_ket_qua_cuoc_hen`.
* **Nghiệm thu:** KPI hiệu suất của NhanVienBanHang được cập nhật; báo cáo SLA phản ánh đúng tình trạng.

#### UC-SALE-06: Xem Báo cáo Thu nhập

* **Mục tiêu:** Theo dõi hoa hồng và thu nhập cá nhân.
* **Tác nhân:** NhanVienBanHang.
* **Luồng chính:** Mở trang “Báo cáo thu nhập” → xem biểu đồ/bảng thống kê, có thể lọc theo kỳ thanh toán hoặc khoảng thời gian.
* **Audit:** `xem_bao_cao_thu_nhap_sales`.
* **Nghiệm thu:** Số liệu trong báo cáo khớp với dữ liệu từ các GiaoDịch và chính sách hoa hồng nguồn.

#### UC-SALE-07: Nhắn tin

* **Mô tả:** Tương tự UC-CUST-07, nhưng ở phía NhanVienBanHang trao đổi với KhachHang. Hệ thống phải tôn trọng phạm vi hội thoại (chỉ NhanVienBanHang được gán cho CuộcHẹn mới có thể nhắn tin).

### 5.4 ChuDuAn (PROJ)

#### UC-PROJ-01: Đăng tin Cho thuê

* **Mục tiêu:** Tạo một TinĐăng mới cho 1 hoặc nhiều Phòng thuộc một Dự án đang `HoatDong` và gửi duyệt.
* **Tác nhân:** ChuDuAn.
* **Tiền điều kiện:** ChuDuAn đã hoàn thành KYC, hoặc hệ thống cho phép tạo TinĐăng trước khi KYC; chỉ `DaDang` sau khi KYC đạt.
* **Ràng buộc:** Bắt buộc có ít nhất 1 ảnh, địa chỉ chuẩn hóa, giá/diện tích hợp lệ. Chỉ Dự án = `HoatDong` được phép chọn.
* **Hậu điều kiện:** Tạo TinĐăng và chuyển sang trạng thái `ChoDuyet` (hoặc `Nhap` nếu lưu nháp). Nếu “Đăng nhiều phòng”, tạo kèm các Phòng gắn TinĐăng.
* **Luồng chính (đăng 1 phòng):**
    1.  **(Mới) Chọn Dự án:** Người dùng chọn Dự án (`HoatDong`) → Hệ thống nạp metadata dự án và tự động điền địa chỉ vào bước Vị trí (cho phép sửa).
    2.  **Thông tin chung:** Tiêu đề, mô tả ngắn, loại phòng/số phòng ngủ, diện tích.
    3.  **Ảnh/Media:** Tải ảnh (kiểm tra định dạng, dung lượng, tỷ lệ), chọn ảnh đại diện.
    4.  **Giá & Chi phí:** Giá thuê, cọc/điện/nước/phí dịch vụ.
    5.  **Vị trí:** Địa chỉ (auto-fill từ Dự án), toạ độ (geocode).
    6.  **Tiện ích & Quy định:** Nội thất, pets, giờ giấc, chính sách.
    7.  **Xem trước & Gửi duyệt:**
        * Hệ thống validate toàn bộ.
        * Lưu TinĐăng = `ChoDuyet`, liên kết Dự án.
        * Ghi audit và thông báo “Gửi duyệt thành công”.
* **Luồng phụ A — (Mới) Đăng nhiều phòng bằng bảng:**
    * Tại bước Thông tin chung, chọn “Đăng nhiều phòng” → mở bảng nhập nhanh:
        * Cột tối thiểu: STT | Tên phòng | Giá | Diện tích | Ghi chú (tùy chọn).
        * Hành động: Thêm/Xóa hàng, cho phép dán nhiều dòng từ Excel/CSV.
    * Hệ thống validate theo hàng (giá & diện tích > 0; tên phòng không rỗng).
    * Khi Gửi duyệt:
        * Tạo TinĐăng (`ChoDuyet`) và n bản ghi Phòng gắn TinĐăng.
        * Ảnh/tiện ích dùng chung có thể áp cho tất cả phòng (chỉnh sửa chi tiết sau).
* **Luồng phụ B — (Mới) Lưu nháp:**
    * Ở bất kỳ bước nào trước “Gửi duyệt”, chọn “Lưu nháp”.
    * Hệ thống lưu TinĐăng = `Nhap` (Nháp), giữ lại toàn bộ dữ liệu đã nhập.
    * Giữ người dùng ở trang chỉnh sửa (không điều hướng ra ngoài).
    * Có mục Quản lý nháp để tiếp tục chỉnh sửa/gửi duyệt.
* **Nhánh/Ngoại lệ (theo bước):**
    * **3a. Media không hợp lệ (định dạng/dung lượng/quá giới hạn):** báo lỗi tại tệp.
    * **4a. Giá/Diện tích không hợp lệ:** highlight trường sai (với bảng nhiều phòng: highlight theo hàng).
    * **5a. Địa chỉ không geocode được:** yêu cầu xác nhận thủ công hoặc kiểm tra lại.
    * **7a. Thiếu trường bắt buộc:** báo lỗi tổng hợp + nhảy tới trường tương ứng.
    * **7b. Nghi ngờ gian lận (spam, nội dung cấm):** từ chối lưu/đưa vào hàng chờ kiểm duyệt thủ công.
* **Ràng buộc bổ sung:**
    * Không cho `DaDang` nếu KYC ≠ `DaXacMinh` (vẫn cho `Nhap`/`ChoDuyet`/`DaDuyet`).
    * Idempotency Key cho thao tác “Gửi duyệt” (chống submit lặp).
    * Rate limit nhẹ cho upload media và gửi duyệt.
* **Audit:** `gui_tin_dang`, kèm userId/projectId/tinDangId, số phòng tạo, thời gian, IP/UA, danh sách trường lỗi (nếu có).
* **Nghiệm thu:**
    * Tạo 1 phòng P95 ≤ 2.0s (không tính upload).
    * Tạo 50 phòng qua bảng P95 ≤ 5.0s (không tính upload).
    * “Lưu nháp” → vẫn ở trang chỉnh sửa, dữ liệu không mất.
    * Địa chỉ auto-fill từ Dự án nhưng cho phép sửa tay.
    * Sau “Gửi duyệt” → trạng thái `ChoDuyet`, hiển thị thông báo & audit đầy đủ.

#### UC-PROJ-02: Xác nhận Cuộc hẹn (nếu yêu cầu)

* **Mục tiêu:** Cho phép ChuDuAn phê duyệt các yêu cầu hẹn xem phòng đối với các dự án có chính sách đặc biệt.
* **Tác nhân:** ChuDuAn.
* **Luồng chính:** Nhận thông báo về yêu cầu hẹn mới → mở yêu cầu → chọn “Phê duyệt” hoặc “Từ chối” → hệ thống cập nhật trạng thái CuộcHẹn và thông báo cho các bên.
* **Audit:** `chu_du_an_duyet_cuoc_hen`, `chu_du_an_tu_choi_cuoc_hen`.
* **Nghiệm thu:** Quy trình này chỉ được kích hoạt đối với các TinĐăng đã được cấu hình chính sách yêu cầu duyệt.

#### UC-PROJ-03: Xem Báo cáo Kinh doanh

* **Mục tiêu:** Theo dõi hiệu suất của các TinĐăng.
* **Tác nhân:** ChuDuAn.
* **Luồng chính:** Mở trang “Báo cáo” → xem các chỉ số hiệu suất (số lượt xem, lượt yêu thích, số CuộcHẹn, tỉ lệ lấp đầy).
* **Audit:** `chu_du_an_xem_bao_cao`.
* **Nghiệm thu:** Số liệu trong báo cáo khớp với dữ liệu sự kiện và cơ sở dữ liệu nguồn.

#### UC-PROJ-04: Báo cáo Hợp đồng Cho thuê

* **Mục tiêu:** Báo cáo việc đã ký hợp đồng với khách thuê để chốt trạng thái và giải tỏa TiềnTạmGiữ.
* **Tác nhân:** ChuDuAn.
* **Tiền điều kiện:** Phòng đang ở trạng thái GiuCho; có một giao dịch đặt cọc hợp lệ tồn tại.
* **Luồng chính:** Chọn Phòng đã được đặt cọc → chọn chức năng “Báo cáo hợp đồng” → nhập các thông tin cần thiết → hệ thống chuyển trạng thái Phòng sang DaThue và chuẩn bị giải tỏa TiềnTạmGiữ theo chính sách.
* **Ngoại lệ:** Không có giao dịch cọc hoặc thông tin không khớp → hệ thống từ chối.
* **Audit:** `bao_cao_hop_dong_thue`.
* **Nghiệm thu:** TiềnTạmGiữ sẵn sàng được giải tỏa; trạng thái Phòng được đồng bộ trên toàn hệ thống.

#### UC-PROJ-05: Nhắn tin

* **Mô tả:** Tương tự UC-CUST-07, nhưng ở vai trò ChuDuAn (nếu được hệ thống cho phép).

### 5.5 NhanVienDieuHanh (OPER)

#### UC-OPER-01: Duyệt Tin đăng

* **Mục tiêu:** Đảm bảo TinĐăng đạt tiêu chuẩn chất lượng và pháp lý trước khi được hiển thị công khai.
* **Tác nhân:** NhanVienDieuHanh.
* **Tiền điều kiện:** TinĐăng ở trạng thái ChoDuyet.
* **Ràng buộc:** Phải kiểm tra theo checklist: KYC của ChuDuAn (TrangThaiXacMinh = DaXacMinh), đủ ảnh, dữ liệu an toàn, giá hợp lệ.
* **Hậu điều kiện:** TinĐăng chuyển sang DaDang (nếu duyệt) hoặc TuChoi (nếu không đạt).
* **Luồng chính:** Mở danh sách TinĐăng chờ duyệt → vào chi tiết → kiểm tra theo checklist → chọn “Duyệt” (hoặc “Từ chối” kèm lý do).
* **Ngoại lệ:** Thiếu thông tin KYC → yêu cầu ChuDuAn bổ sung.
* **Audit:** `duyet_tin_dang`, `tu_choi_tin_dang`.
* **Nghiệm thu:** TinĐăng chỉ được DaDang khi tất cả điều kiện trong checklist được thỏa mãn.

#### UC-OPER-02: Quản lý Danh sách Dự án

* **Mục tiêu:** Quản lý vận hành các dự án (ví dụ: tạm ngưng, kích hoạt lại).
* **Luồng chính:** Mở danh sách dự án → lọc/tìm kiếm → chọn dự án → thực hiện hành động (tạm ngưng, kích hoạt...).
* **Audit:** `thay_doi_trang_thai_du_an`.
* **Nghiệm thu:** Khi một dự án bị tạm ngưng, tất cả TinĐăng thuộc dự án đó sẽ không xuất hiện trên trang tìm kiếm của khách hàng.

#### UC-OPER-03: Quản lý Lịch làm việc NVBH (tổng thể)

* **Mục tiêu:** Điều phối nhân sự và ca trực để đảm bảo độ phủ.
* **Luồng chính:** Mở lịch làm việc tổng hợp của tất cả NhanVienBanHang → xem heatmap/phân tích các khu vực thiếu nhân sự → gán lại CuộcHẹn nếu cần thiết.
* **Ngoại lệ:** Gán CuộcHẹn vào ca đã kín hoặc trùng lịch → hệ thống cảnh báo.
* **Audit:** `dieu_hanh_gan_lai_cuoc_hen`.
* **Nghiệm thu:** Việc gán lại CuộcHẹn phải được cập nhật ngay lập tức cho các NhanVienBanHang liên quan.

#### UC-OPER-04: Quản lý Hồ sơ Nhân viên

* **Mục tiêu:** Thêm, sửa, xóa hồ sơ nhân sự nội bộ (không phải quản lý quyền).
* **Luồng chính:** Mở danh sách nhân viên → xem/chỉnh sửa thông tin cơ bản, trạng thái hoạt động (active/inactive).
* **Audit:** `cap_nhat_ho_so_nhan_vien`.
* **Nghiệm thu:** Không thể sửa các trường chỉ đọc (ví dụ: email công ty nếu chính sách cấm).

#### UC-OPER-05: Tạo Tài khoản Nhân viên

* **Mục tiêu:** Tạo tài khoản mới cho NhanVienBanHang.
* **Luồng chính:** Chọn “Tạo tài khoản mới” → nhập thông tin nhân viên → hệ thống tạo người dùng và gửi email mời thiết lập mật khẩu.
* **Ngoại lệ:** Email đã tồn tại → báo lỗi.
* **Audit:** `tao_tai_khoan_nhan_vien`.
* **Nghiệm thu:** Người dùng mới có thể đăng nhập thành công bằng đường link thiết lập mật khẩu một lần.

#### UC-OPER-06: Lập Biên bản Bàn giao *(mới)*

* **Mục tiêu:** Ghi nhận bàn giao để chốt điều kiện giải tỏa CọcAnNinh.
* **Tác nhân:** NhanVienDieuHanh (hoặc ChuDuAn nếu được phân quyền).
* **Tiền điều kiện:** Phòng = GiuCho; có hợp đồng đã sinh từ MẫuHợpĐồng.
* **Luồng chính:** Tạo **BiênBảnBànGiao** → nhập chỉ số, hiện trạng tài sản, checklist → ký số các bên → trạng thái BànGiao = **DaBanGiao** → kích hoạt luồng giải tỏa/đối trừ cọc theo chính sách.
* **Audit:** `lap_bien_ban_ban_giao`.
* **Nghiệm thu:** Không thể giải tỏa CọcAnNinh nếu thiếu BiênBản hoặc chữ ký số.

### 5.6 QuanTriVien Hệ thống (ADMIN)

#### UC-ADMIN-01: Quản lý Tài khoản Người dùng

* **Mục tiêu:** Quản trị viên quản lý vòng đời tài khoản: tạo/sửa/khóa/mở khóa/đặt lại mật khẩu/đặt vai trò.
* **Tác nhân:** QuanTriVien.
* **Tiền điều kiện:** `QuanTriVien` đã đăng nhập và có quyền quản trị.
* **Luồng chính:**
    1.  `QuanTriVien` mở trang quản lý Tài khoản.
    2.  Tìm kiếm hoặc lọc danh sách người dùng theo email, vai trò, hoặc trạng thái.
    3.  Thực hiện tạo mới hoặc mở chi tiết một tài khoản đã có.
    4.  Thiết lập vai trò cho tài khoản (KhachHang, ChuDuAn, NhanVienBanHang, NhanVienDieuHanh, QuanTriVien). Hệ thống hỗ trợ đa vai trò.
    5.  Lưu các thay đổi. Hệ thống ghi nhận vào `NhậtKýHệThống`.
* **Nhánh/Ngoại lệ:**
    * **3a. Email đã tồn tại:** Khi tạo mới, hệ thống báo lỗi và không cho phép tạo.
    * **4a. Gán quyền xung đột:** Nếu việc gán vai trò vi phạm chính sách nội bộ, hệ thống từ chối và gợi ý cấu hình đúng.
* **Ràng buộc:**
    * Mọi thay đổi về quyền hoặc trạng thái tài khoản đều yêu cầu ghi `NhậtKýHệThống`, bao gồm lý do (nếu có).
    * Quy trình đặt lại mật khẩu phải được thực hiện qua một kênh đã xác minh (email/OTP).
* **Audit:** `thay_doi_vai_tro_nguoi_dung`, `khoa_mo_khoa_nguoi_dung`, `khoi_tao_dat_lai_mat_khau` phải ghi lại đủ thông tin người thực hiện, đối tượng, thời gian, và giá trị thay đổi.
* **Nghiệm thu:** Chức năng lọc và tìm kiếm người dùng hoạt động với P95 ≤ 1.5s.

#### UC-ADMIN-02: Quản lý Danh sách Dự án

* **Mục tiêu:** Tạo, xóa, và cấu hình các Dự án (bao gồm siêu dữ liệu, địa chỉ, trạng thái `HoatDong`/`TamNgung`) để làm nguồn dữ liệu cho `TinĐăng`.
* **Tác nhân:** QuanTriVien.
* **Tiền điều kiện:** `QuanTriVien` đã đăng nhập và có quyền quản trị.
* **Luồng chính:**
    1.  `QuanTriVien` truy cập trang quản lý Dự án.
    2.  Tạo một dự án mới bằng cách nhập tên, mô tả, địa chỉ (được geocode), và các thuộc tính mặc định như tiện ích hoặc ảnh bìa.
    3.  Đặt trạng thái cho dự án:
        * `HoatDong`: Cho phép `ChuDuAn` tạo `TinĐăng` mới liên kết với dự án này.
        * `TamNgung`: Không cho phép tạo `TinĐăng` mới.
    4.  Lưu các thay đổi. Hệ thống ghi nhận vào `NhậtKýHệThống`.
* **Nhánh/Ngoại lệ:**
    * **2a. Thiếu địa chỉ hợp lệ:** Hệ thống không cho phép lưu nếu địa chỉ không thể được chuẩn hóa hoặc geocode.
    * **3a. Chuyển sang `TamNgung` khi đang có `TinĐăng` `DaDang`:** Hệ thống hiển thị cảnh báo về tác động và yêu cầu xác nhận trước khi thực hiện.
* **Ràng buộc:**
    * Tên dự án phải là duy nhất trong phạm vi của một chủ sở hữu.
    * Chỉ các dự án có trạng thái `HoatDong` mới được hiển thị trong danh sách chọn ở use case `UC-PROJ-01`.
    * Việc xóa một dự án chỉ được phép khi không còn `TinĐăng` hoặc `Phòng` nào đang liên kết (hoặc các thực thể con đã được chuyển sang trạng thái lưu trữ).
* **Audit:** `tao_du_an`, `xoa_du_an`, `cap_nhat_du_an` (bao gồm cả thay đổi trạng thái).
* **Nghiệm thu:** Trong luồng `UC-PROJ-01`, form đăng tin chỉ hiển thị các Dự án có trạng thái `HoatDong` trong danh sách lựa chọn.

#### UC-ADMIN-03: Quản lý Danh sách Khu vực

* **Mục tiêu:** Quản lý cấu trúc cây khu vực (taxonomy) cho bộ lọc tìm kiếm.
* **Luồng chính:** Truy cập cây khu vực → thêm/sửa/xóa một node (quận, phường...) → Lưu.
* **Ngoại lệ:** Xóa một node đang được sử dụng → yêu cầu chuyển các TinĐăng liên quan sang node khác trước.
* **Audit:** `cap_nhat_danh_muc_khu_vuc`.
* **Nghiệm thu:** Chức năng tìm kiếm theo khu vực phải phản ánh các cập nhật ngay lập tức (sau khi re-index nếu cần).

#### UC-ADMIN-04: Xem Báo cáo Thu nhập Toàn hệ thống

* **Mục tiêu:** Cung cấp cái nhìn tổng quan về tình hình tài chính của nền tảng.
* **Luồng chính:** Mở dashboard tài chính → sử dụng bộ lọc thời gian/nguồn doanh thu → xem biểu đồ và bảng dữ liệu.
* **Dữ liệu:** Doanh thu, nguồn thu, chi phí, lợi nhuận (tách riêng phí nền tảng).
* **Audit:** `xem_bao_cao_tai_chinh_nen_tang`.
* **Nghiệm thu:** Số liệu phải đối soát được với SổCái tổng của hệ thống.

#### UC-ADMIN-05: Quản lý Chính sách

* **Mục tiêu:** Cập nhật các văn bản pháp lý (Điều khoản dịch vụ, Chính sách bảo mật) và biểu phí.
* **Luồng chính:** Chọn chính sách cần cập nhật → chỉnh sửa nội dung → quản lý phiên bản (versioning) → xuất bản.
* **Ngoại lệ:** Thay đổi lớn về phí yêu cầu phải có ngày hiệu lực trong tương lai.
* **Audit:** `xuat_ban_phien_ban_chinh_sach`.
* **Nghiệm thu:** Người dùng mới đăng ký phải chấp nhận phiên bản chính sách mới nhất.

#### UC-ADMIN-06: Quản lý Mẫu Hợp đồng

* **Mục tiêu:** Quản lý các MẫuHợpĐồng và sinh hợp đồng điện tử.
* **Ràng buộc:** Không xóa vật lý các mẫu đã dùng; mỗi loại mẫu chỉ có một phiên bản Active tại một thời điểm; thay đổi lớn phải tăng phiên bản.
* **Luồng chính:**
    1.  Tải lên hoặc soạn thảo mẫu mới → Lưu phiên bản.
    2.  Đặt một phiên bản làm Active (hành động này sẽ vô hiệu hóa phiên bản cũ).
    3.  Sinh hợp đồng: Chọn mẫu Active → điền các biến (thông tin KhachHang, ChuDuAn, Phòng, giá, kỳ hạn, phí...) → sinh ra file PDF là một bản sao (snapshot) nội dung bất biến.
* **Ngoại lệ:** Thiếu các biến bắt buộc → không cho phép sinh hợp đồng.
* **Audit:** `mau_hop_dong_tao_phien_ban_kich_hoat`, `tao_hop_dong`.
* **Nghiệm thu:** File PDF được sinh ra chứa đúng snapshot nội dung; file được lưu kèm checksum để đảm bảo toàn vẹn.

#### UC-ADMIN-07: Quản lý Quyền & Phân quyền (RBAC)

* **Mục tiêu:** Quản lý các VaiTro, Quyen và ánh xạ giữa chúng.
* **Luồng chính:** Tạo/sửa/xóa VaiTro; tạo/sửa/xóa Quyen; gán Quyen vào VaiTro; gán VaiTro cho người dùng.
* **Ngoại lệ:** Không cho phép xóa VaiTro đang được sử dụng (phải di trú người dùng sang vai trò khác trước).
* **Audit:** `vai_tro_tao_cap_nhat_xoa`, `quyen_da_cap_da_thu_hoi`.
* **Nghiệm thu:** Quyền mới phải có hiệu lực ngay trong các lớp guard của hệ thống; các API bị chặn khi người dùng thiếu quyền.

#### UC-ADMIN-08: Xem NhậtKýHệThống

* **Mục tiêu:** Tra cứu các hành động quan trọng để phục vụ kiểm toán và điều tra sự cố.
* **Luồng chính:** Sử dụng bộ lọc (người thực hiện, hành động, đối tượng, khoảng thời gian) → xem chi tiết (dữ liệu trước/sau, metadata, IP, User Agent) → xuất báo cáo.
* **Ràng buộc:** Log phải là append-only, có thể dùng hash chain để đảm bảo toàn vẹn; lưu trữ tối thiểu 365 ngày.
* **Audit:** `xem_nhat_ky_he_thong`, `xuat_nhat_ky_he_thong`.
* **Nghiệm thu:** Việc sửa đổi log bằng tay bị phát hiện (đứt chuỗi hash); truy vấn theo các tiêu chí trả về đúng kết quả.

#### UC-ADMIN-09: Quản lý Chính sách Cọc theo TinĐăng *(mới)*

* **Mục tiêu:** Tạo và gán **ChinhSachCoc** ở cấp hệ thống hoặc ghi đè theo TinĐăng.
* **Nội dung:** các tham số TTL, mức hoàn/phạt theo mốc thời gian, điều kiện chuyển đổi từ CọcGiữChỗ → CọcAnNinh, quy tắc giải tỏa khi DaBanGiao.
* **Audit:** `cap_nhat_chinh_sach_coc`, `gan_chinh_sach_coc_cho_tin_dang`.

---

## 6) RBAC (Quyền–Vai trò)

| Quyền | KhachHang | NhanVienBanHang | ChuDuAn | NhanVienDieuHanh | QuanTriVien |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Tìm kiếm/Xem tin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tạo lịch xem | ✓ | – | – | ✓ (đại diện) | ✓ |
| Nhắn tin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Đăng tin | – | – | ✓ | ✓ (thay mặt) | ✓ |
| Duyệt tin | – | – | – | ✓ | ✓ |
| Quản lý lịch NVBH | – | (chỉ mình) | – | ✓ | ✓ |
| Ví (nạp/cọc/hủy) | ✓ | – | – | – | ✓ (xem) |
| Xem báo cáo hệ thống | – | – | – | – | ✓ |
| RBAC/Policy | – | – | – | – | ✓ |
| NhậtKýHệThống | – | – | – | Read | ✓ |
| **lap_bien_ban_ban_giao** | - | - | (tùy chọn) | **✓** | **✓** |
| **quan_ly_chinh_sach_coc** | - | - | - | - | **✓** |

**Act-as:** Khi NhanVienDieuHanh thao tác thay mặt người dùng khác, giao diện phải hiển thị rõ "acting as..." và NhậtKýHệThống phải ghi lại đầy đủ thông tin.

---

## 7) Yêu cầu phi chức năng (NFR) & nghiệm thu

### Hiệu năng:

* Tìm kiếm TinĐăng: P95 ≤ 2.0s.
* Đặt cọc end-to-end: ≤ 4s (với gateway sandbox).

### Bảo mật:

* Mật khẩu phải được hash an toàn (Argon2id/Bcrypt).
* Sử dụng KhóaĐịnhDanh cho các GiaoDịch.
* Bảo vệ chống CSRF cho các form thay đổi trạng thái.

### Sẵn sàng:

* Uptime ≥ 99.5%/tháng.

### Nghiệm thu chung:

* **Idempotency:** Gửi lại một request trong thời gian hiệu lực (TTL) sẽ không tạo ra bản ghi trùng lặp.
* **Race condition:** Việc tạo hẹn hoặc đặt cọc đồng thời sẽ không gây ra tình trạng trùng slot hoặc nhân đôi giao dịch.
* **SổCái:** Mọi BútToánĐảoNgược phải giữ nguyên tổng số dư của hệ thống; phí dịch vụ phải được tách dòng riêng.
* **Idempotency** áp dụng cho cả BiênBảnBànGiao (khóa theo `PhongID + HopDongID + thoi_diem`).
* **SổCái**: Phí nền tảng **hạch toán tách giao dịch**; bút toán đối ứng phải bảo toàn tổng hệ thống.

---

## 8) Mô hình dữ liệu tham chiếu (Cập nhật chi tiết theo Schema v10.4.32)

> **Ghi chú:** Mục này được cập nhật để phản ánh chính xác 100% cấu trúc trong file `thue_tro.sql` nhằm đảm bảo tính nhất quán khi triển khai.

* `NguoiDung`: (`NguoiDungID`, `TenDayDu`, `Email`, `VaiTroHoatDongID`, `SoDienThoai`, `MatKhauHash`, `TrangThai`, `TrangThaiXacMinh`, `NgaySinh`, `DiaChi`, `SoCCCD`, `NgayCapCCCD`, `NoiCapCCCD`, `TaoLuc`, `CapNhatLuc`)
* `VaiTro`: (`VaiTroID`, `TenVaiTro`, `MoTa`)
* `Quyen`: (`QuyenID`, `MaQuyen`, `MoTa`)
* `NguoiDung_VaiTro`: (Bảng trung gian: `NguoiDungID`, `VaiTroID`)
* `VaiTro_Quyen`: (Bảng trung gian: `VaiTroID`, `QuyenID`)
* `HoSoNhanVien`: (`HoSoID`, `NguoiDungID`, `MaNhanVien`, `KhuVucChinhID`, `KhuVucPhuTrach` (JSON), `TyLeHoaHong`, `TrangThaiLamViec`, `NgayBatDau`, `NgayKetThuc`, `GhiChu`)
* `KhuVuc`: (`KhuVucID`, `TenKhuVuc`, `ParentKhuVucID`, `ViDo`, `KinhDo`)

* `DuAn`: (`DuAnID`, `TenDuAn`, `DiaChi`, `ChuDuAnID`, `YeuCauPheDuyetChu`, `TrangThai`, `TaoLuc`, `CapNhatLuc`)
* `TinDang`: (`TinDangID`, `DuAnID`, `KhuVucID`, `ChinhSachCocID`, `TieuDe`, `URL`, `MoTa`, `Gia`, `DienTich`, `TrangThai`, `LyDoTuChoi`, `DuyetBoiNhanVienID`, `TaoLuc`, `CapNhatLuc`, `DuyetLuc`)
* `Phong`: (`PhongID`, `TinDangID`, `TenPhong`, `TrangThai`, `Gia`, `DienTich`, `TaoLuc`, `CapNhatLuc`)
* `YeuThich`: (Bảng trung gian: `NguoiDungID`, `TinDangID`)
* `ThongKeTinDang`: (`ThongKeID`, `TinDangID`, `Ky`, `SoLuotXem`, `SoYeuThich`, `SoCuocHen`, `SoHopDong`, `CapNhatLuc`)

* `CuocHen`: (`CuocHenID`, `KhachHangID`, `NhanVienBanHangID`, `PhongID`, `ThoiGianHen`, `TrangThai`, `SoLanDoiLich`, `GhiChuKetQua`, `TaoLuc`, `CapNhatLuc`)
* `LichLamViec`: (`LichID`, `NhanVienBanHangID`, `BatDau`, `KetThuc`)
* `MauHopDong`: (`MauHopDongID`, `TieuDe`, `NoiDungMau`, `FileURL`, `PhienBan`, `TrangThai`, `TaoBoiAdminID`, `TaoLuc`, `CapNhatLuc`)
* `HopDong`: (`HopDongID`, `TinDangID`, `KhachHangID`, `NgayBatDau`, `NgayKetThuc`, `GiaThueCuoiCung`, `BaoCaoLuc`, `MauHopDongID`, `NoiDungSnapshot`)
* `BienBanBanGiao`: (`BienBanBanGiaoID`, `HopDongID`, `TinDangID`, `PhongID`, `TrangThai`, `ChiSoDien`, `ChiSoNuoc`, `HienTrangJSON`, `ChuKySo`, `TaoLuc`, `CapNhatLuc`)
* `ChinhSachCoc`: (`ChinhSachCocID`, `TenChinhSach`, `MoTa`, `ChoPhepCocGiuCho`, `TTL_CocGiuCho_Gio`, `TyLePhat_CocGiuCho`, `ChoPhepCocAnNinh`, `QuyTacGiaiToa`, `HieuLuc`, `TaoLuc`, `CapNhatLuc`)

* `Vi`: (`ViID`, `NguoiDungID`, `SoDu`)
* `GiaoDich`: (`GiaoDichID`, `ViID`, `SoTien`, `Loai`, `TrangThai`, `KhoaDinhDanh`, `TinDangLienQuanID`, `GiaoDichThamChieuID`, `ThoiGian`)
* `ButToanSoCai`: (`ButToanID`, `GiaoDichID`, `ViID`, `SoTien`, `LoaiButToan`, `ThoiGian`)
* `Coc`: (`CocID`, `GiaoDichID`, `TinDangID`, `PhongID`, `Loai`, `SoTien`, `TTL_Gio`, `HetHanLuc`, `TrangThai`, `BienBanBanGiaoID`, `GhiChu`, `TaoLuc`, `CapNhatLuc`)

* `CuocHoiThoai`: (`CuocHoiThoaiID`, `NguCanhID`, `NguCanhLoai`, `TieuDe`, `ThoiDiemTinNhanCuoi`, `DangHoatDong`, `TaoLuc`, `CapNhatLuc`)
* `ThanhVienCuocHoiThoai`: (Bảng trung gian: `CuocHoiThoaiID`, `NguoiDungID`, `ThamGiaLuc`)
* `TinNhan`: (`TinNhanID`, `CuocHoiThoaiID`, `NguoiGuiID`, `NoiDung`, `ThoiGian`, `DaXoa`)

* `ThongBao`: (`ThongBaoID`, `NguoiNhanID`, `Kenh`, `TieuDe`, `NoiDung`, `Payload` (JSON), `TrangThai`, `SoLanThu`, `TaoLuc`, `GuiLuc`)
* `NoiDungHeThong`: (`NoiDungID`, `LoaiNoiDung`, `TieuDe`, `NoiDung`, `PhienBan`, `CapNhatBoiID`, `CapNhatLuc`)
* `NhatKyHeThong`: (`NhatKyID`, `NguoiDungID`, `HanhDong`, `DoiTuong`, `DoiTuongID`, `GiaTriTruoc`, `GiaTriSau`, `DiaChiIP`, `TrinhDuyet`, `ThoiGian`, `ChuKy`)

---

## 9) Checklist kiểm thử (cập nhật)

* **Unit test:**
    * Tính TTL & auto release của **CọcGiữChỗ**.
    * Điều kiện giải tỏa **CọcAnNinh** khi **DaBanGiao**.
    * Bút toán SổCái tách phí nền tảng.
    * Idempotency cho đặt cọc/hoàn cọc/biên bản bàn giao.
* **Integration:** Gateway thanh toán theo flow Authorize/Capture/Void/Refund; ký số BiênBảnBànGiao; email/push.
* **E2E:** Tìm → hẹn (tùy chọn) → **CọcGiữChỗ** → ký hợp đồng → **CọcAnNinh** → **Bàn giao** → giải tỏa/đối trừ.

---

## 10) Khác biệt so với bản 1.1 (tóm tắt thay đổi)

* **Tách cọc:** `CọcGiữChỗ` (trước khi đi xem, TTL) ↔ `CọcAnNinh` (chốt thuê, giải tỏa sau **BiênBảnBànGiao**).
* **Không bắt buộc ví nội bộ**; hỗ trợ payment hold qua PG.
* **Phí nền tảng không trừ trực tiếp từ cọc**; hạch toán tách giao dịch.
* **Chính sách cọc theo TinĐăng** (policy-based), thay vì áp mặc định toàn sàn.
* **Cho phép tạo TinĐăng trước KYC**; chỉ public sau khi KYC đạt.
* **Thêm UC-OPER-06 Biên bản Bàn giao**; thêm **UC-ADMIN-09 Chính sách Cọc**.
