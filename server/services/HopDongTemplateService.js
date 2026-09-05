/**
 * @fileoverview Service dựng nội dung hợp đồng từ mẫu + dữ liệu runtime
 */

const MauHopDongModel = require('../models/MauHopDongModel');
const TinDangModel = require('../models/TinDangModel');
const NguoiDungModel = require('../models/NguoiDungModel');

class HopDongTemplateService {
  /**
   * Dựng dữ liệu preview hợp đồng
   * @param {Object} params
   * @param {number} params.mauHopDongId
   * @param {number} params.tinDangId
   * @param {number} params.khachHangId
   * @param {Object} [params.overrides]
   * @returns {Promise<Object>}
   */
  static async buildPreview({ mauHopDongId, tinDangId, khachHangId, overrides = {} }) {
    if (!tinDangId) {
      throw new Error('Thiếu TinDangID');
    }

    const template =
      (mauHopDongId && await MauHopDongModel.layTheoId(mauHopDongId)) ||
      await MauHopDongModel.layMauHoatDongMoiNhat();

    if (!template) {
      throw new Error('Không tìm thấy mẫu hợp đồng hợp lệ');
    }

    const tinDang = await TinDangModel.layThongTinChoHopDong(tinDangId);
    if (!tinDang) {
      throw new Error('Tin đăng không tồn tại hoặc đã bị lưu trữ');
    }

    const benAOverrides = overrides.benA || {};
    const benBOverrides = overrides.benB || {};
    const batDongSanOverrides = overrides.batDongSan || {};
    const chiPhiOverrides = overrides.chiPhi || {};

    const chuDuAn = {
      hoTen: benAOverrides.hoTen || tinDang.TenChuDuAn,
      ngaySinh: benAOverrides.ngaySinh || tinDang.NgaySinhChuDuAn,
      cccd: benAOverrides.cccd || tinDang.SoCCCDChuDuAn,
      ngayCap: benAOverrides.ngayCap || tinDang.NgayCapChuDuAn,
      noiCap: benAOverrides.noiCap || tinDang.NoiCapChuDuAn,
      diaChi: benAOverrides.diaChi || tinDang.DiaChiChuDuAn || tinDang.DiaChiDuAn,
      soDienThoai: benAOverrides.soDienThoai || tinDang.SoDienThoaiChuDuAn,
    };

    const khachHang = await NguoiDungModel.layHoSoHopDong(khachHangId);
    if (!khachHang) {
      throw new Error('Không tìm thấy thông tin khách hàng để điền hợp đồng');
    }

    const benB = {
      hoTen: benBOverrides.hoTen || khachHang.TenDayDu,
      ngaySinh: benBOverrides.ngaySinh || khachHang.NgaySinh,
      cccd: benBOverrides.cccd || khachHang.SoCCCD,
      ngayCap: benBOverrides.ngayCap || khachHang.NgayCapCCCD,
      noiCap: benBOverrides.noiCap || khachHang.NoiCapCCCD,
      diaChi: benBOverrides.diaChi || khachHang.DiaChi,
      soDienThoai: benBOverrides.soDienThoai || khachHang.SoDienThoai,
    };

    const giaThueMacDinh = tinDang.GiaThueThamChieu || tinDang.GiaDichVu || 0;
    const soTienCoc =
      chiPhiOverrides.soTienCoc ||
      tinDang.SoTienCocAnNinhMacDinh ||
      Math.round(giaThueMacDinh);

    const batDongSan = {
      diaChi: batDongSanOverrides.diaChi || tinDang.DiaChiDuAn,
      dienTich: batDongSanOverrides.dienTich || tinDang.DienTichThamChieu,
      tenDuAn: tinDang.TenDuAn,
      tenTinDang: tinDang.TieuDe,
      tenPhong: batDongSanOverrides.tenPhong || null,
    };

    const chiPhi = {
      giaThue: chiPhiOverrides.giaThue || giaThueMacDinh,
      giaDien: chiPhiOverrides.giaDien || tinDang.GiaDien,
      giaNuoc: chiPhiOverrides.giaNuoc || tinDang.GiaNuoc,
      giaDichVu: chiPhiOverrides.giaDichVu || tinDang.GiaDichVu,
      moTaDichVu: chiPhiOverrides.moTaDichVu || tinDang.MoTaGiaDichVu,
      soTienCoc,
    };

    const payload = {
      benA: {
        ...chuDuAn,
        ngaySinhHienThi: this._formatDate(chuDuAn.ngaySinh),
        ngayCapHienThi: this._formatDate(chuDuAn.ngayCap),
      },
      benB: {
        ...benB,
        ngaySinhHienThi: this._formatDate(benB.ngaySinh),
        ngayCapHienThi: this._formatDate(benB.ngayCap),
      },
      batDongSan,
      chiPhi: {
        ...chiPhi,
        hienThi: {
          giaThue: this._currency(chiPhi.giaThue),
          giaDien: this._currency(chiPhi.giaDien, 'VNĐ/kWh'),
          giaNuoc: this._currency(chiPhi.giaNuoc, 'VNĐ/m³'),
          giaDichVu: this._currency(chiPhi.giaDichVu, 'VNĐ/tháng'),
          soTienCoc: this._currency(chiPhi.soTienCoc),
          soTienCocBangChu: this._amountInWords(chiPhi.soTienCoc),
        },
      },
      tinDang: {
        tinDangId: tinDang.TinDangID,
        trangThai: tinDang.TrangThai,
        chinhSachCoc: tinDang.TenChinhSach,
      },
    };

    const renderedHtml = this._applyTemplate(template.NoiDungMau, payload);

    return {
      template: {
        id: template.MauHopDongID,
        tieuDe: template.TieuDe,
        phienBan: template.PhienBan,
        trangThai: template.TrangThai,
      },
      tinDang: {
        tinDangId: tinDang.TinDangID,
        tenTinDang: tinDang.TieuDe,
        tenDuAn: tinDang.TenDuAn,
      },
      payload,
      templateHtml: template.NoiDungMau,
      renderedHtml,
    };
  }

  static _applyTemplate(html, payload) {
    if (!html) {
      return '';
    }

    let rendered = html;
    const { benA, benB, batDongSan, chiPhi } = payload;
    const benCName = 'Nguyễn Tiến Chung';

    rendered = this._replaceOnce(
      rendered,
      'Họ và tên (chủ trọ): ………………………………………',
      `Họ và tên (chủ trọ): <strong>${this._safeText(benA.hoTen)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Ngày sinh: …../…../….',
      `Ngày sinh: <strong>${this._safeText(benA.ngaySinhHienThi)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'CCCD / CMND số: ………………… Ngày cấp: ……… Nơi cấp: ……………',
      `CCCD / CMND số: <strong>${this._safeText(benA.cccd)}</strong> Ngày cấp: <strong>${this._safeText(benA.ngayCapHienThi)}</strong> Nơi cấp: <strong>${this._safeText(benA.noiCap)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Địa chỉ thường trú: …………………………………………………',
      `Địa chỉ thường trú: <strong>${this._safeText(benA.diaChi)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Số điện thoại: ……………………………',
      `Số điện thoại: <strong>${this._safeText(benA.soDienThoai)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Họ và tên: ………………………………………',
      `Họ và tên: <strong>${this._safeText(benB.hoTen)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Ngày sinh: …../…../….',
      `Ngày sinh: <strong>${this._safeText(benB.ngaySinhHienThi)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'CCCD / CMND số: ………………… Ngày cấp: ……… Nơi cấp: …………',
      `CCCD / CMND số: <strong>${this._safeText(benB.cccd)}</strong> Ngày cấp: <strong>${this._safeText(benB.ngayCapHienThi)}</strong> Nơi cấp: <strong>${this._safeText(benB.noiCap)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Địa chỉ thường trú: …………………………………………………',
      `Địa chỉ thường trú: <strong>${this._safeText(benB.diaChi)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Số điện thoại: ……………………………',
      `Số điện thoại: <strong>${this._safeText(benB.soDienThoai)}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'tại địa chỉ: ……………………………..',
      `tại địa chỉ: <strong>${this._safeText(batDongSan.diaChi)}</strong>`
    );

    if (batDongSan.tenPhong) {
      rendered = this._replaceOnce(
        rendered,
        '/ số phòng: .....',
        `/ số phòng: <strong>${this._safeText(batDongSan.tenPhong)}</strong>`
      );
    }

    rendered = this._replaceOnce(
      rendered,
      'Diện tích nhà / phòng: ……… m²',
      `Diện tích nhà / phòng: <strong>${this._safeText(this._formatArea(batDongSan.dienTich))}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Tiền thuê nhà: <strong>…….. VNĐ / tháng</strong>',
      `Tiền thuê nhà: <strong>${this._safeText(chiPhi.hienThi.giaThue || 'Đang cập nhật')}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Chi phí điện: …….. VNĐ / kWh (hoặc theo thỏa thuận / bảng bậc).',
      `Chi phí điện: <strong>${this._safeText(chiPhi.hienThi.giaDien || 'Theo thỏa thuận')}</strong> (hoặc theo thỏa thuận / bảng bậc).`
    );

    rendered = this._replaceOnce(
      rendered,
      'Chi phí nước: …….. VNĐ / m³ (hoặc theo thỏa thuận).',
      `Chi phí nước: <strong>${this._safeText(chiPhi.hienThi.giaNuoc || 'Theo thỏa thuận')}</strong> (hoặc theo thỏa thuận).`
    );

    rendered = this._replaceOnce(
      rendered,
      'Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: …….. VNĐ / tháng',
      `Chi phí phụ (nếu có): ví dụ giữ xe, rác, vệ sinh, wifi, v.v.: <strong>${this._safeText(chiPhi.hienThi.giaDichVu || 'Theo thỏa thuận')}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      'Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>…….. VNĐ</strong>',
      `Bên B đặt cọc cho Bên A qua Bên C (Hommy) số tiền: <strong>${this._safeText(chiPhi.hienThi.soTienCoc || 'Đang cập nhật')}</strong>`
    );

    rendered = this._replaceOnce(
      rendered,
      '(bằng chữ: …………………………)',
      `(bằng chữ: ${this._safeText(chiPhi.hienThi.soTienCocBangChu)})`
    );

    // Thay thế chữ ký Bên A (chủ trọ)
    rendered = rendered.replace(
      /<p id="chukichutro">[^<]*<\/p>/,
      `<p id="chukichutro"><strong>${this._safeText(benA.hoTen)}</strong></p>`
    );

    // Thay thế chữ ký Bên B (người thuê)
    rendered = rendered.replace(
      /<p id="chukibenb">[^<]*<\/p>/,
      `<p id="chukibenb"><strong>${this._safeText(benB.hoTen)}</strong></p>`
    );

    return rendered;
  }

  static _replaceOnce(text, searchValue, replacement) {
    if (!text || !searchValue) {
      return text;
    }
    const index = text.indexOf(searchValue);
    if (index === -1) {
      return text;
    }
    return `${text.slice(0, index)}${replacement}${text.slice(index + searchValue.length)}`;
  }

  static _formatDate(value) {
    if (!value) return 'Đang cập nhật';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Đang cập nhật';
    }
    return date.toLocaleDateString('vi-VN');
  }

  static _formatArea(value) {
    if (!value && value !== 0) {
      return 'Đang cập nhật';
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return 'Đang cập nhật';
    }

    return `${numeric} m²`;
  }

  static _currency(value, suffix = 'VNĐ/tháng') {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return null;
    }

    const formatted = numeric.toLocaleString('vi-VN');
    return `${formatted} ${suffix}`;
  }

  static _amountInWords(value) {
    if (value === null || value === undefined) {
      return 'Đang cập nhật';
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      return 'Đang cập nhật';
    }

    return `${numeric.toLocaleString('vi-VN')} đồng`;
  }

  static _safeText(value) {
    if (value === null || value === undefined || value === '') {
      return 'Đang cập nhật';
    }
    return value;
  }
}

module.exports = HopDongTemplateService;

