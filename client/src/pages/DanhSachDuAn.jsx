import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import duAnPublicApi from "../api/duAnPublicApi";
import { useTranslation } from "../context/LanguageContext";
import { setPageSEO } from "../utils/seo";
import {
  FaMapMarkerAlt,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from "react-icons/fa";
import "./trangchu/trangchu.css";
import "./DanhSachTinDang.css";

function DanhSachDuAn() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [duans, setDuans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const translateStatus = (status) => {
    if (!status) return t("projects.statusOpen") || "Đang mở bán";
    const cleanStatus = status.trim().toUpperCase();
    if (cleanStatus === "HOẠT ĐỘNG" || cleanStatus === "ACTIVE") {
      return t("projects.statusActive") || "Hoạt động";
    }
    if (cleanStatus === "LƯU TRỮ" || cleanStatus === "ARCHIVED") {
      return t("projects.statusArchived") || "Lưu trữ";
    }
    if (cleanStatus === "NGỪNG HOẠT ĐỘNG" || cleanStatus === "INACTIVE") {
      return t("projects.statusInactive") || "Ngừng hoạt động";
    }
    return status;
  };

  useEffect(() => {
    setPageSEO({
      title: `${t("projects.title") || "Dự án bất động sản nổi bật"} - Hommy`,
      description: t("projects.loading") || "Khám phá danh sách các dự án bất động sản nổi bật.",
    });
  }, [t]);

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const kw = qParams.get("keyword") || "";
    setKeyword(kw);
    const pageParam = parseInt(qParams.get("page"), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
      setCurrentPage(pageParam);
    } else {
      setCurrentPage(1);
    }
    fetchDuAns(kw);
  }, [location.search]);

  const fetchDuAns = async (searchKeyword = "") => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }
      const res = await duAnPublicApi.getAll(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setDuans(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setDuans(res.data);
      } else {
        setDuans([]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách dự án:", err);
      setError("Không thể tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const qParams = new URLSearchParams(location.search);
    if (keyword.trim()) {
      qParams.set("keyword", keyword.trim());
    } else {
      qParams.delete("keyword");
    }
    qParams.delete("page");
    setCurrentPage(1);
    navigate({ search: qParams.toString() ? `?${qParams.toString()}` : "" });
  };

  // Tính toán phân trang
  const totalItems = duans.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const currentDuAns = duans.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    const safePage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(safePage);
    const qParams = new URLSearchParams(location.search);
    if (safePage === 1) {
      qParams.delete("page");
    } else {
      qParams.set("page", safePage);
    }
    const newSearch = qParams.toString();
    navigate({ search: newSearch ? `?${newSearch}` : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);

    if (safeCurrentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="trangchu">
      <Header />

      <main id="main-content" style={{ backgroundColor: "#f8fafc", minHeight: "80vh", paddingBottom: "50px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
          
          <div className="section__header" style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <h1 className="section__title" style={{ fontSize: "2rem", color: "#1e293b", fontWeight: "800", margin: "0" }}>
              {t("projects.title") || "Dự án bất động sản nổi bật"}
            </h1>

            {/* Inline Project Search Bar */}
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "400px" }}>
              <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", padding: "0 10px" }}>
                <FaSearch style={{ color: "#64748b", marginRight: "8px" }} />
                <input
                  type="text"
                  placeholder={t("projects.searchPlaceholder") || "Tìm kiếm dự án..."}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ border: "none", outline: "none", width: "100%", padding: "10px 0", fontSize: "14px" }}
                />
              </div>
              <button 
                type="submit" 
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "700", cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => e.target.style.background = "#059669"}
                onMouseOut={(e) => e.target.style.background = "#10b981"}
              >
                {t("projects.searchBtn") || "Tìm"}
              </button>
            </form>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>{t("projects.loading") || "Đang tải danh sách dự án..."}</div>}
          {error && <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>{error}</div>}

          {!loading && !error && duans.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 40px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", color: "#64748b" }}>
              {t("projects.noMatch") || "Chưa có dự án nào khớp với điều kiện tìm kiếm."}
            </div>
          )}

          {!loading && !error && currentDuAns.length > 0 && (
            <div className="projects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {currentDuAns.map((duan, index) => {
                let parsedMeta = {};
                try {
                  if (duan.ThongTinMoRong) {
                    parsedMeta = typeof duan.ThongTinMoRong === 'string'
                      ? JSON.parse(duan.ThongTinMoRong)
                      : duan.ThongTinMoRong;
                  }
                } catch (e) {
                  console.error("Lỗi parse metadata dự án:", e);
                }
                const FALLBACK_PROJECT_IMAGES = [
                  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
                  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80",
                  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
                  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
                ];

                let projectImg = null;
                if (parsedMeta) {
                  const possibleImg = parsedMeta.image || parsedMeta.img || parsedMeta.AlbumAnhURL || parsedMeta.MatBangTongTheURL;
                  if (possibleImg && (
                    possibleImg.match(/\.(jpeg|jpg|gif|png|webp)/i) || 
                    possibleImg.startsWith('/uploads') ||
                    (possibleImg.startsWith('http') && !possibleImg.match(/\.html/i))
                  )) {
                    projectImg = possibleImg;
                  }
                }
                if (!projectImg) {
                  const imageSeed = duan.DuAnID ? Number(duan.DuAnID) : index;
                  projectImg = FALLBACK_PROJECT_IMAGES[imageSeed % 4];
                }

                return (
                  <Link
                    key={duan.DuAnID}
                    to={`/du-an/${duan.DuAnID}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
                  >
                    <div className="project-card" style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={(e) => e.currentTarget.style.transform = "none"}>
                      <div className="project-card__image" style={{ height: "200px", overflow: "hidden", flexShrink: 0 }}>
                        <img 
                          src={projectImg} 
                          alt={duan.TenDuAn} 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        />
                      </div>
                      <div className="project-card__content" style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <h3 className="project-card__title" style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 10px 0" }}>{duan.TenDuAn}</h3>
                          <div className="project-card__status" style={{ fontSize: "0.85rem", color: "#10b981", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase" }}>
                            {t("projects.status") || "Trạng thái"}: {translateStatus(duan.TrangThai)}
                          </div>
                        </div>
                        <div className="project-card__address" style={{ fontSize: "0.9rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginTop: "auto" }}>
                          <FaMapMarkerAlt style={{ color: "#ef4444" }} /> {duan.DiaChi || duan.ViTri || "Chưa có địa chỉ"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Phân trang (Pagination) */}
          {!loading && !error && totalPages > 1 && (
            <div className="dstd-pagination-container">
              <div className="dstd-pagination-info">
                {t("common.showing") || "Hiển thị"}{" "}
                <strong>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong>{" "}
                {t("common.of") || "trên tổng số"}{" "}
                <strong>{totalItems}</strong> {t("common.projects") || "dự án"}
              </div>

              <nav className="dstd-pagination-nav" aria-label="Phân trang danh sách dự án">
                {totalPages > 4 && (
                  <button
                    type="button"
                    className="dstd-page-btn"
                    disabled={safeCurrentPage === 1}
                    onClick={() => handlePageChange(1)}
                    title="Trang đầu tiên"
                  >
                    <FaAngleDoubleLeft size={12} />
                  </button>
                )}

                <button
                  type="button"
                  className="dstd-page-btn dstd-page-nav-btn"
                  disabled={safeCurrentPage === 1}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  title="Trang trước"
                >
                  <FaChevronLeft size={11} />
                  <span>{t("common.previous") || "Trước"}</span>
                </button>

                <div className="dstd-page-numbers">
                  {getPageNumbers().map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="dstd-page-ellipsis">
                          ...
                        </span>
                      );
                    }
                    const isActive = p === safeCurrentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        type="button"
                        className={`dstd-page-btn ${isActive ? "active" : ""}`}
                        onClick={() => handlePageChange(p)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="dstd-page-btn dstd-page-nav-btn"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  title="Trang sau"
                >
                  <span>{t("common.next") || "Sau"}</span>
                  <FaChevronRight size={11} />
                </button>

                {totalPages > 4 && (
                  <button
                    type="button"
                    className="dstd-page-btn"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    title="Trang cuối cùng"
                  >
                    <FaAngleDoubleRight size={12} />
                  </button>
                )}
              </nav>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DanhSachDuAn;
