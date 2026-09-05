import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import axios from "axios";
import "./thanhtoancoc.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Tạo chuỗi số ngẫu nhiên 5 chữ số
function randomDigits(n = 5) {
  return Math.floor(Math.random() * Math.pow(10, n))
    .toString()
    .padStart(n, "0");
}

export default function ThanhToanCoc() {
  const q = useQuery();
  const navigate = useNavigate();

  const acc = q.get("acc") ?? "80349195777";
  const bank = q.get("bank") ?? "TPBank";
  const amount = q.get("amount") ?? "2000";
  const order = q.get("order") ?? "10";

  // Lấy id tin để điều hướng về chi tiết
  const tinId = q.get("tinId") ?? q.get("tin") ?? q.get("tinDangId") ?? order; // ← Ưu tiên tinId, fallback order
  const detailPath = tinId ? `/tin-dang/${tinId}` : null;

  // des gốc (VD: DK10)
  const baseDes = q.get("des") ?? `DK${order}`;
  // thêm 5 số random nhưng KHÔNG có dấu "_"
  const [des] = useState(`${baseDes}${randomDigits(5)}`);

  // API poll
  const pollUrl = "https://tienchung9atm.id.vn/get_logs.php";
  const pollIntervalMs = 3000;

  // Tạo URL QR thanh toán
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(
    acc
  )}&bank=${encodeURIComponent(bank)}&amount=${encodeURIComponent(
    amount
  )}&des=${encodeURIComponent(des)}`;

  const [paid, setPaid] = useState(false);
  const [status, setStatus] = useState("⏳ Đang chờ người dùng thanh toán...");
  const intervalRef = useRef(null);

  const handlePaid = () => {
    if (!window.confirm("Xác nhận bạn đã chuyển tiền đặt cọc?")) return;
    alert("Đã ghi nhận xác nhận thủ công của bạn.");
    // Điều hướng về trang chi tiết tin
    if (detailPath) navigate(detailPath);
    else navigate(-1);
  };

  useEffect(() => {
    const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

    const expected = normalize(des);

    const checkPayment = async () => {
      try {
        const res = await axios.get(pollUrl);
        const data = res.data;

        if (!data?.items) return;

        const found = data.items.some((item) => {
          const content = normalize(
            item.payload?.transaction_content || item.payload?.content
          );
          return content.includes(expected); // kiểu LIKE %expected%
        });

        console.log("[Poll check]", { found, expected });

        if (found) {
          setPaid(true);
          setStatus("✅ Thanh toán thành công!");
          clearInterval(intervalRef.current);
          alert(`Thanh toán ${des} thành công!`);
          // Điều hướng về trang chi tiết tin
          if (detailPath) navigate(detailPath);
          else navigate(-1);
        } else {
          setStatus("⏳ Đang chờ người dùng thanh toán...");
        }
      } catch (err) {
        console.error("Lỗi khi poll API:", err);
        setStatus("⚠️ Lỗi kết nối máy chủ.");
      }
    };

    checkPayment();
    intervalRef.current = setInterval(checkPayment, pollIntervalMs);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [des, pollUrl, navigate, detailPath]);

  return (
    <div className="thanhtoancoc-page">
      <Header />

      <main className="ttc-container">
        <h3>Thanh toán đặt cọc</h3>

        <div className="ttc-info">
          <div>
            Đơn hàng: <strong>{order}</strong>
          </div>
          <div>
            Ngân hàng: <strong>{bank}</strong>
          </div>
          <div>
            Số tài khoản: <strong>{acc}</strong>
          </div>
          <div>
            Số tiền: <strong>{Number(amount).toLocaleString("vi-VN")} đ</strong>
          </div>
          <div>
            Nội dung chuyển khoản: <strong>{des}</strong>
          </div>
        </div>

        <div className="ttc-qr-wrap">
          <img src={qrUrl} alt="QR thanh toán đặt cọc" className="ttc-qr" />
        </div>

        <div className="ttc-actions">
          <button
            className="btn btn-primary"
            onClick={handlePaid}
            disabled={paid}
          >
            Tôi đã thanh toán
          </button>
          <button className="btn" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            color: paid ? "green" : "#666",
          }}
        >
          {status}
        </div>
      </main>

      <Footer />
    </div>
  );
}
