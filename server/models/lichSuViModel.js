const db = require("../config/db");

class LichSuViModel {
  static async themLichSuVi({
    user_id,
    ma_giao_dich,
    so_tien,
    trang_thai,
    LoaiGiaoDich,
  }) {
    const sql = `
      INSERT INTO lich_su_vi (user_id, ma_giao_dich, so_tien, trang_thai, LoaiGiaoDich)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [
      user_id,
      ma_giao_dich,
      so_tien,
      trang_thai || "CHO_XU_LY",
      LoaiGiaoDich !== undefined && LoaiGiaoDich !== null && LoaiGiaoDich !== ""
        ? LoaiGiaoDich
        : "nap",
    ]);

    // Nếu là rút tiền thì trừ tiền trong ví
    if (
      (LoaiGiaoDich === "rut" || LoaiGiaoDich === "rút") &&
      (trang_thai === "THANH_CONG" || !trang_thai)
    ) {
      await db.execute("UPDATE vi SET SoDu = SoDu - ? WHERE NguoiDungID = ?", [
        so_tien,
        user_id,
      ]);
    }

    return result;
  }

  static async suaLichSuVi(id, { user_id, ma_giao_dich, so_tien, trang_thai }) {
    // Lấy thông tin giao dịch hiện tại
    const [rows] = await db.execute("SELECT * FROM lich_su_vi WHERE id = ?", [
      id,
    ]);
    const giaoDich = rows[0];
    if (!giaoDich) throw new Error("Không tìm thấy giao dịch");

    // Nếu trạng thái chuyển sang THANH_CONG và trước đó chưa phải THANH_CONG
    if (trang_thai === "THANH_CONG" && giaoDich.trang_thai !== "THANH_CONG") {
      const loaiGiaoDich = giaoDich.LoaiGiaoDich || giaoDich.loai_giao_dich || "";
      
      // Nếu là nạp tiền: cộng tiền vào ví
      if (loaiGiaoDich === "nap" || loaiGiaoDich === "nạp") {
        await db.execute("UPDATE vi SET SoDu = SoDu + ? WHERE NguoiDungID = ?", [
          giaoDich.so_tien,
          giaoDich.user_id,
        ]);

        // Tạo thông báo Nạp tiền thành công
        try {
          const ThongBaoService = require('../services/ThongBaoService');
          const formattedMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(giaoDich.so_tien);
          await ThongBaoService.guiThongBao(
            giaoDich.user_id,
            'nap_tien',
            'Nạp tiền vào ví thành công',
            `Số tiền ${formattedMoney} đã được cộng vào Ví Hommy của bạn. Mã giao dịch: ${giaoDich.ma_giao_dich || id}`,
            { type: 'tai-chinh', subType: 'nap_tien', amount: giaoDich.so_tien, maGiaoDich: giaoDich.ma_giao_dich, icon: '💰', url: '/vi' },
            '/vi'
          );
        } catch (notifErr) {
          console.warn('[LichSuViModel] Lỗi gửi thông báo nạp tiền:', notifErr.message);
        }
      }
      
      // Nếu là rút tiền: trừ tiền từ ví
      if (loaiGiaoDich === "rut" || loaiGiaoDich === "rút") {
        // Kiểm tra số dư trước khi trừ
        const [viRows] = await db.execute(
          "SELECT SoDu FROM vi WHERE NguoiDungID = ?",
          [giaoDich.user_id]
        );
        
        if (viRows.length === 0) {
          throw new Error("Không tìm thấy ví của người dùng");
        }
        
        const soDuHienTai = Number(viRows[0].SoDu || 0);
        if (soDuHienTai < giaoDich.so_tien) {
          throw new Error("Số dư ví không đủ để rút tiền");
        }
        
        await db.execute("UPDATE vi SET SoDu = SoDu - ? WHERE NguoiDungID = ?", [
          giaoDich.so_tien,
          giaoDich.user_id,
        ]);
      }
    }

    // Tiếp tục cập nhật các trường còn lại
    const fields = [];
    const params = [];
    if (user_id !== undefined) {
      fields.push("user_id = ?");
      params.push(user_id);
    }
    if (ma_giao_dich !== undefined) {
      fields.push("ma_giao_dich = ?");
      params.push(ma_giao_dich);
    }
    if (so_tien !== undefined) {
      fields.push("so_tien = ?");
      params.push(so_tien);
    }
    if (trang_thai !== undefined) {
      fields.push("trang_thai = ?");
      params.push(trang_thai);
    }
    if (fields.length === 0) throw new Error("Không có trường nào để cập nhật");
    params.push(id);
    const sql = `UPDATE lich_su_vi SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await db.execute(sql, params);
    return result;
  }

  static async layTatCa() {
    const [rows] = await db.execute(
      "SELECT id, user_id, ma_giao_dich, so_tien, trang_thai, LoaiGiaoDich, thoi_gian FROM lich_su_vi ORDER BY thoi_gian DESC"
    );
    return rows;
  }

  static async layTheoUser(user_id) {
    const [rows] = await db.execute(
      "SELECT id, user_id, ma_giao_dich, so_tien, trang_thai, LoaiGiaoDich, thoi_gian FROM lich_su_vi WHERE user_id = ? ORDER BY thoi_gian DESC",
      [user_id]
    );
    return rows;
  }
}

module.exports = LichSuViModel;

