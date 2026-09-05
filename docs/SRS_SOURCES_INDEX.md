# Phụ lục Nguồn cho SRS (Sources Index)

**Phiên bản:** 2.0 (Mở rộng toàn hệ thống)  
**Ngày cập nhật:** 2025-11-06

---

## Mục đích

Tài liệu này cung cấp khả năng **truy vết đầy đủ** từng mục trong SRS (`docs/SRS_v1.0.md`) đến tài liệu nguồn gốc. Mỗi yêu cầu, chức năng, hoặc ràng buộc đều được ánh xạ chính xác đến:
- Tài liệu đặc tả use case
- Tài liệu triển khai (implementation docs)
- Tài liệu kiến trúc & kỹ thuật
- File mã nguồn liên quan

---

## Cấu trúc

Bảng ánh xạ được tổ chức theo cấu trúc của SRS:
1. Giới thiệu & Mô tả tổng quan
2. Giao diện bên ngoài
3. Yêu cầu chức năng (theo Actor)
4. Yêu cầu phi chức năng
5. Thuộc tính hệ thống khác

---

## 1. Giới thiệu & Mô tả tổng quan

| Mục SRS | Tên Section | Tài liệu Nguồn Chính | Section/Lines | Ghi chú |
|---|---|---|---|---|
| **1.1** | Mục đích | `use-cases-v1.2.md` | Section 0: Mục tiêu & Phạm vi | Định nghĩa tổng quan |
| **1.2** | Phạm vi | `use-cases-v1.2.md` | Section 0: Phạm vi | Bao quát toàn bộ quy trình cho thuê |
| **1.3** | Thuật ngữ & Từ viết tắt | `use-cases-v1.2.md` | Section 2: Từ điển khái niệm | 40+ thuật ngữ chuyên ngành |
| **2.1** | Bối cảnh sản phẩm | `use-cases-v1.2.md` | Section 0 | Managed marketplace model |
| **2.2** | Tác nhân & Người dùng | `use-cases-v1.2.md` | Section 1: Tác nhân (Actors) | 5 actors chính |
| **2.3** | Ràng buộc chung | `use-cases-v1.2.md` | Section 4: Quy tắc nghiệp vụ toàn cục | KYC, policy, rate limiting, audit |

---

## 2. Giao diện bên ngoài

| Mục SRS | Chủ đề | Tài liệu Nguồn Chính | Ghi chú |
|---|---|---|---|
| **3.1** | Quy ước CSS (BEM) | `BEM_MIGRATION_GUIDE.md` | Block__Element--Modifier standard |
| **3.1** | Hệ thống Màu sắc | `DESIGN_SYSTEM_COLOR_PALETTES.md` | 5 palettes cho 5 actors |
| **3.1** | Emerald Noir Theme | `EMERALD_NOIR_MIGRATION_COMPLETE.md` | Theme cho Chủ Dự Án |
| **3.1** | Color Updates Summary | `COLOR_PALETTE_UPDATE_SUMMARY.md` | Changelog cho color system |
| **3.1** | UX Analysis (QuanLyDuAn) | `QUANLYDUAN_UX_ANALYSIS_AND_REDESIGN.md` | UX improvements cho CDA |
| **3.1** | Todos Component Updates | `EMERALD_NOIR_TODO_COMPONENT_UPDATES.md` | Component-level color updates |
| **3.3** | Geocoding Architecture | `GEOCODING_ARCHITECTURE_FINAL.md` | Hybrid Google/Nominatim |
| **3.3** | Modal Geocoding | `MODAL_GEOCODING_IMPLEMENTATION.md` | UI component cho address input |
| **3.3** | Smart Address & Marker | `SMART_ADDRESS_DRAGGABLE_MARKER.md` | Draggable map marker |
| **3.3** | Phòng Sync Architecture | `PHONG_SYNC_ARCHITECTURE.md` | DB trigger cho trạng thái sync |
| **3.3** | Phòng Sync Solution | `PHONG_SYNCHRONIZATION_SOLUTION.md` | Giải pháp chi tiết |
| **3.3** | Phòng Sync Index | `INDEX_PHONG_SYNC.md` | Tổng hợp tài liệu Phòng Sync |
| **3.3** | Deployment Guide Phòng Sync | `DEPLOYMENT_GUIDE_PHONG_SYNC.md` | Hướng dẫn triển khai |
| **3.3** | Quick Start Phòng Sync | `QUICK_START_PHONG_SYNC.md` | Hướng dẫn nhanh |
| **3.4** | JWT Authentication | `JWT_AUTH_MIGRATION.md` | Migration từ session sang JWT |
| **3.4** | Auth Middleware | `AUTH_MIDDLEWARE_CLARIFICATION.md` | Middleware implementation |
| **3.4** | Auth Migration Standard | `server/docs/AUTH_MIGRATION_STANDARD.md` | Chuẩn hóa auth trong project |
| **3.4** | Auth Modes README | `server/routes/README_AUTH_MODES.md` | Các chế độ auth khác nhau |

---

## 3. Yêu cầu chức năng - Use Cases

### 3.1. Chức năng Chung (UC-GEN)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-GEN-01** | Đăng Nhập | `use-cases-v1.2.md` | 5.1 - UC-GEN-01 (lines 107-128) | `JWT_AUTH_MIGRATION.md` |
| **UC-GEN-02** | Đăng Ký Tài Khoản | `use-cases-v1.2.md` | 5.1 - UC-GEN-02 (lines 130-148) | - |
| **UC-GEN-03** | Chuyển Đổi Vai Trò | `use-cases-v1.2.md` | 5.1 - UC-GEN-03 (lines 150-162) | `AUTH_MIDDLEWARE_CLARIFICATION.md` |
| **UC-GEN-04** | Xem DS Cuộc Hẹn | `use-cases-v1.2.md` | 5.1 - UC-GEN-04 (lines 164-178) | `CUOC_HEN_IMPLEMENTATION_COMPLETE.md` |
| **UC-GEN-05** | Trung Tâm Thông Báo | `use-cases-v1.2.md` | 5.1 - UC-GEN-05 (lines 180-188) | ⚠️ Chưa có impl doc |

### 3.2. Khách Hàng (UC-CUST)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-CUST-01** | Tìm Kiếm Phòng Trọ | `use-cases-v1.2.md` | 5.2 - UC-CUST-01 (lines 192-200) | - |
| **UC-CUST-02** | Quản Lý Yêu Thích | `use-cases-v1.2.md` | 5.2 - UC-CUST-02 (lines 202-210) | - |
| **UC-CUST-03** | Hẹn Lịch Xem Phòng | `use-cases-v1.2.md` | 5.2 - UC-CUST-03 (lines 212-230) | `CUOC_HEN_IMPLEMENTATION_COMPLETE.md`, `CUOC_HEN_UI_DESIGN.md` |
| **UC-CUST-04** | Thực Hiện Đặt Cọc | `use-cases-v1.2.md` | 5.2 - UC-CUST-04 (lines 232-242) | - |
| **UC-CUST-05** | Hủy Giao Dịch | `use-cases-v1.2.md` | 5.2 - UC-CUST-05 (lines 244-255) | - |
| **UC-CUST-06** | Quản Lý Ví | `use-cases-v1.2.md` | 5.2 - UC-CUST-06 (lines 257-265) | - |
| **UC-CUST-07** | Nhắn Tin | `use-cases-v1.2.md` | 5.2 - UC-CUST-07 (lines 267-273) | `TIN_NHAN_CHU_DU_AN_IMPLEMENTATION_PLAN.md`, `TIN_NHAN_CHU_DU_AN_SUMMARY.md` |
| - | Chi tiết Tin Đăng KH | - | - | `CHITIETTINDANG_KHACHHANG_IMPLEMENTATION.md` |

### 3.3. Nhân Viên Bán Hàng (UC-SALE)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-SALE-01** | Đăng ký Lịch làm việc | `use-cases-v1.2.md` | 5.3 - UC-SALE-01 (lines 277-286) | `NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md` (Section 3.1) |
| **UC-SALE-02** | Xem Chi tiết Cuộc hẹn | `use-cases-v1.2.md` | 5.3 - UC-SALE-02 (lines 288-294) | `NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md` (Section 3.2) |
| **UC-SALE-03** | Quản lý Cuộc hẹn | `use-cases-v1.2.md` | 5.3 - UC-SALE-03 (lines 296-306) | `NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md` (Section 3.3) |
| **UC-SALE-04** | Xác nhận Cọc | `use-cases-v1.2.md` | 5.3 - UC-SALE-04 (lines 308-315) | `HOA_HONG_SCHEMA_ANALYSIS.md`, `HOA_HONG_REFACTOR_SUMMARY.md`, `HOA_HONG_USAGE_GUIDE.md` |
| **UC-SALE-05** | Báo cáo Kết quả Cuộc hẹn | `use-cases-v1.2.md` | 5.3 - UC-SALE-05 (lines 317-324) | ⚠️ Backend only |
| **UC-SALE-06** | Xem Báo cáo Thu nhập | `use-cases-v1.2.md` | 5.3 - UC-SALE-06 (lines 326-332) | `NHAN_VIEN_BAN_HANG_IMPLEMENTATION.md` (Section 3.6) |
| **UC-SALE-07** | Nhắn tin | `use-cases-v1.2.md` | 5.3 - UC-SALE-07 (line 336) | `TIN_NHAN_CHU_DU_AN_IMPLEMENTATION_PLAN.md` |
| - | Implementation Plan | - | - | `NHAN_VIEN_BAN_HANG_IMPLEMENTATION_PLAN.md` |
| - | Testing Module | - | - | `TESTING_SALES_STAFF_MODULE.md` |
| - | Testing Report | - | - | `NVBH_TESTING_REPORT.md` |
| - | Testing Success | - | - | `NVBH_TESTING_SUCCESS.md` |
| - | Testing Issues | - | - | `NVBH_TESTING_ISSUES.md` |
| - | Quick Test Guide | - | - | `NVBH_QUICK_TEST_GUIDE.md` |
| - | UI/UX Fixes | - | - | `UI_UX_FIXES_NVBH.md` |

### 3.4. Chủ Dự Án (UC-PROJ)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-PROJ-01** | Đăng tin Cho thuê | `use-cases-v1.2.md` | 5.4 - UC-PROJ-01 (lines 340-388) | `FLOW_TAO_TIN_DANG_MOI.md`, `TAO_TIN_DANG_CHANGES_SUMMARY.md` |
| **UC-PROJ-02** | Xác nhận Cuộc hẹn | `use-cases-v1.2.md` | 5.4 - UC-PROJ-02 (lines 389-395) | `phe-duyet-cuoc-hen-implementation.md` |
| **UC-PROJ-03** | Xem Báo cáo Kinh doanh | `use-cases-v1.2.md` | 5.4 - UC-PROJ-03 (lines 397-403) | `DASHBOARD_METRICS_ANALYSIS.md`, `DASHBOARD_BAOCAO_OPTIMIZATION_PLAN.md` |
| **UC-PROJ-04** | Báo cáo Hợp đồng | `use-cases-v1.2.md` | 5.4 - UC-PROJ-04 (lines 405-413) | `UC_PROJ_04_IMPLEMENTATION_SUMMARY.md`, `UC_PROJ_04_05_IMPLEMENTATION_PLAN.md` |
| **UC-PROJ-05** | Nhắn tin | `use-cases-v1.2.md` | 5.4 - UC-PROJ-05 (line 417) | `TIN_NHAN_CHU_DU_AN_IMPLEMENTATION_PLAN.md`, `TIN_NHAN_CHU_DU_AN_SUMMARY.md` |
| - | Routes Implementation | - | - | `chu-du-an-routes-implementation.md` |
| - | Cài đặt Implementation | - | - | `CAI_DAT_CHU_DU_AN_IMPLEMENTATION.md` |
| - | QuanLyDuAn Integration | - | - | `QUANLYDUAN_INTEGRATION_COMPLETE.md` |
| - | QuanLyDuAn V2 Complete | - | - | `QUANLYDUAN_V2_COMPLETE.md` |
| - | Sync Verification | - | - | `SYNC_VERIFICATION_QUANLYDUAN.md` |
| - | Frontend README | - | - | `client/src/pages/ChuDuAn/README.md` |

### 3.5. Nhân Viên Điều Hành (UC-OPER)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-OPER-01** | Duyệt Tin đăng | `use-cases-v1.2.md` | 5.5 - UC-OPER-01 (lines 421-431) | - |
| **UC-OPER-02** | Quản lý DS Dự án | `use-cases-v1.2.md` | 5.5 - UC-OPER-02 (lines 433-438) | - |
| **UC-OPER-03** | QL Lịch làm việc NVBH | `use-cases-v1.2.md` | 5.5 - UC-OPER-03 (lines 440-446) | - |
| **UC-OPER-04** | Quản lý Hồ sơ Nhân viên | `use-cases-v1.2.md` | 5.5 - UC-OPER-04 (lines 448-453) | - |
| **UC-OPER-05** | Tạo Tài khoản Nhân viên | `use-cases-v1.2.md` | 5.5 - UC-OPER-05 (lines 455-461) | - |
| **UC-OPER-06** | Lập Biên bản Bàn giao | `use-cases-v1.2.md` | 5.5 - UC-OPER-06 (lines 463-470) | - |
| - | Operator API Fixes | - | - | `OPERATOR_API_FIX_SUMMARY.md` |
| - | Operator Login Test | - | - | `OPERATOR_LOGIN_TEST.md` |

### 3.6. Quản Trị Viên (UC-ADMIN)

| UC ID | Tên UC | Tài liệu Nguồn | Section | Implementation Docs |
|---|---|---|---|---|
| **UC-ADMIN-01** | QL Tài khoản Người dùng | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-01 (lines 474-492) | ⚠️ Backend only |
| **UC-ADMIN-02** | QL Danh sách Dự án | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-02 (lines 494-514) | - |
| **UC-ADMIN-03** | QL Danh sách Khu vực | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-03 (lines 516-522) | - |
| **UC-ADMIN-04** | Xem Báo cáo Thu nhập HT | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-04 (lines 524-530) | `DASHBOARD_METRICS_ANALYSIS.md` |
| **UC-ADMIN-05** | Quản lý Chính sách | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-05 (lines 532-538) | - |
| **UC-ADMIN-06** | QL Mẫu Hợp đồng | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-06 (lines 540-550) | - |
| **UC-ADMIN-07** | QL Quyền & RBAC | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-07 (lines 552-558) | - |
| **UC-ADMIN-08** | Xem Nhật Ký Hệ Thống | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-08 (lines 560-566) | ⚠️ Backend only |
| **UC-ADMIN-09** | QL Chính sách Cọc | `use-cases-v1.2.md` | 5.6 - UC-ADMIN-09 (lines 568-572) | - |

---

## 4. Yêu cầu phi chức năng (NFR)

| Mục SRS | Chủ đề NFR | Tài liệu Nguồn | Section/Lines | Ghi chú |
|---|---|---|---|---|
| **5.1** | Hiệu năng | `use-cases-v1.2.md` | Section 7: NFR (lines 599-603) | P95 targets |
| **5.1** | SLA Vận hành | `use-cases-v1.2.md` | Section 4.4 (lines 95-99) | Duyệt tin ≤ 4h, chat ≤ 10min |
| **5.2** | Bảo mật - Hash | `use-cases-v1.2.md` | Section 7 (line 606) | Argon2id/Bcrypt |
| **5.2** | Bảo mật - Idempotency | `use-cases-v1.2.md` | Section 7 (line 607) | KhóaĐịnhDanh |
| **5.2** | Bảo mật - CSRF | `use-cases-v1.2.md` | Section 7 (line 608) | Token-based |
| **5.2** | Rate Limiting | `use-cases-v1.2.md` | Section 4.2 (lines 87-89) | 5 login/min, 3 coc/min |
| **5.3** | Uptime | `use-cases-v1.2.md` | Section 7 (line 612) | ≥ 99.5%/tháng |
| **5.3** | Nghiệm thu Idempotency | `use-cases-v1.2.md` | Section 7 (line 616) | No duplicate requests |
| **5.3** | Nghiệm thu Race Condition | `use-cases-v1.2.md` | Section 7 (line 617) | No double-booking |
| **5.3** | Nghiệm thu Sổ Cái | `use-cases-v1.2.md` | Section 7 (lines 618-620) | Ledger integrity |
| **5.4** | Coding Standards | `.cursor-rules/main.md` | Full document | Code organization rules |
| **5.4** | BEM Standards | `BEM_MIGRATION_GUIDE.md` | Full document | CSS naming convention |

---

## 5. Thuộc tính hệ thống khác

| Mục SRS | Chủ đề | Tài liệu Nguồn | Section/Lines | Ghi chú |
|---|---|---|---|---|
| **6.1** | Mô hình dữ liệu | `thue_tro.sql` | Full SQL schema | Schema v10.4.32 |
| **6.1** | Mô hình dữ liệu (Docs) | `use-cases-v1.2.md` | Section 8 (lines 624-661) | Mô tả các bảng |
| **6.1** | Schema Analysis (HoaHong) | `HOA_HONG_SCHEMA_ANALYSIS.md` | Full document | Commission tables |
| **6.2** | Mô hình trạng thái | `use-cases-v1.2.md` | Section 3 (lines 43-72) | State machines |
| **6.2** | State: TinĐăng | `use-cases-v1.2.md` | 3.1 (lines 45-49) | Nhap → ChoDuyet → ... |
| **6.2** | State: Phòng | `use-cases-v1.2.md` | 3.2 (lines 51-55) | Trong ↔ GiuCho → ... |
| **6.2** | State: CuộcHẹn | `use-cases-v1.2.md` | 3.3 (line 58) | DaYeuCau → ... → HoanThanh |
| **6.2** | State: GiaoDịch | `use-cases-v1.2.md` | 3.4 (lines 62-65) | KhoiTao → ... |
| **6.2** | State: Bàn giao | `use-cases-v1.2.md` | 3.5 (lines 67-71) | ChuaBanGiao → DaBanGiao |
| **6.3** | RBAC Matrix | `use-cases-v1.2.md` | Section 6 (lines 576-592) | Permission table |

---

## 6. Tài liệu triển khai tổng hợp

### 6.1. Implementation Status & Summaries

| Tài liệu | Phạm vi | Ghi chú |
|---|---|---|
| `IMPLEMENTATION_STATUS.md` | Tổng quan tiến độ | Snapshot cũ |
| `IMPLEMENTATION_SUMMARY.md` | Tổng hợp triển khai | General summary |
| `FINAL_IMPLEMENTATION_SUMMARY.md` | Tổng kết cuối | Latest consolidated view |
| `BACKEND_IMPLEMENTATION_SUMMARY.md` | Backend-specific | API & Controllers |
| `IMPLEMENTATION_NOTES.md` | Ghi chú triển khai | Notes & decisions |
| `IMPLEMENTATION_COMPLETE.md` | Đã hoàn thành | Completed features |

### 6.2. Refactoring Documents

| Tài liệu | Phase | Nội dung |
|---|---|---|
| `REFACTOR_ANALYSIS_PHASE1.md` | Phase 1 | Initial analysis |
| `REFACTOR_PHASE2_SUMMARY.md` | Phase 2 | Code organization |
| `REFACTOR_PHASE3_SUMMARY.md` | Phase 3 | Service layer |
| `REFACTOR_PHASE4_CSS_MIGRATION_SUMMARY.md` | Phase 4 | BEM migration |
| `REFACTOR_PHASE5_TESTING_PLAN.md` | Phase 5 | Testing strategy |
| `REFACTOR_PHASE6_CLEANUP_PLAN.md` | Phase 6 | Code cleanup |
| `REFACTOR_COMPLETE_SUMMARY.md` | Final | Consolidated refactor summary |
| `HOA_HONG_REFACTOR_SUMMARY.md` | Specific | Commission refactoring |

### 6.3. Testing Documents

| Tài liệu | Phạm vi | Ghi chú |
|---|---|---|
| `TESTING_GUIDE.md` | Tổng quan | General testing approach |
| `PHASE_4A_TESTING_GUIDE.md` | Phase 4A | Phase-specific testing |
| `QUICK_START_TEST.md` | Quick start | Rapid testing guide |
| `TEST_README.md` | Test setup | Test environment setup |
| `TESTING_SALES_STAFF_MODULE.md` | NVBH | Sales staff testing |
| `NVBH_TESTING_REPORT.md` | NVBH | Test results |
| `NVBH_TESTING_SUCCESS.md` | NVBH | Success cases |
| `NVBH_TESTING_ISSUES.md` | NVBH | Known issues |
| `NVBH_QUICK_TEST_GUIDE.md` | NVBH | Quick test guide |

### 6.4. Modal & UI Redesign Documents

| Tài liệu | Component | Nội dung |
|---|---|---|
| `MODAL_CHON_CHINH_SACH_COC_REDESIGN.md` | Chính sách cọc | Modal redesign |
| `MODAL_PREVIEW_DETAIL_SECTIONS_REDESIGN.md` | Preview sections | Detail preview modal |
| `MODAL_PREVIEW_DUAN_REDESIGN.md` | Dự án preview | Project preview modal |
| `MODAL_GEOCODING_IMPLEMENTATION.md` | Geocoding | Address input modal |
| `PHONG_REDESIGN_FINAL.md` | Phòng UI | Room management UI |
| `VERIFICATION_REPORT_PHONG_REDESIGN.md` | Phòng | Verification report |
| `MINOR_IMPROVEMENTS_PHONG_REDESIGN.md` | Phòng | Minor improvements |

### 6.5. Bugfix & Error Resolution

| Tài liệu | Issue | Giải pháp |
|---|---|---|
| `BUGFIX_403_FORBIDDEN.md` | 403 errors | Auth permission fix |
| `BUGFIX_COMPLETE_SUMMARY.md` | Multiple bugs | Consolidated fixes |
| `FIX_FOREIGN_KEY_CONSTRAINT_1452.md` | FK constraint | Database constraint fix |
| `FIX_SERVER_START_ERROR.md` | Server startup | Startup error fix |
| `FINAL_FIX_PHPMYADMIN_VARIABLES.md` | phpMyAdmin | Config variables fix |
| `SERVER_START_ALL_ROUTES_FIXED.md` | Routes | All routes loading fix |

### 6.6. Deployment & Operations

| Tài liệu | Phạm vi | Ghi chú |
|---|---|---|
| `DEPLOYMENT_GUIDE_PHONG_SYNC.md` | Phòng Sync | Deployment instructions |
| `QUICK_START_PHONG_SYNC.md` | Phòng Sync | Quick start guide |
| `QUICK_START_TEST.md` | Testing | Quick test setup |
| `QUICK_START_UI_INTEGRATION.md` | UI | UI integration guide |
| `IMPORT_TEST_DATA_GUIDE.md` | Test data | Import test data |

### 6.7. Roadmap & Planning

| Tài liệu | Phạm vi | Ghi chú |
|---|---|---|
| `CHU_DU_AN_PRODUCTION_ROADMAP.md` | Chủ Dự Án | Production roadmap |
| `TOM_TAT_CHUC_NANG_CON_THIEU.md` | Missing features | Chức năng còn thiếu |
| `ROLLBACK_PLAN.md` | Rollback | Rollback strategy |
| `UC_PROJ_04_05_IMPLEMENTATION_PLAN.md` | UC-PROJ-04/05 | Implementation plan |
| `NHAN_VIEN_BAN_HANG_IMPLEMENTATION_PLAN.md` | NVBH | NVBH implementation plan |

### 6.8. Analysis & Comparison

| Tài liệu | Chủ đề | Ghi chú |
|---|---|---|
| `PHAN_TICH_CHUC_NANG_QUAN_LY_DU_AN.md` | QuanLyDuAn | Feature analysis |
| `SO_SANH_2_GIAI_PHAP.md` | Solutions | Compare 2 solutions |
| `DASHBOARD_METRICS_ANALYSIS.md` | Dashboard | Metrics analysis |
| `HOA_HONG_SCHEMA_ANALYSIS.md` | Commission | Schema analysis |

---

## 7. Ánh xạ Frontend Components

### 7.1. Chủ Dự Án Pages

| Component File | UC liên quan | Ghi chú |
|---|---|---|
| `client/src/pages/ChuDuAn/Dashboard.jsx` | UC-PROJ-03 | Main dashboard |
| `client/src/pages/ChuDuAn/TaoTinDang.jsx` | UC-PROJ-01 | Multi-step wizard |
| `client/src/pages/ChuDuAn/QuanLyTinDang.jsx` | UC-PROJ-01 | Listing management |
| `client/src/pages/ChuDuAn/ChinhSuaTinDang.jsx` | UC-PROJ-01 | Edit listing |
| `client/src/pages/ChuDuAn/QuanLyNhap.jsx` | UC-PROJ-01 | Draft management |
| `client/src/pages/ChuDuAn/QuanLyCuocHen.jsx` | UC-PROJ-02 | Appointment management |
| `client/src/pages/ChuDuAn/QuanLyHopDong.jsx` | UC-PROJ-04 | Contract management |
| `client/src/pages/ChuDuAn/BaoCaoHieuSuat.jsx` | UC-PROJ-03 | Performance reports |
| `client/src/pages/ChuDuAn/TinNhan.jsx` | UC-PROJ-05 | Messaging |
| `client/src/pages/ChuDuAn/CaiDat.jsx` | - | Settings |
| `client/src/pages/ChuDuAn/README.md` | - | Developer docs |

### 7.2. Nhân Viên Bán Hàng Pages

| Component File | UC liên quan | Ghi chú |
|---|---|---|
| `client/src/pages/NhanVienBanHang/Dashboard.jsx` | - | Main dashboard |
| `client/src/pages/NhanVienBanHang/LichLamViec.jsx` | UC-SALE-01 | Work schedule |
| `client/src/pages/NhanVienBanHang/QuanLyCuocHen.jsx` | UC-SALE-03 | Appointment mgmt |
| `client/src/pages/NhanVienBanHang/ChiTietCuocHen.jsx` | UC-SALE-02 | Appointment detail |
| `client/src/pages/NhanVienBanHang/QuanLyGiaoDich.jsx` | UC-SALE-04 | Transaction mgmt |
| `client/src/pages/NhanVienBanHang/BaoCaoThuNhap.jsx` | UC-SALE-06 | Income reports |
| `client/src/pages/NhanVienBanHang/TinNhan.jsx` | UC-SALE-07 | Messaging |

### 7.3. Operator Pages

| Component File | UC liên quan | Ghi chú |
|---|---|---|
| `client/src/pages/Operator/DashboardOperator.jsx` | - | Main dashboard |
| `client/src/pages/Operator/DuyetTinDang.jsx` | UC-OPER-01 | Listing approval |
| `client/src/pages/Operator/QuanLyDuAnOperator.jsx` | UC-OPER-02 | Project management |
| `client/src/pages/Operator/QuanLyLichNVBH.jsx` | UC-OPER-03 | Staff schedule mgmt |
| `client/src/pages/Operator/QuanLyNhanVien.jsx` | UC-OPER-04/05 | Staff management |
| `client/src/pages/Operator/QuanLyBienBan.jsx` | UC-OPER-06 | Handover reports |
| `client/src/pages/Operator/BaoCaoHoaHong.jsx` | - | Commission reports |

---

## 8. Lược đồ Database

| Bảng Database | Use Case liên quan | File SQL | Ghi chú |
|---|---|---|---|
| `NguoiDung` | UC-GEN-01, UC-GEN-02, UC-ADMIN-01 | `thue_tro.sql` | User accounts |
| `VaiTro`, `Quyen` | UC-GEN-03, UC-ADMIN-07 | `thue_tro.sql` | RBAC |
| `TinDang`, `Phong` | UC-PROJ-01, UC-CUST-01 | `thue_tro.sql` | Listings & units |
| `DuAn` | UC-PROJ-01, UC-ADMIN-02 | `thue_tro.sql` | Projects |
| `CuocHen` | UC-CUST-03, UC-SALE-03 | `thue_tro.sql` | Appointments |
| `LichLamViec` | UC-SALE-01, UC-OPER-03 | `thue_tro.sql` | Work schedules |
| `GiaoDich`, `Coc` | UC-CUST-04 | `thue_tro.sql` | Transactions |
| `HopDong` | UC-PROJ-04 | `thue_tro.sql` | Contracts |
| `BienBanBanGiao` | UC-OPER-06 | `thue_tro.sql` | Handover reports |
| `ChinhSachCoc` | UC-ADMIN-09 | `thue_tro.sql` | Deposit policies |
| `NhatKyHeThong` | UC-ADMIN-08 | `thue_tro.sql` | Audit log |
| `HoaHong*` | UC-SALE-04, UC-SALE-06 | `thue_tro.sql` | Commission tables |

Xem chi tiết schema analysis: `docs/HOA_HONG_SCHEMA_ANALYSIS.md`

---

## 9. Quy trình tra cứu

### 9.1. Từ UC đến Implementation

**Ví dụ: UC-PROJ-01 (Đăng tin Cho thuê)**

1. **Đặc tả chi tiết:** `use-cases-v1.2.md` section 5.4, lines 340-388
2. **Luồng nghiệp vụ:** `FLOW_TAO_TIN_DANG_MOI.md`
3. **UI Implementation:** `client/src/pages/ChuDuAn/TaoTinDang.jsx`
4. **Backend API:** `server/controllers/ChuDuAnController.js` → `taoTinDang()`
5. **Model:** `server/models/TinDangModel.js` → `create()`
6. **Related docs:**
   - Geocoding: `GEOCODING_ARCHITECTURE_FINAL.md`
   - Modal: `MODAL_GEOCODING_IMPLEMENTATION.md`
   - Changes summary: `TAO_TIN_DANG_CHANGES_SUMMARY.md`

### 9.2. Từ Component đến UC

**Ví dụ: `BaoCaoHieuSuat.jsx`**

1. **Component:** `client/src/pages/ChuDuAn/BaoCaoHieuSuat.jsx`
2. **UC:** UC-PROJ-03 (Xem Báo cáo Kinh doanh)
3. **Use case spec:** `use-cases-v1.2.md` lines 397-403
4. **Analysis docs:**
   - `DASHBOARD_METRICS_ANALYSIS.md`
   - `DASHBOARD_BAOCAO_OPTIMIZATION_PLAN.md`
5. **Backend:** `ChuDuAnController.layBaoCaoHieuSuat()`

### 9.3. Từ NFR đến Implementation

**Ví dụ: Rate Limiting**

1. **NFR spec:** `use-cases-v1.2.md` section 4.2 (lines 87-89)
2. **Implementation:** `server/middleware/rateLimiter.js`
3. **Applied at:** Login endpoint, Đặt cọc endpoint
4. **Testing:** Verified in `TESTING_GUIDE.md`

---

## 10. Metadata & Maintenance

**Lần cập nhật cuối:** 2025-11-06  
**Người cập nhật:** AI Agent (Cursor)  
**Phiên bản:** 2.0 (Mở rộng toàn hệ thống)

**Change Log:**
- **v1.0 (2025-10-15):** Phiên bản ban đầu, chỉ có ánh xạ cơ bản
- **v2.0 (2025-11-06):** Mở rộng toàn diện:
  - Bổ sung 60+ tài liệu nguồn
  - Ánh xạ chi tiết từng UC với line numbers
  - Thêm section Frontend Components
  - Thêm section Implementation & Refactoring docs
  - Thêm quy trình tra cứu 3 chiều

**Lưu ý:**
- Line numbers trong `use-cases-v1.2.md` có thể thay đổi khi file được cập nhật. Luôn kiểm tra section number để đảm bảo chính xác.
- Khi có tài liệu mới, cập nhật file này để duy trì tính truy vết.

---

**Kết luận:**

Tài liệu này cung cấp **khả năng truy vết 360 độ** từ bất kỳ điểm nào trong hệ thống:
- **From Requirements** → Implementation → Code
- **From Code** → Implementation → Requirements  
- **From NFR** → Standards → Code

Điều này đảm bảo mọi quyết định thiết kế và triển khai đều có nguồn gốc rõ ràng, hỗ trợ audit, maintenance và onboarding.
