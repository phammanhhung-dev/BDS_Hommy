/**
 * HoaHongService - Service tính toán hoa hồng/doanh thu theo công thức mới
 * 
 * Công thức:
 * - Số tiền cọc = số tháng cọc tối thiểu * giá phòng (+ phí nạp ví nếu có)
 * - Doanh thu công ty = số tiền cọc * % hoa hồng theo tháng cọc (ví dụ: 30% cho 6 tháng, 70% cho 12 tháng)
 * - Thu nhập NVBH/hợp đồng = doanh thu công ty * tỷ lệ hoa hồng nhân viên (thường 50%)
 * - Thu nhập NVDH/hợp đồng = doanh thu công ty * tỷ lệ hoa hồng quản lý (thường 10%)
 */

const db = require('../config/db');

class HoaHongService {
  /**
   * Lấy tỷ lệ hoa hồng từ BangHoaHong JSON theo số tháng cọc
   * @param {Array} bangHoaHong - JSON array [{soThang: 6, tyLe: 30}, {soThang: 12, tyLe: 70}]
   * @param {number} soThangCoc - Số tháng cọc thực tế
   * @returns {number} - Tỷ lệ hoa hồng (%), trả về 0 nếu không tìm thấy
   */
  static layTyLeHoaHongTheoBangCauHinh(bangHoaHong, soThangCoc) {
    if (!bangHoaHong || !Array.isArray(bangHoaHong) || bangHoaHong.length === 0) {
      return 0;
    }

    // Parse JSON nếu là string
    let bangHoaHongArray = bangHoaHong;
    if (typeof bangHoaHong === 'string') {
      try {
        bangHoaHongArray = JSON.parse(bangHoaHong);
      } catch (e) {
        console.error('Lỗi parse BangHoaHong JSON:', e);
        return 0;
      }
    }

    // Sắp xếp theo soThang giảm dần để tìm mức cao nhất mà soThangCoc đạt được
    const sortedBang = [...bangHoaHongArray].sort((a, b) => b.soThang - a.soThang);
    
    // Tìm mức hoa hồng phù hợp (soThangCoc >= soThang trong bảng)
    for (const muc of sortedBang) {
      if (soThangCoc >= muc.soThang) {
        return muc.tyLe || 0;
      }
    }

    return 0;
  }

  /**
   * Tính toán chi tiết hoa hồng cho một hợp đồng
   * @param {number} hopDongId - ID hợp đồng
   * @returns {Object} - Chi tiết tính toán hoa hồng
   */
  static async tinhHoaHongHopDong(hopDongId) {
    try {
      // Lấy thông tin hợp đồng và dự án liên quan
      // Ưu tiên: GiaThueCuoiCung > GiaTinDang (phong_tindang) > GiaChuan (phong)
      const [hopDongRows] = await db.execute(`
        SELECT 
          hd.HopDongID,
          hd.SoTienCoc,
          hd.GiaThueCuoiCung,
          hd.DuAnID,
          hd.PhongID,
          hd.TinDangID,
          hd.KhachHangID,
          hd.NhanVienBanHangID,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          hd.TrangThai,
          da.BangHoaHong,
          da.SoThangCocToiThieu,
          da.TenDuAn,
          da.ChuDuAnID,
          pt.GiaTinDang,
          p.GiaChuan as GiaChuanPhong,
          p.TenPhong,
          hs.QuanLyID as NhanVienDieuHanhID
        FROM hopdong hd
        INNER JOIN duan da ON hd.DuAnID = da.DuAnID
        LEFT JOIN phong p ON hd.PhongID = p.PhongID
        LEFT JOIN phong_tindang pt ON hd.PhongID = pt.PhongID AND hd.TinDangID = pt.TinDangID
        LEFT JOIN hosonhanvien hs ON hd.NhanVienBanHangID = hs.NguoiDungID
        WHERE hd.HopDongID = ?
      `, [hopDongId]);

      if (hopDongRows.length === 0) {
        throw new Error('Không tìm thấy hợp đồng');
      }

      const hopDong = hopDongRows[0];
      
      // Parse BangHoaHong từ JSON
      let bangHoaHong = [];
      if (hopDong.BangHoaHong) {
        try {
          bangHoaHong = typeof hopDong.BangHoaHong === 'string' 
            ? JSON.parse(hopDong.BangHoaHong) 
            : hopDong.BangHoaHong;
        } catch (e) {
          console.error('Lỗi parse BangHoaHong:', e);
        }
      }

      // Giá phòng: Ưu tiên GiaThueCuoiCung > GiaTinDang (phong_tindang) > GiaChuan (phong)
      const giaPhong = hopDong.GiaThueCuoiCung || hopDong.GiaTinDang || hopDong.GiaChuanPhong || 0;
      
      // Số tháng cọc = thời hạn hợp đồng (NgayKetThuc - NgayBatDau) tính bằng tháng
      // Theo yêu cầu: "hợp đồng 6 tháng (ngày kết thúc - ngày bắt đầu = 6 tháng)"
      const soThangCocToiThieu = hopDong.SoThangCocToiThieu || 1;
      let soThangCocThucTe = soThangCocToiThieu;
      
      if (hopDong.NgayBatDau && hopDong.NgayKetThuc) {
        const ngayBatDau = new Date(hopDong.NgayBatDau);
        const ngayKetThuc = new Date(hopDong.NgayKetThuc);
        // Tính số tháng chênh lệch
        const diffMonths = (ngayKetThuc.getFullYear() - ngayBatDau.getFullYear()) * 12 
          + (ngayKetThuc.getMonth() - ngayBatDau.getMonth());
        soThangCocThucTe = Math.max(diffMonths, soThangCocToiThieu);
      }

      // Tỷ lệ hoa hồng dự án theo số tháng cọc
      const tyLeHoaHongDuAn = this.layTyLeHoaHongTheoBangCauHinh(bangHoaHong, soThangCocThucTe);

      // Số tiền cọc thực tế (từ hợp đồng)
      const soTienCoc = hopDong.SoTienCoc || 0;

      // Doanh thu công ty = Số tiền cọc * Tỷ lệ hoa hồng dự án
      const doanhThuCongTy = (soTienCoc * tyLeHoaHongDuAn) / 100;

      // Cọc hoàn về cho Chủ dự án = Số tiền cọc - Doanh thu công ty
      const cocHoanVeChuDuAn = soTienCoc - doanhThuCongTy;

      // Kiểm tra có NVBH phụ trách không
      const coNhanVienBanHang = !!hopDong.NhanVienBanHangID;
      
      // Nếu có NVBH → tính thu nhập NVBH (50%) và NVDH (10%)
      // Nếu không có NVBH → toàn bộ doanh thu thuộc về công ty
      const tyLeHoaHongNVBH = coNhanVienBanHang ? 50 : 0;
      const tyLeHoaHongNVDH = coNhanVienBanHang ? 10 : 0;
      
      const thuNhapNVBH = (doanhThuCongTy * tyLeHoaHongNVBH) / 100;
      const thuNhapNVDH = (doanhThuCongTy * tyLeHoaHongNVDH) / 100;
      
      // Doanh thu thực của công ty = Doanh thu - Thu nhập NVBH - Thu nhập NVDH
      const doanhThuCongTyThuc = doanhThuCongTy - thuNhapNVBH - thuNhapNVDH;

      return {
        hopDongId: hopDong.HopDongID,
        tenDuAn: hopDong.TenDuAn,
        tenPhong: hopDong.TenPhong,
        giaPhong,
        nguonGia: hopDong.GiaThueCuoiCung ? 'GiaThueCuoiCung' : (hopDong.GiaTinDang ? 'GiaTinDang' : 'GiaChuan'),
        soTienCoc,
        soThangCocThucTe,
        soThangCocToiThieu,
        tyLeHoaHongDuAn,
        bangHoaHong,
        doanhThuCongTy,           // Tổng doanh thu từ hoa hồng
        doanhThuCongTyThuc,       // Doanh thu sau khi trừ thu nhập NVBH/NVDH
        cocHoanVeChuDuAn,
        chuDuAnId: hopDong.ChuDuAnID,
        trangThaiHopDong: hopDong.TrangThai,
        // Thông tin NVBH/NVDH
        nhanVienBanHangId: hopDong.NhanVienBanHangID,
        nhanVienDieuHanhId: hopDong.NhanVienDieuHanhID,
        coNhanVienBanHang,
        thuNhapNVBH,
        thuNhapNVDH
      };
    } catch (error) {
      throw new Error(`Lỗi tính hoa hồng hợp đồng: ${error.message}`);
    }
  }

  /**
   * Tính thu nhập NVBH từ một hợp đồng
   * @param {number} hopDongId - ID hợp đồng
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @returns {Object} - Chi tiết thu nhập NVBH
   */
  static async tinhThuNhapNVBH(hopDongId, nhanVienId) {
    try {
      // Lấy thông tin nhân viên
      const [nhanVienRows] = await db.execute(`
        SELECT TyLeHoaHong, MaNhanVien, QuanLyID
        FROM hosonhanvien
        WHERE NguoiDungID = ?
      `, [nhanVienId]);

      // Tính hoa hồng hợp đồng (đã tính sẵn thu nhập NVBH dựa trên có NVBH phụ trách hay không)
      const hoaHongHopDong = await this.tinhHoaHongHopDong(hopDongId);

      // Kiểm tra: Chỉ tính thu nhập nếu hợp đồng có NVBH phụ trách
      // Nếu khách đặt cọc online không qua NVBH → thu nhập = 0
      const tyLeHoaHongNhanVien = hoaHongHopDong.coNhanVienBanHang ? 50 : 0;
      const thuNhapNVBH = hoaHongHopDong.thuNhapNVBH; // Đã tính trong tinhHoaHongHopDong

      return {
        ...hoaHongHopDong,
        nhanVienId,
        maNhanVien: nhanVienRows[0]?.MaNhanVien || null,
        tyLeHoaHongNhanVien,
        thuNhapNVBH,
        quanLyId: nhanVienRows[0]?.QuanLyID || null,
        // Chi tiết công thức
        congThuc: {
          doanhThuCongTy: `${hoaHongHopDong.soTienCoc} × ${hoaHongHopDong.tyLeHoaHongDuAn}% = ${hoaHongHopDong.doanhThuCongTy}`,
          thuNhapNVBH: hoaHongHopDong.coNhanVienBanHang 
            ? `${hoaHongHopDong.doanhThuCongTy} × ${tyLeHoaHongNhanVien}% = ${thuNhapNVBH}` 
            : 'Không có NVBH phụ trách → 0 VNĐ'
        }
      };
    } catch (error) {
      throw new Error(`Lỗi tính thu nhập NVBH: ${error.message}`);
    }
  }

  /**
   * Tính thu nhập NVDH từ các hợp đồng của NVBH dưới quyền
   * @param {number} quanLyId - ID người quản lý (NVDH)
   * @param {number} hopDongId - ID hợp đồng
   * @returns {Object} - Chi tiết thu nhập NVDH
   */
  static async tinhThuNhapNVDH(quanLyId, hopDongId) {
    try {
      // Lấy thông tin NVDH
      const [quanLyRows] = await db.execute(`
        SELECT TyLeHoaHong, MaNhanVien
        FROM hosonhanvien
        WHERE NguoiDungID = ?
      `, [quanLyId]);

      // Tính hoa hồng hợp đồng (đã tính sẵn thu nhập NVDH dựa trên có NVBH phụ trách hay không)
      const hoaHongHopDong = await this.tinhHoaHongHopDong(hopDongId);

      // Kiểm tra: Chỉ tính thu nhập NVDH nếu hợp đồng có NVBH phụ trách
      // NVDH chỉ được hoa hồng từ hợp đồng do NVBH dưới quyền thực hiện
      const tyLeHoaHongQuanLy = hoaHongHopDong.coNhanVienBanHang ? 10 : 0;
      const thuNhapNVDH = hoaHongHopDong.thuNhapNVDH; // Đã tính trong tinhHoaHongHopDong

      return {
        ...hoaHongHopDong,
        quanLyId,
        maNhanVienQuanLy: quanLyRows[0]?.MaNhanVien || null,
        tyLeHoaHongQuanLy,
        thuNhapNVDH,
        // Chi tiết công thức
        congThuc: {
          doanhThuCongTy: `${hoaHongHopDong.soTienCoc} × ${hoaHongHopDong.tyLeHoaHongDuAn}% = ${hoaHongHopDong.doanhThuCongTy}`,
          thuNhapNVDH: hoaHongHopDong.coNhanVienBanHang
            ? `${hoaHongHopDong.doanhThuCongTy} × ${tyLeHoaHongQuanLy}% = ${thuNhapNVDH}`
            : 'Không có NVBH phụ trách → 0 VNĐ'
        }
      };
    } catch (error) {
      throw new Error(`Lỗi tính thu nhập NVDH: ${error.message}`);
    }
  }

  /**
   * Tính tổng thu nhập NVBH theo khoảng thời gian
   * @param {number} nhanVienId - ID nhân viên bán hàng
   * @param {Date} tuNgay - Ngày bắt đầu
   * @param {Date} denNgay - Ngày kết thúc
   * @returns {Object} - Báo cáo thu nhập tổng hợp
   */
  static async baoCaoThuNhapNVBH(nhanVienId, tuNgay, denNgay) {
    try {
      // Lấy thông tin nhân viên
      const [nhanVienRows] = await db.execute(`
        SELECT hs.TyLeHoaHong, hs.MaNhanVien, hs.QuanLyID, nd.TenDayDu
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        WHERE hs.NguoiDungID = ?
      `, [nhanVienId]);

      if (nhanVienRows.length === 0) {
        throw new Error('Không tìm thấy hồ sơ nhân viên');
      }

      const nhanVien = nhanVienRows[0];
      // Tỷ lệ hoa hồng NVBH: Cố định 50% theo yêu cầu business
      const tyLeHoaHongNhanVien = 50;

      // Lấy danh sách hợp đồng NVBH tham gia (qua cuộc hẹn)
      // Ưu tiên: GiaThueCuoiCung > GiaTinDang (phong_tindang) > GiaChuan (phong)
      const [hopDongRows] = await db.execute(`
        SELECT DISTINCT
          hd.HopDongID,
          hd.SoTienCoc,
          hd.GiaThueCuoiCung,
          hd.TinDangID,
          hd.DuAnID,
          hd.PhongID,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          hd.TrangThai,
          da.BangHoaHong,
          da.SoThangCocToiThieu,
          da.TenDuAn,
          da.ChuDuAnID,
          pt.GiaTinDang,
          p.GiaChuan,
          p.TenPhong
        FROM hopdong hd
        INNER JOIN duan da ON hd.DuAnID = da.DuAnID
        LEFT JOIN phong p ON hd.PhongID = p.PhongID
        LEFT JOIN phong_tindang pt ON hd.PhongID = pt.PhongID AND hd.TinDangID = pt.TinDangID
        INNER JOIN cuochen ch ON ch.PhongID = hd.PhongID AND ch.TinDangID = hd.TinDangID
        WHERE ch.NhanVienBanHangID = ?
        AND hd.TrangThai = 'xacthuc'
        AND hd.NgayBatDau BETWEEN ? AND ?
      `, [nhanVienId, tuNgay, denNgay]);

      // Tính toán chi tiết cho từng hợp đồng
      const chiTietHopDong = [];
      let tongDoanhThuCongTy = 0;
      let tongThuNhapNVBH = 0;

      for (const hd of hopDongRows) {
        // Parse BangHoaHong
        let bangHoaHong = [];
        if (hd.BangHoaHong) {
          try {
            bangHoaHong = typeof hd.BangHoaHong === 'string' 
              ? JSON.parse(hd.BangHoaHong) 
              : hd.BangHoaHong;
          } catch (e) {
            console.error('Lỗi parse BangHoaHong:', e);
          }
        }

        // Ưu tiên: GiaThueCuoiCung > GiaTinDang > GiaChuan
        const giaPhong = hd.GiaThueCuoiCung || hd.GiaTinDang || hd.GiaChuan || 0;
        
        // Số tháng cọc = thời hạn hợp đồng (NgayKetThuc - NgayBatDau) tính bằng tháng
        const soThangCocToiThieu = hd.SoThangCocToiThieu || 1;
        let soThangCocThucTe = soThangCocToiThieu;
        
        if (hd.NgayBatDau && hd.NgayKetThuc) {
          const ngayBatDau = new Date(hd.NgayBatDau);
          const ngayKetThuc = new Date(hd.NgayKetThuc);
          const diffMonths = (ngayKetThuc.getFullYear() - ngayBatDau.getFullYear()) * 12 
            + (ngayKetThuc.getMonth() - ngayBatDau.getMonth());
          soThangCocThucTe = Math.max(diffMonths, soThangCocToiThieu);
        }

        const tyLeHoaHongDuAn = this.layTyLeHoaHongTheoBangCauHinh(bangHoaHong, soThangCocThucTe);
        const doanhThuCongTy = (hd.SoTienCoc * tyLeHoaHongDuAn) / 100;
        const thuNhapNVBH = (doanhThuCongTy * tyLeHoaHongNhanVien) / 100;
        const cocHoanVeChuDuAn = hd.SoTienCoc - doanhThuCongTy;

        tongDoanhThuCongTy += doanhThuCongTy;
        tongThuNhapNVBH += thuNhapNVBH;

        chiTietHopDong.push({
          hopDongId: hd.HopDongID,
          tenDuAn: hd.TenDuAn,
          tenPhong: hd.TenPhong,
          giaPhong,
          nguonGia: hd.GiaThueCuoiCung ? 'GiaThueCuoiCung' : (hd.GiaTinDang ? 'GiaTinDang' : 'GiaChuan'),
          soTienCoc: hd.SoTienCoc,
          soThangCocThucTe,
          tyLeHoaHongDuAn,
          doanhThuCongTy,
          thuNhapNVBH,
          cocHoanVeChuDuAn,
          chuDuAnId: hd.ChuDuAnID,
          ngayBatDau: hd.NgayBatDau
        });
      }

      return {
        nhanVienId,
        maNhanVien: nhanVien.MaNhanVien,
        tenNhanVien: nhanVien.TenDayDu,
        tyLeHoaHongNhanVien,
        tuNgay,
        denNgay,
        soHopDong: hopDongRows.length,
        tongDoanhThuCongTy,
        tongThuNhapNVBH,
        chiTietHopDong,
        // Summary công thức
        congThuc: {
          moTa: 'Doanh thu công ty = Số tiền cọc × % hoa hồng dự án\nThu nhập NVBH = Doanh thu công ty × tỷ lệ hoa hồng nhân viên',
          tyLeApDung: `${tyLeHoaHongNhanVien}%`
        }
      };
    } catch (error) {
      throw new Error(`Lỗi báo cáo thu nhập NVBH: ${error.message}`);
    }
  }

  /**
   * Tính tổng thu nhập NVDH từ các NVBH dưới quyền
   * @param {number} quanLyId - ID NVDH
   * @param {Date} tuNgay - Ngày bắt đầu
   * @param {Date} denNgay - Ngày kết thúc
   * @returns {Object} - Báo cáo thu nhập NVDH
   */
  static async baoCaoThuNhapNVDH(quanLyId, tuNgay, denNgay) {
    try {
      // Lấy thông tin quản lý
      const [quanLyRows] = await db.execute(`
        SELECT hs.TyLeHoaHong, hs.MaNhanVien, nd.TenDayDu
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        WHERE hs.NguoiDungID = ?
      `, [quanLyId]);

      if (quanLyRows.length === 0) {
        throw new Error('Không tìm thấy hồ sơ quản lý');
      }

      const quanLy = quanLyRows[0];
      // Tỷ lệ hoa hồng NVDH: Cố định 10% theo yêu cầu business
      const tyLeHoaHongQuanLy = 10;

      // Lấy danh sách NVBH dưới quyền
      const [nvbhRows] = await db.execute(`
        SELECT hs.NguoiDungID, hs.MaNhanVien, hs.TyLeHoaHong, nd.TenDayDu
        FROM hosonhanvien hs
        INNER JOIN nguoidung nd ON hs.NguoiDungID = nd.NguoiDungID
        WHERE hs.QuanLyID = ?
      `, [quanLyId]);

      // Tính thu nhập từ từng NVBH
      const chiTietNVBH = [];
      let tongDoanhThuCongTy = 0;
      let tongThuNhapNVDH = 0;
      let tongSoHopDong = 0;

      for (const nvbh of nvbhRows) {
        const baoCaoNVBH = await this.baoCaoThuNhapNVBH(nvbh.NguoiDungID, tuNgay, denNgay);
        
        // Thu nhập NVDH từ các hợp đồng của NVBH này
        const thuNhapNVDHTuNVBH = (baoCaoNVBH.tongDoanhThuCongTy * tyLeHoaHongQuanLy) / 100;

        tongDoanhThuCongTy += baoCaoNVBH.tongDoanhThuCongTy;
        tongThuNhapNVDH += thuNhapNVDHTuNVBH;
        tongSoHopDong += baoCaoNVBH.soHopDong;

        chiTietNVBH.push({
          nhanVienId: nvbh.NguoiDungID,
          maNhanVien: nvbh.MaNhanVien,
          tenNhanVien: nvbh.TenDayDu,
          soHopDong: baoCaoNVBH.soHopDong,
          tongDoanhThuCongTy: baoCaoNVBH.tongDoanhThuCongTy,
          thuNhapNVDHTuNVBHNay: thuNhapNVDHTuNVBH
        });
      }

      return {
        quanLyId,
        maNhanVien: quanLy.MaNhanVien,
        tenQuanLy: quanLy.TenDayDu,
        tyLeHoaHongQuanLy,
        tuNgay,
        denNgay,
        soNVBHDuoiQuyen: nvbhRows.length,
        tongSoHopDong,
        tongDoanhThuCongTy,
        tongThuNhapNVDH,
        chiTietNVBH,
        // Summary công thức
        congThuc: {
          moTa: 'Thu nhập NVDH = Doanh thu công ty × tỷ lệ hoa hồng quản lý\n(Tính trên tất cả hợp đồng của NVBH dưới quyền)',
          tyLeApDung: `${tyLeHoaHongQuanLy}%`
        }
      };
    } catch (error) {
      throw new Error(`Lỗi báo cáo thu nhập NVDH: ${error.message}`);
    }
  }

  /**
   * Ước tính tiền cọc theo công thức mới
   * @param {number} giaPhong - Giá phòng/tháng
   * @param {number} soThangCoc - Số tháng cọc
   * @param {number} phiNapVi - Phí nạp ví (nếu có)
   * @returns {Object} - Chi tiết ước tính
   */
  static uocTinhTienCoc(giaPhong, soThangCoc, phiNapVi = 0) {
    const soTienCoc = (soThangCoc * giaPhong) + phiNapVi;
    
    return {
      giaPhong,
      soThangCoc,
      phiNapVi,
      soTienCoc,
      congThuc: `${soThangCoc} × ${giaPhong.toLocaleString('vi-VN')} + ${phiNapVi.toLocaleString('vi-VN')} = ${soTienCoc.toLocaleString('vi-VN')} VNĐ`
    };
  }

  /**
   * Tính preview doanh thu/hoa hồng (không lưu DB)
   * @param {Object} params - Tham số tính toán
   * @param {boolean} params.coNhanVienBanHang - Có NVBH phụ trách không (default: true)
   * @returns {Object} - Preview kết quả
   */
  static tinhPreviewHoaHong(params) {
    const {
      soTienCoc,
      bangHoaHong, // JSON array
      soThangCoc,
      coNhanVienBanHang = true // Mặc định có NVBH
    } = params;

    const tyLeHoaHongDuAn = this.layTyLeHoaHongTheoBangCauHinh(bangHoaHong, soThangCoc);
    const doanhThuCongTy = (soTienCoc * tyLeHoaHongDuAn) / 100;
    
    // Chỉ tính thu nhập NVBH/NVDH nếu có NVBH phụ trách
    // Nếu khách đặt cọc online không qua NVBH → toàn bộ doanh thu thuộc công ty
    const tyLeHoaHongNVBH = coNhanVienBanHang ? 50 : 0;
    const tyLeHoaHongNVDH = coNhanVienBanHang ? 10 : 0;
    
    const thuNhapNVBH = (doanhThuCongTy * tyLeHoaHongNVBH) / 100;
    const thuNhapNVDH = (doanhThuCongTy * tyLeHoaHongNVDH) / 100;
    const doanhThuCongTyThuc = doanhThuCongTy - thuNhapNVBH - thuNhapNVDH;

    return {
      soTienCoc,
      soThangCoc,
      tyLeHoaHongDuAn,
      doanhThuCongTy,          // Tổng doanh thu từ hoa hồng
      doanhThuCongTyThuc,      // Doanh thu thực sau khi trừ NVBH/NVDH
      coNhanVienBanHang,
      tyLeHoaHongNVBH,
      thuNhapNVBH,
      tyLeHoaHongNVDH,
      thuNhapNVDH,
      congThuc: {
        doanhThuCongTy: `${soTienCoc.toLocaleString('vi-VN')} × ${tyLeHoaHongDuAn}% = ${doanhThuCongTy.toLocaleString('vi-VN')} VNĐ`,
        thuNhapNVBH: coNhanVienBanHang 
          ? `${doanhThuCongTy.toLocaleString('vi-VN')} × ${tyLeHoaHongNVBH}% = ${thuNhapNVBH.toLocaleString('vi-VN')} VNĐ`
          : 'Đặt cọc online (không có NVBH) → 0 VNĐ',
        thuNhapNVDH: coNhanVienBanHang
          ? `${doanhThuCongTy.toLocaleString('vi-VN')} × ${tyLeHoaHongNVDH}% = ${thuNhapNVDH.toLocaleString('vi-VN')} VNĐ`
          : 'Đặt cọc online (không có NVBH) → 0 VNĐ',
        doanhThuCongTyThuc: coNhanVienBanHang
          ? `${doanhThuCongTy.toLocaleString('vi-VN')} - ${thuNhapNVBH.toLocaleString('vi-VN')} - ${thuNhapNVDH.toLocaleString('vi-VN')} = ${doanhThuCongTyThuc.toLocaleString('vi-VN')} VNĐ`
          : `100% doanh thu = ${doanhThuCongTy.toLocaleString('vi-VN')} VNĐ`
      }
    };
  }

  /**
   * Báo cáo doanh thu cho Chủ dự án
   * Tính tổng cọc hoàn về = tổng số tiền cọc - tổng doanh thu công ty
   * @param {number} chuDuAnId - ID chủ dự án
   * @param {Object} filters - Bộ lọc thời gian
   * @returns {Object} - Báo cáo doanh thu
   */
  static async baoCaoDoanhThuChuDuAn(chuDuAnId, filters = {}) {
    try {
      const { tuNgay, denNgay } = filters;
      
      // Mặc định: tháng hiện tại
      const defaultTuNgay = tuNgay || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const defaultDenNgay = denNgay || new Date().toISOString().split('T')[0];

      console.log('📊 [HoaHongService] baoCaoDoanhThuChuDuAn - Input:', {
        chuDuAnId,
        tuNgay: defaultTuNgay,
        denNgay: defaultDenNgay
      });

      // Lấy danh sách hợp đồng của chủ dự án trong khoảng thời gian
      const [hopDongRows] = await db.execute(`
        SELECT 
          hd.HopDongID,
          hd.SoTienCoc,
          hd.GiaThueCuoiCung,
          hd.NgayBatDau,
          hd.NgayKetThuc,
          da.BangHoaHong,
          da.SoThangCocToiThieu,
          da.TenDuAn,
          pt.GiaTinDang,
          p.GiaChuan as GiaChuanPhong,
          p.TenPhong
        FROM hopdong hd
        INNER JOIN duan da ON hd.DuAnID = da.DuAnID
        LEFT JOIN phong p ON hd.PhongID = p.PhongID
        LEFT JOIN phong_tindang pt ON hd.PhongID = pt.PhongID AND hd.TinDangID = pt.TinDangID
        WHERE da.ChuDuAnID = ?
          AND (hd.TrangThai IS NULL OR hd.TrangThai = 'xacthuc')
          AND hd.NgayBatDau >= ?
          AND hd.NgayBatDau <= ?
        ORDER BY hd.NgayBatDau DESC
      `, [chuDuAnId, defaultTuNgay, defaultDenNgay]);

      console.log('📊 [HoaHongService] Query result:', {
        soHopDong: hopDongRows.length,
        hopDongIds: hopDongRows.map(h => h.HopDongID),
        chiTiet: hopDongRows.map(h => ({
          HopDongID: h.HopDongID,
          SoTienCoc: h.SoTienCoc,
          NgayBatDau: h.NgayBatDau,
          NgayKetThuc: h.NgayKetThuc,
          BangHoaHong: h.BangHoaHong
        }))
      });

      let tongSoTienCoc = 0;
      let tongDoanhThuCongTy = 0;
      let tongCocHoanVeChuDuAn = 0;
      const chiTietHopDong = [];

      for (const hopDong of hopDongRows) {
        // Parse BangHoaHong
        let bangHoaHong = [];
        if (hopDong.BangHoaHong) {
          try {
            bangHoaHong = typeof hopDong.BangHoaHong === 'string' 
              ? JSON.parse(hopDong.BangHoaHong) 
              : hopDong.BangHoaHong;
          } catch (e) {
            console.error('Lỗi parse BangHoaHong:', e);
          }
        }

        // Giá phòng: Ưu tiên GiaThueCuoiCung > GiaTinDang > GiaChuan
        const giaPhong = hopDong.GiaThueCuoiCung || hopDong.GiaTinDang || hopDong.GiaChuanPhong || 0;
        
        // Số tháng cọc = thời hạn hợp đồng (NgayKetThuc - NgayBatDau) tính bằng tháng
        // Theo yêu cầu: "hợp đồng 6 tháng (ngày kết thúc - ngày bắt đầu = 6 tháng)"
        const soThangCocToiThieu = hopDong.SoThangCocToiThieu || 1;
        let soThangCocThucTe = soThangCocToiThieu;
        
        if (hopDong.NgayBatDau && hopDong.NgayKetThuc) {
          const ngayBatDau = new Date(hopDong.NgayBatDau);
          const ngayKetThuc = new Date(hopDong.NgayKetThuc);
          // Tính số tháng chênh lệch
          const diffMonths = (ngayKetThuc.getFullYear() - ngayBatDau.getFullYear()) * 12 
            + (ngayKetThuc.getMonth() - ngayBatDau.getMonth());
          soThangCocThucTe = Math.max(diffMonths, soThangCocToiThieu);
        }

        // Tỷ lệ hoa hồng dự án
        const tyLeHoaHongDuAn = this.layTyLeHoaHongTheoBangCauHinh(bangHoaHong, soThangCocThucTe);

        const soTienCoc = hopDong.SoTienCoc || 0;
        const doanhThuCongTy = (soTienCoc * tyLeHoaHongDuAn) / 100;
        const cocHoanVe = soTienCoc - doanhThuCongTy;

        console.log('📊 [HoaHongService] Tính hợp đồng:', {
          HopDongID: hopDong.HopDongID,
          soTienCoc,
          soThangCocThucTe,
          bangHoaHong,
          tyLeHoaHongDuAn,
          doanhThuCongTy,
          cocHoanVe
        });

        tongSoTienCoc += soTienCoc;
        tongDoanhThuCongTy += doanhThuCongTy;
        tongCocHoanVeChuDuAn += cocHoanVe;

        chiTietHopDong.push({
          hopDongId: hopDong.HopDongID,
          tenDuAn: hopDong.TenDuAn,
          tenPhong: hopDong.TenPhong,
          ngayBatDau: hopDong.NgayBatDau,
          giaPhong,
          soTienCoc,
          soThangCocThucTe,
          tyLeHoaHongDuAn,
          doanhThuCongTy,
          cocHoanVeChuDuAn: cocHoanVe
        });
      }

      const result = {
        tuNgay: defaultTuNgay,
        denNgay: defaultDenNgay,
        tongHopDong: hopDongRows.length,
        tongSoTienCoc,
        tongDoanhThuCongTy,
        tongCocHoanVeChuDuAn,
        tyLeGiuLai: tongSoTienCoc > 0 ? ((tongDoanhThuCongTy / tongSoTienCoc) * 100).toFixed(1) : 0,
        chiTietHopDong
      };

      console.log('📊 [HoaHongService] KẾT QUẢ CUỐI CÙNG:', {
        tongHopDong: result.tongHopDong,
        tongSoTienCoc: result.tongSoTienCoc,
        tongDoanhThuCongTy: result.tongDoanhThuCongTy,
        tongCocHoanVeChuDuAn: result.tongCocHoanVeChuDuAn
      });

      return result;
    } catch (error) {
      console.error('❌ [HoaHongService] Lỗi:', error.message);
      throw new Error(`Lỗi báo cáo doanh thu chủ dự án: ${error.message}`);
    }
  }
}

module.exports = HoaHongService;
