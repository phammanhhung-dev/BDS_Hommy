import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import viApi from "../../api/viApi";
import lichSuViApi from "../../api/lichSuViApi";
import { HiOutlineCreditCard, HiOutlinePlus, HiOutlineMinus } from "react-icons/hi";
import NapTienPage from "../naptien/index";
import axiosClient from "../../api/axiosClient"; // Import trực tiếp để gọi API mới
import "./vi.css";

function ViPage() {
  const [soDu, setSoDu] = useState(0);
  const [lichSu, setLichSu] = useState([]);
  const [yeuCauRutTien, setYeuCauRutTien] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNapTien, setShowNapTien] = useState(false);
  const [showRutTienModal, setShowRutTienModal] = useState(false);

  // State Form Rút tiền
  const [formData, setFormData] = useState({
    soTien: "",
    nganHang: "",
    soTaiKhoan: "",
    tenChuTaiKhoan: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Lấy ID user từ localStorage hoặc context (giả sử đã login)
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id || user?.NguoiDungID;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (userId) {
        // 1. Lấy số dư
        const resVi = await viApi.getByUser(userId);
        const viData = resVi?.data?.data;
        
        // Backend trả về object (rows[0]) hoặc array tùy endpoint, xử lý cả 2
        if (Array.isArray(viData) && viData.length > 0) {
            setSoDu(parseFloat(viData[0].SoDu));
        } else if (viData && typeof viData === 'object') {
            setSoDu(parseFloat(viData.SoDu));
        } else {
            setSoDu(0);
        }

        // 2. Lấy lịch sử giao dịch
        const resLS = await lichSuViApi.getByUser(userId);
        if (resLS?.data?.data) {
          setLichSu(resLS.data.data);
        }

        // 3. Lấy lịch sử yêu cầu rút tiền
        try {
            const resYC = await axiosClient.get('/rut-tien/cua-toi');
            if (resYC?.data?.data) {
                setYeuCauRutTien(resYC.data.data);
            }
        } catch (e) {
            console.error("Lỗi lấy lịch sử rút tiền", e);
        }
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu ví", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRutTienSubmit = async (e) => {
    e.preventDefault();
    if (!formData.soTien || !formData.nganHang || !formData.soTaiKhoan || !formData.tenChuTaiKhoan) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
    }

    if (parseFloat(formData.soTien) > soDu) {
        alert("Số dư không đủ");
        return;
    }

    setSubmitting(true);
    try {
        await axiosClient.post('/rut-tien', formData);
        alert("Gửi yêu cầu rút tiền thành công!");
        setShowRutTienModal(false);
        setFormData({ soTien: "", nganHang: "", soTaiKhoan: "", tenChuTaiKhoan: "" });
        fetchData(); // Reload data
    } catch (error) {
        alert(error.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu");
    } finally {
        setSubmitting(false);
    }
  };

  if (showNapTien) {
    return (
      <div className="vi__naptien-wrapper">
        <NapTienPage onBack={() => { setShowNapTien(false); fetchData(); }} />
        <button className="vi__back-btn" onClick={() => { setShowNapTien(false); fetchData(); }}>
          ← Quay lại Ví
        </button>
      </div>
    );
  }

  return (
    <div className="vi">
      
      <div className="vi__header">
        <div className="vi__icon">💰</div>
        <div className="vi__balance-label">Số dư khả dụng</div>
        <div className="vi__balance">
          {soDu.toLocaleString()} ₫
        </div>
      </div>

      <div className="vi__quick-actions">
        <button 
          className="vi__action-btn" 
          onClick={() => setShowNapTien(true)}
        >
          <HiOutlinePlus /> Nạp tiền
        </button>
        <button 
          className="vi__action-btn"
          onClick={() => setShowRutTienModal(true)}
        >
          <HiOutlineMinus /> Rút tiền
        </button>
      </div>

      <div className="vi__history-section">
        <div className="vi__history-title">Lịch sử giao dịch</div>
        <ul className="vi__history-list">
          {loading ? (
            <li className="vi__loading">Đang tải...</li>
          ) : lichSu.length === 0 ? (
            <li className="vi__empty">Chưa có giao dịch nào</li>
          ) : (
            lichSu.map((item, idx) => {
              const isPlus = item.LoaiGiaoDich === "nap" || item.LoaiGiaoDich === "hoan_coc";
              let label = "Rút tiền";
              if (item.LoaiGiaoDich === "nap") label = "Nạp tiền";
              else if (item.LoaiGiaoDich === "hoan_coc") label = "Hoàn cọc";
              else if (item.LoaiGiaoDich === "rut_tien") label = "Rút tiền";
              
              return (
                <li
                  key={item.id}
                  className={`vi__history-item vi__history-item--${
                    isPlus ? "plus" : "minus"
                  }`}
                >
                  <div className="vi__history-info">
                    <span className="vi__history-type">
                      {label}
                    </span>
                    <span className="vi__history-date">
                      {new Date(item.thoi_gian).toLocaleString()}
                    </span>
                  </div>
                  <div className="vi__history-amount">
                    {isPlus ? "+" : "-"}
                    {Number(item.so_tien).toLocaleString()} ₫
                  </div>
                  <div className="vi__history-desc">
                    Mã GD: {item.ma_giao_dich} | Trạng thái: {item.trang_thai}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* List Yêu Cầu Rút Tiền */}
      {yeuCauRutTien.length > 0 && (
        <div className="vi__history-section">
            <div className="vi__history-title">Yêu cầu rút tiền</div>
            <ul className="vi__history-list">
                {yeuCauRutTien.map((yc) => (
                    <li key={yc.YeuCauID} className="vi__history-item">
                        <div className="vi__history-info">
                            <span className="vi__history-type">{yc.NganHang}</span>
                            <span className={`vi-status-badge vi-status-badge--${yc.TrangThai}`}>
                                {yc.TrangThai === 'ChoXuLy' ? 'Chờ xử lý' : 
                                 yc.TrangThai === 'DaDuyet' ? 'Đã duyệt' : 'Từ chối'}
                            </span>
                        </div>
                        <div className="vi__history-amount" style={{ color: '#ff5252' }}>
                            -{Number(yc.SoTien).toLocaleString()} ₫
                        </div>
                        <div className="vi__history-desc">
                            STK: {yc.SoTaiKhoan} ({yc.TenChuTaiKhoan})
                        </div>
                        <div className="vi__history-desc">
                           {new Date(yc.TaoLuc).toLocaleString()}
                        </div>
                        {yc.GhiChu && (
                            <div className="vi__history-desc" style={{ color: 'red', fontStyle: 'italic' }}>
                                Ghi chú: {yc.GhiChu}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
      )}

      {/* Modal Rút Tiền */}
      {showRutTienModal && (
        <div className="vi-modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) setShowRutTienModal(false);
        }}>
            <div className="vi-modal">
                <div className="vi-modal__header">
                    <span>Rút tiền về ngân hàng</span>
                    <button className="vi-modal__close" onClick={() => setShowRutTienModal(false)}>×</button>
                </div>
                <form onSubmit={handleRutTienSubmit}>
                    <div className="vi-modal__body">
                        <div className="vi-form-group">
                            <label className="vi-form-label">Ngân hàng</label>
                            <input 
                                type="text" 
                                className="vi-form-input" 
                                name="nganHang"
                                placeholder="VD: Vietcombank, MBBank..."
                                value={formData.nganHang}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="vi-form-group">
                            <label className="vi-form-label">Số tài khoản</label>
                            <input 
                                type="text" 
                                className="vi-form-input" 
                                name="soTaiKhoan"
                                placeholder="Số tài khoản nhận tiền"
                                value={formData.soTaiKhoan}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="vi-form-group">
                            <label className="vi-form-label">Tên chủ tài khoản</label>
                            <input 
                                type="text" 
                                className="vi-form-input" 
                                name="tenChuTaiKhoan"
                                placeholder="Viết hoa không dấu"
                                value={formData.tenChuTaiKhoan}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="vi-form-group">
                            <label className="vi-form-label">Số tiền muốn rút (VNĐ)</label>
                            <input 
                                type="number" 
                                className="vi-form-input" 
                                name="soTien"
                                placeholder="Nhập số tiền"
                                min="10000"
                                value={formData.soTien}
                                onChange={handleInputChange}
                                required
                            />
                            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                                Số dư hiện tại: {soDu.toLocaleString()} ₫
                            </small>
                        </div>
                    </div>
                    <div className="vi-modal__footer">
                        <button 
                            type="button" 
                            className="vi-btn vi-btn--secondary" 
                            onClick={() => setShowRutTienModal(false)}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="vi-btn vi-btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}

export default ViPage;