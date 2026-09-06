const db = require("../config/db");

const SEED_ARTICLES = [
  // 1. Tin tức
  {
    BaiVietID: 1,
    TieuDe: "Top 10 khu vực sinh viên tại TP.HCM năm 2024",
    TomTat: "Khám phá những khu vực lý tưởng cho sinh viên với giá cả hợp lý và tiện nghi đầy đủ...",
    NoiDung: "Nội dung chi tiết về danh sách 10 khu vực trọ sinh viên lý tưởng tại TP.HCM như Làng Đại học Thủ Đức, Quận Bình Thạnh, Quận 10...",
    HinhAnh: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    Loai: "TinTuc",
    DanhMuc: "Khu vực",
    Slug: "top-10-khu-vuc-sinh-vien-tphcm-2024",
    LuotXem: 154,
    TaoLuc: new Date("2025-07-15T08:00:00Z")
  },
  {
    BaiVietID: 2,
    TieuDe: "Mẹo tìm phòng trọ giá rẻ nhưng chất lượng",
    TomTat: "Bạn đang tìm kiếm phòng trọ tốt với ngân sách eo hẹp? Hãy bỏ túi những bí quyết này...",
    NoiDung: "Hướng dẫn cách tìm phòng trọ giá rẻ: khảo sát giá xung quanh, thương lượng giá điện nước, kiểm tra an ninh khu vực trước khi đặt cọc...",
    HinhAnh: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80",
    Loai: "TinTuc",
    DanhMuc: "Mẹo tìm phòng",
    Slug: "meo-tim-phong-tro-gia-re",
    LuotXem: 230,
    TaoLuc: new Date("2025-07-20T10:30:00Z")
  },
  {
    BaiVietID: 3,
    TieuDe: "Top 5 dịch vụ tiện ích xung quanh khu căn hộ",
    TomTat: "Những tiện ích nào bạn nên xem xét trước khi chọn thuê nhà? Hãy cùng tìm hiểu...",
    NoiDung: "Top 5 tiện ích không thể thiếu gồm: Siêu thị tiện lợi 24/7, nhà thuốc, phòng gym/hồ bơi, khu vui chơi trẻ em và kết nối giao thông công cộng...",
    HinhAnh: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    Loai: "TinTuc",
    DanhMuc: "Tiện ích",
    Slug: "top-5-tien-ich-can-ho",
    LuotXem: 98,
    TaoLuc: new Date("2025-07-25T14:15:00Z")
  },
  {
    BaiVietID: 4,
    TieuDe: "Xu hướng bất động sản năm 2025: Đầu tư vào đâu?",
    TomTat: "Cập nhật xu hướng phát triển và các phân khúc tiềm năng sinh lời bền vững trong năm 2025...",
    NoiDung: "Tổng quan các xu hướng chính của thị trường bất động sản 2025: dòng tiền thông minh hướng về nhà ở thực, căn hộ vùng ven và các khu đô thị vệ tinh...",
    HinhAnh: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80",
    Loai: "TinTuc",
    DanhMuc: "Xu hướng",
    Slug: "xu-huong-bat-dong-san-2025",
    LuotXem: 312,
    TaoLuc: new Date("2025-08-01T09:00:00Z")
  },

  // 2. Wiki
  {
    BaiVietID: 5,
    TieuDe: "Lưu ý khi ký hợp đồng thuê nhà",
    TomTat: "Những điều bạn cần kiểm tra kỹ lưỡng trước khi ký tên vào hợp đồng thuê nhà...",
    NoiDung: "Cẩm nang pháp lý về hợp đồng thuê nhà: các điều khoản về đặt cọc, thời gian thuê, quy định hoàn cọc và sửa chữa trang thiết bị hư hỏng...",
    HinhAnh: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Hợp đồng",
    Slug: "luu-y-ky-hop-dong-thue-nha",
    LuotXem: 420,
    TaoLuc: new Date("2025-06-10T11:00:00Z")
  },
  {
    BaiVietID: 6,
    TieuDe: "Cách trang trí phòng trọ 20m² đẹp mắt",
    TomTat: "Với diện tích nhỏ, làm thế nào để bạn có một căn phòng vừa đẹp vừa tiện nghi?...",
    NoiDung: "Các giải pháp tối ưu diện tích phòng trọ nhỏ: sử dụng nội thất đa năng, tông màu sáng, tận dụng chiều cao phòng bằng kệ treo tường...",
    HinhAnh: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Trang trí",
    Slug: "cach-trang-tri-phong-tro-20m2",
    LuotXem: 350,
    TaoLuc: new Date("2025-06-15T15:20:00Z")
  },
  {
    BaiVietID: 7,
    TieuDe: "Cách đăng tin bất động sản hiệu quả",
    TomTat: "Hướng dẫn chi tiết cách đăng tin bất động sản thu hút và nhanh chóng bán được",
    NoiDung: "Bí quyết đăng tin nhanh chốt: Tiêu đề giật tít chứa từ khóa khu vực, hình ảnh thật độ phân giải cao, mô tả đầy đủ diện tích, pháp lý sổ hồng và thông tin liên hệ rõ ràng.",
    HinhAnh: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Đăng tin",
    Slug: "cach-dang-tin-hieu-qua",
    LuotXem: 512,
    TaoLuc: new Date("2025-06-22T08:45:00Z")
  },
  {
    BaiVietID: 8,
    TieuDe: "Kinh nghiệm mua nhà lần đầu",
    TomTat: "Những lời khuyên hữu ích cho người mua nhà lần đầu tiên",
    NoiDung: "Cẩm nang cho người mua nhà lần đầu: cân đối tài chính (chỉ nên vay tối đa 50% giá trị nhà), kiểm tra pháp lý quy hoạch, xem nhà vào nhiều khung giờ khác nhau để đánh giá môi trường sống.",
    HinhAnh: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Kinh nghiệm",
    Slug: "kinh-nghiem-mua-nha-lan-dau",
    LuotXem: 670,
    TaoLuc: new Date("2025-07-02T16:30:00Z")
  },
  {
    BaiVietID: 9,
    TieuDe: "Quy trình mua bán nhà đất",
    TomTat: "Quy trình pháp lý khi mua bán, chuyển nhượng bất động sản",
    NoiDung: "Quy trình chuyển nhượng chuẩn: 1. Đặt cọc -> 2. Công chứng hợp đồng mua bán tại Văn phòng công chứng -> 3. Nộp thuế thu nhập cá nhân & lệ phí trước bạ -> 4. Đăng bộ sang tên sổ đỏ.",
    HinhAnh: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Pháp lý",
    Slug: "quy-trinh-mua-ban-nha-dat",
    LuotXem: 410,
    TaoLuc: new Date("2025-07-10T10:00:00Z")
  },
  {
    BaiVietID: 10,
    TieuDe: "Thuế khi mua bán bất động sản",
    TomTat: "Các loại thuế cần biết khi tham gia giao dịch bất động sản",
    NoiDung: "Tổng hợp thuế phí: Thuế thu nhập cá nhân (2% giá trị chuyển nhượng, thường do bên bán nộp), Lệ phí trước bạ (0.5%, thường do bên nhận chuyển nhượng nộp), và phí công chứng.",
    HinhAnh: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    Loai: "Wiki",
    DanhMuc: "Thuế phí",
    Slug: "thue-mua-ban-bat-dong-san",
    LuotXem: 280,
    TaoLuc: new Date("2025-07-18T14:00:00Z")
  },

  // 3. Phân tích & Đánh giá
  {
    BaiVietID: 11,
    TieuDe: "Phân tích thị trường nhà đất quý 2 năm 2024",
    TomTat: "Thị trường nhà đất có những biến động gì trong quý 2? Cập nhật các xu hướng mới nhất...",
    NoiDung: "Báo cáo chi tiết về tình hình giao dịch bất động sản quý 2/2024: Phân khúc căn hộ chung cư trung cấp tiếp tục dẫn dắt thị trường, giá đất nền vùng ven có dấu hiệu đi ngang...",
    HinhAnh: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    Loai: "PhanTich",
    DanhMuc: "Phân tích thị trường",
    Slug: "phan-tich-thi-truong-q2-2024",
    LuotXem: 520,
    TaoLuc: new Date("2025-07-05T09:30:00Z")
  },
  {
    BaiVietID: 12,
    TieuDe: "Giá bất động sản tháng 7",
    TomTat: "Phân tích chi tiết biến động giá bất động sản tại TP. HCM trong tháng 7 năm 2025",
    NoiDung: "Báo cáo thống kê giá trung bình m² tại các quận trung tâm và quận vùng ven TP.HCM trong tháng 7. Sự tăng trưởng nhẹ ở khu Đông nhờ hạ tầng metro chuẩn bị đi vào vận hành.",
    HinhAnh: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    Loai: "PhanTich",
    DanhMuc: "Biểu đồ giá",
    Slug: "gia-bat-dong-san-thang-7",
    LuotXem: 340,
    TaoLuc: new Date("2025-07-28T13:45:00Z")
  },
  {
    BaiVietID: 13,
    TieuDe: "Xu hướng đầu tư năm 2025",
    TomTat: "Nên đầu tư vào loại hình bất động sản nào trong giai đoạn hiện tại?",
    NoiDung: "Đánh giá các dòng vốn đầu tư bất động sản: căn hộ dòng tiền cho thuê sinh lời ổn định, đất nền tích sản dài hạn, nhà phố thương mại kén khách nhưng lợi nhuận đột biến.",
    HinhAnh: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80",
    Loai: "PhanTich",
    DanhMuc: "Báo cáo thị trường",
    Slug: "xu-huong-dau-tu-2025",
    LuotXem: 490,
    TaoLuc: new Date("2025-08-05T11:00:00Z")
  },
  {
    BaiVietID: 14,
    TieuDe: "Khu vực phát triển trọng điểm",
    TomTat: "Top 5 khu vực có tiềm năng phát triển mạnh nhất tại TP. HCM",
    NoiDung: "Danh sách khu vực phát triển hạ tầng trọng điểm giai đoạn 2025-2030 gồm: Thành phố Thủ Đức (khu đô thị sáng tạo), Huyện Bình Chánh (quy hoạch lên quận), Quận 12, Huyện Nhà Bè.",
    HinhAnh: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    Loai: "PhanTich",
    DanhMuc: "Góc nhìn chuyên gia",
    Slug: "khu-vuc-phat-trien-tiem-nang",
    LuotXem: 615,
    TaoLuc: new Date("2025-08-12T15:30:00Z")
  },
  {
    BaiVietID: 15,
    TieuDe: "Đánh giá chi tiết dự án",
    TomTat: "Đánh giá chi tiết các dự án bất động sản đang hot trên thị trường",
    NoiDung: "Bài viết phân tích chuyên sâu về pháp lý, năng lực chủ đầu tư, tiến độ thi công và tỷ suất sinh lời thực tế của các dự án đại đô thị đang mở bán lớn tại TP.HCM và vùng vệ tinh.",
    HinhAnh: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80",
    Loai: "PhanTich",
    DanhMuc: "Video đánh giá",
    Slug: "danh-gia-chi-tiet-du-an-hot",
    LuotXem: 380,
    TaoLuc: new Date("2025-08-18T10:15:00Z")
  }
];

let tableInitialized = false;

class BaiVietModel {
  /**
   * Tự động kiểm tra và khởi tạo bảng baiviet cùng dữ liệu mẫu nếu chưa có
   */
  static async ensureTableAndSeed() {
    if (tableInitialized) return;
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS baiviet (
          BaiVietID INT(11) NOT NULL AUTO_INCREMENT,
          TieuDe VARCHAR(255) NOT NULL,
          TomTat TEXT DEFAULT NULL,
          NoiDung LONGTEXT DEFAULT NULL,
          HinhAnh VARCHAR(255) DEFAULT NULL,
          Loai ENUM('TinTuc', 'Wiki', 'PhanTich') NOT NULL DEFAULT 'TinTuc',
          DanhMuc VARCHAR(100) DEFAULT NULL,
          Slug VARCHAR(255) NOT NULL,
          LuotXem INT(11) DEFAULT 0,
          NguoiVietID INT(11) DEFAULT NULL,
          TaoLuc DATETIME DEFAULT CURRENT_TIMESTAMP,
          CapNhatLuc DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (BaiVietID),
          UNIQUE KEY idx_slug (Slug),
          KEY idx_loai (Loai)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      const [countResult] = await db.execute("SELECT COUNT(*) AS total FROM baiviet");
      if (countResult[0]?.total === 0) {
        console.log("📝 Bảng baiviet trống, đang chèn dữ liệu mẫu...");
        for (const item of SEED_ARTICLES) {
          await db.execute(
            `INSERT INTO baiviet (TieuDe, TomTat, NoiDung, HinhAnh, Loai, DanhMuc, Slug, LuotXem)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE TieuDe=VALUES(TieuDe)`,
            [item.TieuDe, item.TomTat, item.NoiDung, item.HinhAnh, item.Loai, item.DanhMuc, item.Slug, item.LuotXem || 0]
          );
        }
        console.log("✅ Đã chèn dữ liệu mẫu bài viết thành công!");
      }
      tableInitialized = true;
    } catch (err) {
      console.warn("[BaiVietModel] ensureTableAndSeed warning:", err.message);
    }
  }

  /**
   * Lấy danh sách bài viết theo bộ lọc
   * @param {Object} filters
   * @param {string} filters.loai - Loại bài viết (TinTuc, Wiki, PhanTich)
   * @param {string} filters.danhMuc - Danh mục bài viết
   * @param {number} filters.limit - Giới hạn số lượng bài viết trả về
   */
  static async layDanhSachBaiViet(filters = {}) {
    try {
      await this.ensureTableAndSeed();

      let query = `
        SELECT 
          BaiVietID,
          TieuDe,
          TomTat,
          HinhAnh,
          Loai,
          DanhMuc,
          Slug,
          LuotXem,
          TaoLuc,
          CapNhatLuc
        FROM baiviet
        WHERE 1=1
      `;
      const params = [];

      if (filters.loai) {
        query += " AND Loai = ?";
        params.push(filters.loai);
      }

      if (filters.danhMuc) {
        query += " AND DanhMuc = ?";
        params.push(filters.danhMuc);
      }

      query += " ORDER BY TaoLuc DESC";

      if (filters.limit) {
        const limitNum = parseInt(filters.limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          query += ` LIMIT ${limitNum}`;
        }
      }

      const [rows] = await db.execute(query, params);
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.error("[BaiVietModel] Lỗi query baiviet:", err.message);
    }

    // Fallback in-memory
    let fallback = [...SEED_ARTICLES];
    if (filters.loai) {
      fallback = fallback.filter(item => item.Loai === filters.loai);
    }
    if (filters.danhMuc) {
      fallback = fallback.filter(item => item.DanhMuc === filters.danhMuc);
    }
    if (filters.limit) {
      const limitNum = parseInt(filters.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        fallback = fallback.slice(0, limitNum);
      }
    }
    return fallback;
  }

  /**
   * Lấy chi tiết bài viết theo ID hoặc Slug
   * @param {string|number} idOrSlug
   */
  static async layChiTietBaiViet(idOrSlug) {
    try {
      await this.ensureTableAndSeed();

      const isId = !isNaN(Number(idOrSlug));
      let query = `
        SELECT 
          BaiVietID,
          TieuDe,
          TomTat,
          NoiDung,
          HinhAnh,
          Loai,
          DanhMuc,
          Slug,
          LuotXem,
          TaoLuc,
          CapNhatLuc
        FROM baiviet
      `;

      if (isId) {
        query += " WHERE BaiVietID = ?";
      } else {
        query += " WHERE Slug = ?";
      }

      const [rows] = await db.execute(query, [idOrSlug]);
      
      if (rows && rows.length > 0) {
        const targetId = rows[0].BaiVietID;
        db.execute("UPDATE baiviet SET LuotXem = LuotXem + 1 WHERE BaiVietID = ?", [targetId])
          .catch(e => console.error("Lỗi cập nhật lượt xem bài viết:", e));
        return rows[0];
      }
    } catch (err) {
      console.error("[BaiVietModel] Lỗi query chi tiết bài viết:", err.message);
    }

    // Fallback in-memory
    const isId = !isNaN(Number(idOrSlug));
    const post = SEED_ARTICLES.find((a, idx) => 
      (isId && (a.BaiVietID === Number(idOrSlug) || (idx + 1) === Number(idOrSlug))) || 
      a.Slug === idOrSlug
    );
    return post || null;
  }
}

// Khởi chạy ngầm việc tạo bảng & dữ liệu mẫu
BaiVietModel.ensureTableAndSeed().catch(() => {});

module.exports = BaiVietModel;
