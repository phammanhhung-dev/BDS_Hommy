import React, { useState, useEffect, useRef } from "react";
import "./naptien.css";
import lichSuViApi from "../../api/lichSuViApi";
import axios from "axios";
import { useToast, ToastContainer } from "../../components/Toast/Toast";

// Tạo chuỗi số ngẫu nhiên 5 chữ số
function randomDigits(n = 5) {
  return Math.floor(Math.random() * Math.pow(10, n))
    .toString()
    .padStart(n, "0");
}

const NapTienPage = ({ onBack }) => {
  const [amount, setAmount] = useState("");
  const [orderId, setOrderId] = useState(null); // ID đơn hàng đã tạo
  const [des, setDes] = useState(""); // Nội dung chuyển khoản (có random)
  const [paid, setPaid] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  
  // Toast notification
  const { toasts, showToast, removeToast } = useToast();

  // Thông tin tài khoản mẫu
  const acc = "80349195777";
  const bank = "TPBank";

  // API poll để kiểm tra thanh toán
  const pollUrl = "https://tienchung9atm.id.vn/get_logs.php";
  const pollIntervalMs = 3000;

  // Link QR sepay đúng chuẩn
  const qrUrl = amount && des
    ? `https://qr.sepay.vn/img?acc=${encodeURIComponent(
        acc
      )}&bank=${encodeURIComponent(bank)}&amount=${encodeURIComponent(
        amount
      )}&des=${encodeURIComponent(des)}`
    : "";

  // Tạo đơn hàng nạp tiền
  const handleCreateOrder = async () => {
    if (!amount || parseFloat(amount) < 1000) {
      alert("Vui lòng nhập số tiền tối thiểu 1,000 VNĐ");
      return;
    }

    setLoading(true);
    try {
      // Lấy thông tin user
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || user.NguoiDungID || user._id;

      if (!userId) {
        alert("Vui lòng đăng nhập để nạp tiền");
        setLoading(false);
        return;
      }

      // Tạo mã giao dịch và nội dung chuyển khoản
      const maGiaoDich = `NAP_${userId}_${Date.now()}`;
      const baseDes = "Naptien";
      const randomSuffix = randomDigits(5);
      const noiDungChuyenKhoan = `${baseDes}${randomSuffix}`;
      setDes(noiDungChuyenKhoan);

      // Tạo đơn hàng với trạng thái CHO_XU_LY
      const response = await lichSuViApi.create({
        user_id: userId,
        ma_giao_dich: maGiaoDich,
        so_tien: parseFloat(amount),
        trang_thai: "CHO_XU_LY",
        LoaiGiaoDich: "nap",
      });

      if (response?.data?.success && response.data.id) {
        setOrderId(response.data.id);
        setStatus("⏳ Đã tạo đơn hàng. Vui lòng quét QR để thanh toán...");
        // Bắt đầu poll để kiểm tra thanh toán
        startPolling(noiDungChuyenKhoan, response.data.id, parseFloat(amount), userId);
      } else {
        throw new Error("Không thể tạo đơn hàng");
      }
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      alert("Lỗi tạo đơn hàng: " + (error.response?.data?.message || error.message));
      setStatus("❌ Lỗi tạo đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // Bắt đầu poll để kiểm tra thanh toán
  const startPolling = (noiDung, orderIdToUpdate, soTienNap, userIdParam) => {
    const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

    const expected = normalize(noiDung);

    const checkPayment = async () => {
      try {
        const res = await axios.get(pollUrl);
        const data = res.data;

        if (!data?.items) return;

        const found = data.items.some((item) => {
          const content = normalize(
            item.payload?.transaction_content || item.payload?.content
          );
          return content.includes(expected);
        });

        console.log("[NapTien Poll check]", { found, expected });

        if (found) {
          // Thanh toán thành công - cập nhật trạng thái
          await updateOrderStatus(orderIdToUpdate, "THANH_CONG");
          setPaid(true);
          setStatus("✅ Thanh toán thành công! Tiền đã được nạp vào ví.");
          clearInterval(intervalRef.current);
          
          // Hiển thị thông báo nạp tiền thành công
          showToast(
            `Đã nạp ${Number(soTienNap).toLocaleString("vi-VN")} ₫ vào ví`,
            "success"
          );
          
          // Tự động quay về trang ví sau 2 giây
          setTimeout(() => {
            if (onBack) {
              onBack();
            }
          }, 2000);
        } else {
          setStatus("⏳ Đang chờ thanh toán...");
        }
      } catch (err) {
        console.error("Lỗi khi poll API:", err);
        setStatus("⚠️ Đang kiểm tra thanh toán...");
      }
    };

    checkPayment();
    intervalRef.current = setInterval(checkPayment, pollIntervalMs);
  };

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = async (orderIdToUpdate, newStatus) => {
    try {
      await lichSuViApi.update(orderIdToUpdate, {
        trang_thai: newStatus,
      });
      console.log(`[NapTien] Đã cập nhật đơn hàng ${orderIdToUpdate} sang ${newStatus}`);
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleCancel = () => {
    // Nếu đang có đơn hàng và chưa thanh toán, hỏi xác nhận
    if (orderId && !paid) {
      if (!window.confirm("Bạn có chắc muốn hủy giao dịch này?")) {
        return;
      }
    }
    
    setAmount("");
    setOrderId(null);
    setDes("");
    setPaid(false);
    setStatus("");
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Quay về trang ví nếu có callback
    if (onBack && (paid || orderId)) {
      onBack();
    }
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopy = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      alert("Đã sao chép link QR!");
    }
  };

  return (
    <div className="napTien__wrapper">
      <div className="napTien__card">
        <h2 className="napTien__title">Tạo yêu cầu nạp tiền</h2>
        <div className="napTien__desc">
          1. Nhập số tiền. 2. Quét mã QR bằng app ngân hàng.
        </div>
        <div className="napTien__amount">
          {parseInt(amount || 0).toLocaleString()} VNĐ
        </div>
        {orderId && qrUrl && (
          <div className="napTien__qr">
            <img src={qrUrl} alt="QR nạp tiền" className="napTien__qr-img" />
            <button className="napTien__copy-link" onClick={handleCopy}>
              📋 Sao chép link QR
            </button>
          </div>
        )}
        <form className="napTien__form" onSubmit={(e) => e.preventDefault()}>
          <label className="napTien__form-label">
            Nhập số tiền cần nạp
            <input
              className="napTien__form-input"
              type="number"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Số tiền VNĐ"
              disabled={!!orderId || loading}
            />
          </label>
        </form>

        {/* Nút tạo đơn hàng */}
        {!orderId && (
          <div className="napTien__actions">
            <button
              className="napTien__btn napTien__btn--primary"
              onClick={handleCreateOrder}
              disabled={!amount || parseFloat(amount) < 1000 || loading}
            >
              {loading ? "Đang tạo đơn hàng..." : "Tạo đơn hàng nạp tiền"}
            </button>
            <button
              className="napTien__btn napTien__btn--cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        )}

        {/* Hiển thị trạng thái */}
        {status && (
          <div
            className="napTien__status"
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: paid ? "#d1fae5" : "#fef3c7",
              color: paid ? "#065f46" : "#92400e",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {status}
          </div>
        )}

        {/* Nút quay về sau khi đã tạo đơn hàng */}
        {orderId && (
          <div className="napTien__actions">
            <button
              className="napTien__btn napTien__btn--cancel"
              onClick={handleCancel}
            >
              Hủy giao dịch
            </button>
            <button
              className="napTien__btn napTien__btn--secondary"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  handleScrollTop();
                }
              }}
            >
              Quay về
            </button>
          </div>
        )}
        <div className="napTien__footer">
          <span>
            Ngân hàng: <strong>{bank}</strong>
          </span>{" "}
          |{" "}
          <span>
            Số tài khoản: <strong>{acc}</strong>
          </span>{" "}
          |{" "}
          <span>
            Nội dung: <strong>{des}</strong>
          </span>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default NapTienPage;