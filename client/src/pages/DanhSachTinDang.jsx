import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import ListingCard from "../components/ListingCard";
import tinDangPublicApi from "../api/tinDangPublicApi";
import yeuThichApi from "../api/yeuThichApi";
import { useTranslation } from "../context/LanguageContext";
import { injectJsonLd, removeJsonLd, setPageSEO, SITE_URL } from "../utils/seo";
import { FaSearch } from "react-icons/fa";

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

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    setKeyword(qParams.get("keyword") || "");
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const qParams = new URLSearchParams(location.search);
    if (keyword.trim()) {
      qParams.set("keyword", keyword.trim());
    } else {
      qParams.delete("keyword");
    }
    navigate(`${location.pathname}?${qParams.toString()}`);
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
    };

    const seo = seoConfig[loaiGiaoDich] || seoConfig.Ban;
    const canonical = `${SITE_URL}/${loaiGiaoDich === 'Ban' ? 'nha-dat-ban' : 'nha-dat-cho-thue'}`;

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
    : (loaiGiaoDich === 'Ban' ? (t("nav.sell") || "Nhà đất bán") : (t("nav.rent") || "Nhà đất cho thuê"));

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
              
              {!loading && tindangs.length > 0 && (
                tindangs.map((tinDang) => {
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default DanhSachTinDang;