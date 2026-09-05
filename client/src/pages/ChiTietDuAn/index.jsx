import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import ListingCard from "../../components/ListingCard";
import duAnPublicApi from "../../api/duAnPublicApi";
import { useTranslation } from "../../context/LanguageContext";
import { setPageSEO } from "../../utils/seo";
import {
  FaMapMarkerAlt,
  FaBuilding,
  FaCheckCircle,
  FaPhoneAlt,
  FaArrowLeft,
  FaListUl,
  FaInfoCircle,
  FaRulerCombined,
  FaShieldAlt,
  FaCalendarAlt,
  FaHandshake
} from "react-icons/fa";
import "./ChiTietDuAn.css";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
];

function ChiTietDuAn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [duan, setDuan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await duAnPublicApi.getById(id);
      if (res?.data?.success && res.data.data) {
        const data = res.data.data;
        setDuan(data);
        setPageSEO({
          title: `${data.TenDuAn} - Chi tiết dự án BĐS Hommy`,
          description: data.DiaChi || `Thông tin chi tiết dự án bất động sản ${data.TenDuAn} tại Hommy`,
        });
      } else {
        setError("Không tìm thấy thông tin dự án");
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin dự án:", err);
      setError(err.response?.data?.message || "Lỗi khi tải thông tin chi tiết dự án");
    } finally {
      setLoading(false);
    }
  };

  const translateStatus = (status) => {
    if (!status) return "Đang mở bán";
    const cleanStatus = status.trim().toUpperCase();
    if (cleanStatus === "HOẠT ĐỘNG" || cleanStatus === "ACTIVE") return "Đang mở bán";
    if (cleanStatus === "LƯU TRỮ" || cleanStatus === "ARCHIVED") return "Lưu trữ";
    if (cleanStatus === "NGỪNG HOẠT ĐỘNG" || cleanStatus === "INACTIVE") return "Tạm ngưng";
    return status;
  };

  if (loading) {
    return (
      <div className="chi-tiet-du-an-page">
        <Header />
        <main className="chi-tiet-du-an__main" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p style={{ color: "#64748b", fontSize: "1.1rem" }}>{t("projects.loading") || "Đang tải thông tin chi tiết dự án bất động sản..."}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !duan) {
    return (
      <div className="chi-tiet-du-an-page">
        <Header />
        <main className="chi-tiet-du-an__main" style={{ padding: "60px 20px" }}>
          <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ padding: "40px", background: "#fff", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <h2 style={{ color: "#ef4444", marginBottom: "16px" }}>{error || "Dự án không tồn tại"}</h2>
              <button
                type="button"
                onClick={() => navigate("/du-an")}
                className="contact-btn contact-btn--secondary"
                style={{ width: "auto", display: "inline-flex", padding: "10px 20px" }}
              >
                <FaArrowLeft /> Quay lại danh sách dự án
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse ThongTinMoRong JSON
  let parsedMeta = {};
  try {
    if (duan.ThongTinMoRong) {
      parsedMeta = typeof duan.ThongTinMoRong === "string"
        ? JSON.parse(duan.ThongTinMoRong)
        : duan.ThongTinMoRong;
    }
  } catch (e) {
    console.error("Lỗi parse ThongTinMoRong:", e);
  }

  const projectImg = parsedMeta.image || parsedMeta.img || parsedMeta.AlbumAnhURL || FALLBACK_IMAGES[0];
  const galleryImgs = [
    projectImg,
    parsedMeta.MatBangTongTheURL || FALLBACK_IMAGES[1],
    FALLBACK_IMAGES[2]
  ];

  const tinDangs = Array.isArray(duan.tinDangs) ? duan.tinDangs : [];

  return (
    <div className="chi-tiet-du-an-page">
      <Header />

      <main className="chi-tiet-du-an__main">
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "30px 20px" }}>
          
          {/* Breadcrumb Navigation */}
          <div className="chi-tiet-du-an__breadcrumb">
            <Link to="/">{t("header.home") || "Trang chủ"}</Link>
            <span className="sep">/</span>
            <Link to="/du-an">{t("projects.title") || "Dự án bất động sản"}</Link>
            <span className="sep">/</span>
            <span style={{ color: "#0f172a", fontWeight: "600" }}>{duan.TenDuAn}</span>
          </div>

          {/* Hero Card with Photo Gallery */}
          <div className="chi-tiet-du-an__hero-card">
            <div className="chi-tiet-du-an__gallery">
              <div className="gallery-main">
                <img src={galleryImgs[0]} alt={duan.TenDuAn} />
              </div>
              <div className="gallery-thumbs">
                <div className="gallery-thumb-item">
                  <img src={galleryImgs[1]} alt={`${duan.TenDuAn} - 2`} />
                </div>
                <div className="gallery-thumb-item">
                  <img src={galleryImgs[2]} alt={`${duan.TenDuAn} - 3`} />
                </div>
              </div>
            </div>

            <div className="chi-tiet-du-an__hero-content">
              <div className="chi-tiet-du-an__header-row">
                <div>
                  <h1 className="chi-tiet-du-an__title">{duan.TenDuAn}</h1>
                  <div className="chi-tiet-du-an__address">
                    <FaMapMarkerAlt style={{ color: "#ef4444" }} />
                    <span>{duan.DiaChi || "Chưa cập nhật địa chỉ"}</span>
                  </div>
                </div>
                <span className="chi-tiet-du-an__status-badge">
                  <FaCheckCircle /> {translateStatus(duan.TrangThai)}
                </span>
              </div>

              {/* Quick Stats Bar - Dedicated to Real Estate Projects */}
              <div className="chi-tiet-du-an__stats-bar">
                <div className="stat-box">
                  <div className="stat-box__icon"><FaBuilding /></div>
                  <div>
                    <div className="stat-box__label">Quy mô / Block</div>
                    <div className="stat-box__value">{parsedMeta.SoBlock || duan.SoBlock ? `${parsedMeta.SoBlock || duan.SoBlock} Tòa/Block` : 'Khu đô thị / Dự án BĐS'}</div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-box__icon" style={{ background: "#dcfce7", color: "#16a34a" }}><FaRulerCombined /></div>
                  <div>
                    <div className="stat-box__label">Tổng diện tích</div>
                    <div className="stat-box__value">{parsedMeta.TongDienTich || duan.TongDienTich ? `${parsedMeta.TongDienTich || duan.TongDienTich} m²` : 'Khuôn viên rộng rãi'}</div>
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-box__icon" style={{ background: "#fef3c7", color: "#d97706" }}><FaListUl /></div>
                  <div>
                    <div className="stat-box__label">BĐS đang mở bán / thuê</div>
                    <div className="stat-box__value">{tinDangs.length} tin đăng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Details Left, Sidebar Right */}
          <div className="chi-tiet-du-an__grid">
            
            {/* Left Content */}
            <div className="chi-tiet-du-an__content-left">
              
              {/* Project Description & Overview */}
              <div className="chi-tiet-du-an__section-card">
                <h2 className="chi-tiet-du-an__section-title">
                  <FaInfoCircle style={{ color: "#3b82f6" }} /> Tổng quan dự án bất động sản
                </h2>
                
                <p style={{ lineHeight: "1.7", color: "#334155", fontSize: "1rem", marginBottom: "20px" }}>
                  {parsedMeta.description || parsedMeta.MoTa || `Dự án bất động sản ${duan.TenDuAn} tọa lạc tại vị trí đắc địa tại ${duan.DiaChi || "trung tâm"}. Dự án quy hoạch đồng bộ, hạ tầng hiện đại, sở hữu môi trường sống xanh và tiện ích tiêu chuẩn mang lại giá trị an cư & đầu tư bền vững.`}
                </p>

                <div className="features-grid">
                  <div className="feature-item">
                    <FaBuilding />
                    <span>Chủ đầu tư / Phát triển: {duan.TenChuDuAn || "Đại diện dự án Hommy"}</span>
                  </div>
                  <div className="feature-item">
                    <FaShieldAlt />
                    <span>Pháp lý dự án: {parsedMeta.PhapLy || "Sổ hồng sở hữu lâu dài"}</span>
                  </div>
                  <div className="feature-item">
                    <FaCalendarAlt />
                    <span>Tiến độ bàn giao: {parsedMeta.TienDo || "Đã sẵn sàng bàn giao / Đang mở bán"}</span>
                  </div>
                  <div className="feature-item">
                    <FaHandshake />
                    <span>An ninh & Quản lý: {duan.PhuongThucVao || "Bảo vệ 24/7 / Thẻ từ an ninh"}</span>
                  </div>
                </div>
              </div>

              {/* Real Estate Listings in this Project */}
              <div className="chi-tiet-du-an__section-card">
                <h2 className="chi-tiet-du-an__section-title">
                  <FaBuilding style={{ color: "#10b981" }} /> Bất động sản đang mua bán / cho thuê tại dự án ({tinDangs.length})
                </h2>

                {tinDangs.length === 0 ? (
                  <div style={{ padding: "30px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
                    Hiện tại chưa có tin đăng công khai trực tiếp cho dự án này.
                  </div>
                ) : (
                  <div className="project-listings-grid">
                    {tinDangs.map((item) => (
                      <ListingCard
                        key={item.TinDangID}
                        tinDang={item}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Sidebar: Contact & Assistance */}
            <div className="chi-tiet-du-an__sidebar">
              <div className="contact-sidebar-card">
                <h3 className="contact-card__title">Liên hệ Quản lý & Tư vấn Dự án</h3>

                <div className="contact-card__owner">
                  <div className="owner-avatar">
                    {(duan.TenChuDuAn || "H").charAt(0).toUpperCase()}
                  </div>
                  <div className="owner-info">
                    <div className="owner-info__name">{duan.TenChuDuAn || "Ban Quản Lý Dự Án"}</div>
                    <div className="owner-info__role">Đại diện dự án Hommy</div>
                  </div>
                </div>

                <a href={`tel:${duan.SdtChuDuAn || "0349195610"}`} className="contact-btn contact-btn--primary">
                  <FaPhoneAlt /> Gọi ngay: {duan.SdtChuDuAn || "0349195610"}
                </a>

                <button
                  type="button"
                  className="contact-btn contact-btn--secondary"
                  onClick={() => navigate("/cuochencuatoi")}
                >
                  <FaCalendarAlt /> Đặt lịch tham quan dự án
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ChiTietDuAn;
