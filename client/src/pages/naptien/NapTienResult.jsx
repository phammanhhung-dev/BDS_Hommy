import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";

const NapTienResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check VNPAY
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    // Check MoMo
    const resultCode = searchParams.get("resultCode");

    if (vnp_ResponseCode) {
      if (vnp_ResponseCode === "00") {
        setStatus("success");
        setMessage("Giao dịch VNPAY thành công!");
      } else {
        setStatus("error");
        setMessage("Giao dịch VNPAY thất bại hoặc đã bị hủy.");
      }
    } else if (resultCode) {
      if (resultCode === "0") {
        setStatus("success");
        setMessage("Giao dịch MoMo thành công!");
      } else {
        setStatus("error");
        setMessage("Giao dịch MoMo thất bại hoặc đã bị hủy.");
      }
    } else {
      setStatus("error");
      setMessage("Không tìm thấy thông tin giao dịch.");
    }
  }, [searchParams]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f8fafc"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        textAlign: "center",
        maxWidth: "400px",
        width: "100%"
      }}>
        {status === "success" ? (
          <HiCheckCircle style={{ color: "#10b981", fontSize: "80px", margin: "0 auto 20px" }} />
        ) : (
          <HiXCircle style={{ color: "#ef4444", fontSize: "80px", margin: "0 auto 20px" }} />
        )}
        
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
          {status === "success" ? "Giao dịch thành công" : "Giao dịch thất bại"}
        </h2>
        
        <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "1rem" }}>
          {message}
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NapTienResult;
