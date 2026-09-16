import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import ListingCard from "../components/ListingCard";
import tinDangPublicApi from "../api/tinDangPublicApi";
import yeuThichApi from "../api/yeuThichApi";
import { useTranslation } from "../context/LanguageContext";
import { injectJsonLd, removeJsonLd, setPageSEO, SITE_URL } from "../utils/seo";
import { FaSearch, FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from "react-icons/fa";
import "./trangchu/trangchu.css";
import "./DanhSachTinDang.css";

function DanhSachTinDang({ loaiGiaoDich: propLoaiGiaoDich }) {
  const { loaiGiaoDich: paramLoaiGiaoDich } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  
  // Ưu tiên prop, nếu không có thì đọc từ route parameter
  const loaiGiaoDich = propLoaiGiaoDich || paramLoaiGiaoDich;
  
  const [tindangs, setTindangs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingFavId, setAddingFavId] = useState(null);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    setKeyword(qParams.get("keyword") || "");
    const pageParam = parseInt(qParams.get("page"), 10);
    if (!isNaN(pageParam) && pageParam > 0) {
      setCurrentPage(pageParam);
    } else {
      setCurrentPage(1);
    }
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const qParams = new URLSearchParams(location.search);
    if (keyword.trim()) {
      qParams.set("keyword", keyword.trim());
    } else {
      qParams.delete("keyword");
    }
    qParams.delete("page");
    navigate(`${location.pathname}?${qParams.toString()}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === safeCurrentPage) return;
    setCurrentPage(newPage);
    const qParams = new URLSearchParams(location.search);
    if (newPage === 1) {
      qParams.delete("page");
    } else {
      qParams.set("page", newPage);
    }
    navigate(`${location.pathname}?${qParams.toString()}`);
    
    setTimeout(() => {
      const el = document.getElementById("listings-title") || document.getElementById("main-content");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 50);
  };

  useEffect(() => {
    fetchTinDangs();
  }, [loaiGiaoDich, location.search]);

  useEffect(() => {
    // SEO based on loaiGiaoDich
    const seoConfig = {
      Ban: {
        title: "Nhà đất bán - Hommy",
        description: "Tìm kiếm tin bán nhà đất, căn hộ, biệt thự, đất nền uy tín trên Hommy với hàng nghìn tin đăng mới mỗi ngày.",
        keywords: "nhà đất bán, bán nhà, bán đất, bán căn hộ, bán biệt thự, Hommy",
      },
      Thue: {
        title: "Nhà đất cho thuê - Hommy",
        description: "Tìm kiếm căn hộ, nhà đất cho thuê, nhà nguyên căn cho thuê nhanh chóng và minh bạch trên Hommy.",
        keywords: "nhà đất cho thuê, cho thuê căn hộ, nhà nguyên căn cho thuê, bất động sản cho thuê, Hommy",
      },
      TatCa: {
        title: "Tìm kiếm bất động sản - Hommy",
        description: "Tìm kiếm tất cả tin đăng nhà đất, căn hộ, biệt thự trên Hommy.",
        keywords: "tìm kiếm nhà đất, bất động sản, Hommy",
      }
    };

    const seo = seoConfig[loaiGiaoDich] || seoConfig.TatCa;
    const canonical = `${SITE_URL}/${loaiGiaoDich === 'Ban' ? 'nha-dat-ban' : loaiGiaoDich === 'Thue' ? 'nha-dat-cho-thue' : 'tim-kiem'}`;

    setPageSEO({
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      canonical,
    });

    // JSON-LD for ItemList
    if (tindangs.length > 0) {
      injectJsonLd("jsonld-itemlist", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: loaiGiaoDich === 'Ban' ? "Tin đăng nhà đất bán" : "Tin đăng nhà đất cho thuê",
        itemListElement: tindangs.slice(0, 10).map((tin, index) => {
          const id = tin.TinDangID ?? tin.id ?? tin._id;
          return {
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}/tin-dang/${id}`,
            name: tin.TieuDe || `Tin đăng #${id}`,
          };
        }),
      });
    }

    return () => {
      removeJsonLd("jsonld-itemlist");
    };
  }, [loaiGiaoDich, tindangs]);

  const fetchTinDangs = async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams(location.search);
      const params = {};
      
      const isRecommend = queryParams.get("recommend") === "1";
      const isLatest = queryParams.get("latest") === "1";
      
      if (loaiGiaoDich && !isRecommend && !isLatest) {
        params.loaiGiaoDich = loaiGiaoDich;
      }
      
      const keyword = queryParams.get("keyword");
      if (keyword) params.keyword = keyword;

      const tinhThanh = queryParams.get("tinhThanh");
      if (tinhThanh) params.tinhThanh = tinhThanh;

      const khuVucId = queryParams.get("KhuVucID");
      if (khuVucId) params.khuVucId = Number(khuVucId);

      const loaiBDS = queryParams.get("loaiBDS");
      if (loaiBDS) params.loaiBDS = loaiBDS;

      const minGia = queryParams.get("minGia");
      if (minGia) params.minGia = parseFloat(minGia);

      const maxGia = queryParams.get("maxGia");
      if (maxGia) params.maxGia = parseFloat(maxGia);

      const minDienTich = queryParams.get("minDienTich");
      if (minDienTich) params.minDienTich = parseFloat(minDienTich);

      const maxDienTich = queryParams.get("maxDienTich");
      if (maxDienTich) params.maxDienTich = parseFloat(maxDienTich);
      
      const res = await tinDangPublicApi.getAll(params);
      let raw = [];
      if (res?.data?.success && Array.isArray(res.data.data)) {
        raw = res.data.data;
      } else if (Array.isArray(res?.data)) {
        raw = res.data;
      }
      setTindangs(raw);
    } catch (err) {
      console.error("Lỗi lấy tin đăng:", err?.response?.data || err.message || err);
      setError("Không thể tải tin đăng");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("currentUser");
      if (raw) {
        const parsed = JSON.parse(raw);
        const actual = parsed.user ?? parsed;
        const id = actual?.NguoiDungID ?? actual?.id ?? actual?.userId;
        if (id) return Number(id);
      }
    } catch {
      /* ignore */
    }
    const idKey = localStorage.getItem("userId");
    if (idKey && !isNaN(Number(idKey))) return Number(idKey);
    return null;
  };

  const handleAddFavorite = async (tin) => {
    const tinId = tin?.TinDangID ?? tin?.id ?? tin?._id;
    const userId = getCurrentUserId();
    if (!userId) {
      window.location.href = "/login";
      return;
    }
    if (!tinId) return;
    setAddingFavId(tinId);
    try {
      await yeuThichApi.add({ NguoiDungID: userId, TinDangID: tinId });
      alert(t("homepage.addToFavorites") || "Đã thêm vào yêu thích");
    } catch (err) {
      console.error("Thêm yêu thích lỗi:", err?.response ?? err);
      alert(t("header.removeFailed") || "Thêm yêu thích thất bại");
    } finally {
      setAddingFavId(null);
    }
  };

  const queryParams = new URLSearchParams(location.search);
  const isRecommend = queryParams.get("recommend") === "1";
  const isLatest = queryParams.get("latest") === "1";

  const pageTitle = isRecommend
    ? (t("homepage.recommendedForYou") || "Bất động sản dành cho bạn")
    : isLatest
    ? (t("homepage.latestListings") || "Tin đăng mới nhất")
    : (loaiGiaoDich === 'Ban' ? (t("nav.sell") || "Nhà đất bán") : loaiGiaoDich === 'Thue' ? (t("nav.rent") || "Nhà đất cho thuê") : (t("common.allListings") || "Tất cả tin đăng"));

  const totalItems = tindangs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const currentListings = tindangs.slice(startIndex, endIndex);

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

      <main id="main-content">
        <section className="section" aria-labelledby="listings-title">
          <div className="container">
            <div className="section__header" style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
              <h1 id="listings-title" className="section__title" style={{ fontSize: "2rem", color: "#1e293b", fontWeight: "800", margin: "0" }}>
                {pageTitle}
              </h1>

              {/* Inline Search Bar */}
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "400px" }}>
                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#fff", padding: "0 10px" }}>
                  <FaSearch style={{ color: "#64748b", marginRight: "8px" }} />
                  <input
                    type="text"
                    placeholder={
                      loaiGiaoDich === "Thue"
                        ? (t("listings.searchRentPlaceholder") || "Tìm kiếm nhà đất cho thuê...")
                        : (t("listings.searchSellPlaceholder") || "Tìm kiếm nhà đất bán...")
                    }
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
                  {t("listings.searchBtn") || t("projects.searchBtn") || "Tìm"}
                </button>
              </form>
            </div>

            <div className="featured-listings">
              {loading && (
                <div className="tindang-loading">
                  {t("homepage.loading") || "Đang tải..."}
                </div>
              )}
              
              {error && (
                <div className="tindang-error" role="alert">
                  {error || t("homepage.error") || "Có lỗi xảy ra"}
                </div>
              )}
              
              {!loading && tindangs.length === 0 && (
                <div className="tindang-empty">
                  {t("homepage.noListings") || "Chưa có tin đăng nào"}
                </div>
              )}
              
              {!loading && currentListings.length > 0 && (
                currentListings.map((tinDang) => {
                  const tinId = tinDang.TinDangID ?? tinDang.id ?? tinDang._id;
                  return (
                    <ListingCard
                      key={tinId}
                      tinDang={tinDang}
                      onAddFavorite={handleAddFavorite}
                      t={t}
                      lazy
                      disabled={addingFavId === tinId}
                    />
                  );
                })
              )}
            </div>

            {/* Phân trang (Pagination) */}
            {!loading && totalPages > 1 && (
              <div className="dstd-pagination-container">
                <div className="dstd-pagination-info">
                  {t("common.showing") || "Hiển thị"}{" "}
                  <strong>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong>{" "}
                  {t("common.of") || "trên tổng số"}{" "}
                  <strong>{totalItems}</strong> {t("common.listings") || "tin đăng"}
                </div>

                <nav className="dstd-pagination-nav" aria-label="Phân trang danh sách tin đăng">
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
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default DanhSachTinDang;