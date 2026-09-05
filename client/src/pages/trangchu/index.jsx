import React, { useEffect, useState } from "react";
import Header from "../../components/header";
import Footer from "../../components/footer";
import ListingCard from "../../components/ListingCard";
import tinDangPublicApi from "../../api/tinDangPublicApi";
import duAnPublicApi from "../../api/duAnPublicApi";
import baiVietPublicApi from "../../api/baiVietPublicApi";
import "./trangchu.css";
import SearchKhuVuc from "../../components/SearchKhuVuc";
import yeuThichApi from "../../api/yeuThichApi";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "../../context/LanguageContext";
import ChatBot from "../../components/ChatBot/ChatBot";
import { FaArrowRight, FaHome, FaBuilding, FaCity, FaMapMarkerAlt } from "react-icons/fa";
import { injectJsonLd, removeJsonLd, setPageSEO, SITE_URL } from "../../utils/seo";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tạo Custom SVG Pins sắc nét, không phụ thuộc ảnh ngoài
const createCustomPin = (type = 'listing') => {
  const isProject = type === 'project';
  const bgColor = isProject ? '#10b981' : '#ef4444';
  const iconEmoji = isProject ? '🏢' : '📍';
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background: ${bgColor}; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35); border: 2.5px solid #ffffff; cursor: pointer;">
      <span style="transform: rotate(45deg); font-size: 15px; line-height: 1;">${iconEmoji}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const pinListingIcon = createCustomPin('listing');
const pinProjectIcon = createCustomPin('project');

// Component điều khiển tương tác và tự động fix kích thước bản đồ
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.flyTo(center, zoom || 12, { duration: 1.2 });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  return null;
}

const MAP_TILES = {
  googleRoad: {
    name: "Google Maps",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20
  },
  googleSatellite: {
    name: "Vệ tinh",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Vệ tinh",
    maxZoom: 20
  },
  carto: {
    name: "Đô thị",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO & OpenStreetMap",
    maxZoom: 19
  }
};

const QUICK_MAP_CITIES = [
  { name: "TP.HCM", coords: [10.782622, 106.660172], zoom: 12 },
  { name: "Hà Nội", coords: [21.028511, 105.854444], zoom: 12 },
  { name: "Đà Nẵng", coords: [16.054407, 108.202167], zoom: 13 },
  { name: "Bình Dương", coords: [10.980464, 106.674515], zoom: 12 }
];

const CATEGORY_ROUTES = {
  house: "/nha-dat-ban",
  apartment: "/nha-dat-cho-thue",
  townhouse: "/nha-dat-ban",
  villa: "/nha-dat-ban",
  land: "/nha-dat-ban",
  office: "/nha-dat-cho-thue",
};

const NEWS_ITEMS = [
  {
    slug: "xu-huong-bat-dong-san-2025",
    title: "Xu hướng bất động sản năm 2025: Đầu tư vào đâu?",
    date: "Hôm nay",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80",
  },
  {
    slug: "meo-tim-bat-dong-san-ngan-sach",
    title: "Mẹo tìm kiếm bất động sản phù hợp với ngân sách",
    date: "2 ngày trước",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=300&q=80",
  },

];

const FEATURED_PROJECTS = [
  {
    slug: "vinhomes-central-park",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    title: "Vinhomes Central Park",
    price: "Từ 3,5 tỷ đồng",
    location: "Quận Bình Thạnh, TP. HCM",
    area: "120 m²",
  },
  {
    slug: "the-sun-avenue",
    img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80",
    title: "The Sun Avenue",
    price: "Từ 2,1 tỷ đồng",
    location: "Quận 9, TP. HCM",
    area: "105 m²",
  },
  {
    slug: "masteri-thao-dien",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
    title: "Masteri Thảo Điền",
    price: "Từ 2,8 tỷ đồng",
    location: "Quận 2, TP. HCM",
    area: "130 m²",
  },
  {
    slug: "diamond-island",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80",
    title: "Diamond Island",
    price: "Từ 4,2 tỷ đồng",
    location: "Quận 2, TP. HCM",
    area: "150 m²",
  },
];

const FALLBACK_PROJECT_IMAGES = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
];

const ROUTE_SEO = {
  "/": {
    title: "Hommy - Mua bán, cho thuê nhà đất toàn quốc",
    description:
      "Hommy là nền tảng bất động sản uy tín tại Việt Nam, kết nối người mua, người bán và người thuê với hàng nghìn tin đăng mới mỗi ngày.",
    keywords: "bất động sản, nhà đất, mua bán nhà đất, cho thuê nhà đất, căn hộ, biệt thự, Hommy",
  },
  "/nha-dat-ban": {
    title: "Nhà đất bán - Hommy",
    description: "Tìm kiếm tin bán nhà đất, căn hộ, biệt thự, đất nền uy tín trên Hommy với hàng nghìn tin đăng mới mỗi ngày.",
    keywords: "nhà đất bán, bán nhà, bán đất, bán căn hộ, bán biệt thự, Hommy",
  },
  "/nha-dat-cho-thue": {
    title: "Nhà đất cho thuê - Hommy",
    description: "Tìm căn hộ, nhà đất cho thuê, nhà nguyên căn cho thuê nhanh chóng và minh bạch trên Hommy.",
    keywords: "nhà đất cho thuê, cho thuê căn hộ, cho thuê nhà nguyên căn, Hommy",
  },
  "/du-an": {
    title: "Dự án bất động sản - Hommy",
    description: "Khám phá các dự án bất động sản nổi bật, căn hộ chung cư và khu đô thị mới trên Hommy.",
    keywords: "dự án bất động sản, dự án căn hộ, khu đô thị, Hommy",
  },
};

function TrangChu() {
  const { t } = useTranslation();
  const location = useLocation();
  const [tindangs, setTindangs] = useState([]);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [newsPosts, setNewsPosts] = useState([]);
  const [wikiPosts, setWikiPosts] = useState([]);
  const [analysisPosts, setAnalysisPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addingFavId, setAddingFavId] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.782622, 106.660172]);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapStyle, setMapStyle] = useState("googleRoad");

  useEffect(() => {
    fetchTinDangs();
    fetchStats();
    fetchProjects();
    fetchNews();
    fetchWiki();
    fetchAnalysis();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await tinDangPublicApi.getStats();
      if (res?.data?.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy thống kê trang chủ:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await duAnPublicApi.getAll({ trangThai: "HoatDong", limit: 4 });
      let list = [];
      if (res?.data?.success && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      }
      setProjects(list);
    } catch (err) {
      console.error("Lỗi lấy danh sách dự án:", err);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await baiVietPublicApi.getAll({ loai: "TinTuc", limit: 2 });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setNewsPosts(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy tin tức trang chủ:", err);
    }
  };

  const fetchWiki = async () => {
    try {
      const res = await baiVietPublicApi.getAll({ loai: "Wiki", limit: 4 });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setWikiPosts(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy cẩm nang trang chủ:", err);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const res = await baiVietPublicApi.getAll({ loai: "PhanTich", limit: 4 });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAnalysisPosts(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi lấy phân tích trang chủ:", err);
    }
  };

  useEffect(() => {
    const seo = ROUTE_SEO[location.pathname] || ROUTE_SEO["/"];
    const canonical = `${SITE_URL}${location.pathname === "/" ? "/" : location.pathname}`;

    setPageSEO({
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      canonical,
    });

    injectJsonLd("jsonld-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Hommy",
      url: `${SITE_URL}/`,
      description: seo.description,
      inLanguage: "vi-VN",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?keyword={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    injectJsonLd("jsonld-organization", {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: "Hommy",
      url: `${SITE_URL}/`,
      description: seo.description,
      areaServed: "Việt Nam",
      telephone: "+84349195610",
      email: "hommybds@gmail.com",
    });

    return () => {
      removeJsonLd("jsonld-website");
      removeJsonLd("jsonld-organization");
      removeJsonLd("jsonld-itemlist");
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!tindangs.length) return;

    injectJsonLd("jsonld-itemlist", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Tin đăng bất động sản mới nhất",
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
  }, [tindangs]);

  const fetchTinDangs = async (params = {}) => {
    setLoading(true);
    setError("");
    try {
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

  const handleSearchKhuVuc = (payload = {}) => {
    const params = {};
    if (payload?.KhuVucID) {
      const khuVucId = Number(payload.KhuVucID);
      if (!isNaN(khuVucId) && khuVucId > 0) params.khuVucId = khuVucId;
    }
    if (payload?.keyword && payload.keyword.trim()) {
      params.keyword = payload.keyword.trim();
    }
    if (payload?.loaiGiaoDich) {
      params.loaiGiaoDich = payload.loaiGiaoDich;
    }
    if (payload?.loaiBDS) {
      params.loaiBDS = payload.loaiBDS;
    }
    if (payload?.minGia !== null && payload?.minGia !== undefined) {
      params.minGia = payload.minGia;
    }
    if (payload?.maxGia !== null && payload?.maxGia !== undefined) {
      params.maxGia = payload.maxGia;
    }
    if (payload?.minDienTich !== null && payload?.minDienTich !== undefined) {
      params.minDienTich = payload.minDienTich;
    }
    if (payload?.maxDienTich !== null && payload?.maxDienTich !== undefined) {
      params.maxDienTich = payload.maxDienTich;
    }
    
    fetchTinDangs(params);
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
      alert("Đã thêm vào yêu thích");
    } catch (err) {
      console.error("Thêm yêu thích lỗi:", err?.response ?? err);
      alert("Thêm yêu thích thất bại");
    } finally {
      setAddingFavId(null);
    }
  };

  const getCategoryCount = (key) => {
    if (!stats || !Array.isArray(stats.loaiBds)) return "0";
    
    const categoryMapping = {
      house: ['nhao', 'nharieng', 'house'],
      apartment: ['canho', 'chungcu', 'apartment'],
      townhouse: ['nhapho', 'shophouse', 'townhouse'],
      villa: ['bietthu', 'villa'],
      land: ['bandat', 'datnen', 'dato', 'land'],
      office: ['vanphong', 'matbang', 'cuahangkiot', 'khoxuong', 'office']
    };
    
    const matchedTypes = categoryMapping[key] || [];
    const sum = stats.loaiBds.reduce((acc, item) => {
      const type = String(item.LoaiBDS || '').toLowerCase();
      if (matchedTypes.includes(type)) {
        return acc + (item.SoLuong || 0);
      }
      return acc;
    }, 0);
    
    return sum.toLocaleString("vi-VN");
  };

  const getLocationCount = (name) => {
    if (!stats || !Array.isArray(stats.tinh)) return "0 tin đăng";
    const found = stats.tinh.find(item => 
      String(item.TenTinh || '').toLowerCase().includes(name.toLowerCase())
    );
    const count = found ? found.SoLuong : 0;
    return `${count.toLocaleString("vi-VN")} tin đăng`;
  };

  return (
    <div className="trangchu">
      <Header />

      <main id="main-content">
        <section className="trangchu__banner" aria-labelledby="home-hero-title">
          <div className="trangchu__banner-content">
            <span className="trangchu__banner-badge">
              {t("homepage.badge") || "Mua bán • Cho thuê • Đầu tư"}
            </span>
            <h1 id="home-hero-title" className="trangchu__banner-title">
              {t("homepage.bannerTitle") || "Tìm nhà đất đúng nhu cầu, nhanh như ý muốn"}
            </h1>
            <p className="trangchu__banner-subtitle">
              {t("homepage.bannerSubtitle") ||
                "Khám phá hơn 50.000 tin đăng bất động sản từ các khu vực nóng tại TP. HCM, Hà Nội, Đà Nẵng và toàn quốc."}
            </p>
          </div>

          <div className="trangchu__banner-search">
            <SearchKhuVuc onSearch={handleSearchKhuVuc} />
          </div>
        </section>

        <section className="trangchu__stats" aria-label="Thông số nổi bật">
          {[
            { value: stats ? `${stats.tong.toLocaleString("vi-VN")}+` : "50.000+", label: t("homepage.stats.newListings") || "tin đăng mới mỗi tháng" },
            { value: "120+", label: t("homepage.stats.areas") || "khu vực được cập nhật" },
            { value: "4.9/5", label: t("homepage.stats.trust") || "độ tin cậy từ người dùng" },
          ].map((item, index) => (
            <div key={index} className="trangchu__stats-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="section section--light section-news-top" aria-labelledby="featured-news-title">
          <div className="container">
            <div className="section__header">
              <h2 id="featured-news-title" className="section__title">
                {t("homepage.featuredNews") || "Tin tức bất động sản nổi bật"}
              </h2>
              <Link to="/tin-tuc-bds" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            <div className="top-news-grid">
              {newsPosts.length > 0 ? (
                <>
                  {/* Left: Featured Large Article */}
                  <div className="top-news-featured">
                    <Link to={`/bai-viet/${newsPosts[0].BaiVietID || newsPosts[0].id}`} className="top-news-featured__img-link">
                      <img src={newsPosts[0].HinhAnh} alt={newsPosts[0].TieuDe} className="top-news-featured__img" />
                    </Link>
                    <div className="top-news-featured__content">
                      <h3 className="top-news-featured__title">
                        <Link to={`/bai-viet/${newsPosts[0].BaiVietID || newsPosts[0].id}`}>{newsPosts[0].TieuDe}</Link>
                      </h3>
                      <p className="top-news-featured__summary">{newsPosts[0].TomTat || newsPosts[0].MoTa}</p>
                      <time className="top-news-featured__time">
                        {new Date(newsPosts[0].TaoLuc).toLocaleDateString("vi-VN")}
                      </time>
                    </div>
                  </div>

                  {/* Right: Small Articles List */}
                  <div className="top-news-list">
                    {newsPosts.slice(1, 4).map((item) => (
                      <article key={item.BaiVietID} className="top-news-item">
                        <Link to={`/bai-viet/${item.BaiVietID || item.id}`} className="top-news-item__img-link">
                          <img src={item.HinhAnh} alt={item.TieuDe} className="top-news-item__img" />
                        </Link>
                        <div className="top-news-item__content">
                          <h4 className="top-news-item__title">
                            <Link to={`/bai-viet/${item.BaiVietID || item.id}`}>{item.TieuDe}</Link>
                          </h4>
                          <time className="top-news-item__time">
                            {new Date(item.TaoLuc).toLocaleDateString("vi-VN")}
                          </time>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="top-news-empty">Đang tải tin tức...</div>
              )}
            </div>
          </div>
        </section>

        <section className="section latest-section" aria-labelledby="latest-listings-title">
          <div className="container">
            <div className="section__header">
              <h2 id="latest-listings-title" className="section__title">
                {t("homepage.latestListings") || "Tin đăng mới nhất"}
              </h2>
              <Link to="/nha-dat-ban?latest=1" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="featured-listings">
              {loading && <div className="tindang-loading">{t("homepage.loading")}</div>}
              {error && <div className="tindang-error" role="alert">{error || t("homepage.error")}</div>}
              {!loading && tindangs.length === 0 && (
                <div className="tindang-empty">{t("homepage.noListings")}</div>
              )}
              {!loading &&
                tindangs.slice(0, 4).map((tinDang) => {
                  const tinId = tinDang.TinDangID ?? tinDang.id ?? tinDang._id;
                  return (
                    <ListingCard
                      key={tinId}
                      tinDang={tinDang}
                      onAddFavorite={handleAddFavorite}
                      t={t}
                      disabled={addingFavId === tinId}
                    />
                  );
                })}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="recommended-listings-title">
          <div className="container">
            <div className="section__header">
              <h2 id="recommended-listings-title" className="section__title">
                {t("homepage.recommendedForYou") || "Bất động sản dành cho bạn"}
              </h2>
              <Link to="/nha-dat-cho-thue?recommend=1" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="featured-listings">
              {(tindangs.length > 4 ? tindangs.slice(4, 8) : [...tindangs].reverse()).map((tinDang) => {
                const tinId = tinDang.TinDangID ?? tinDang.id ?? tinDang._id;
                return (
                  <ListingCard
                    key={`rec-${tinId}`}
                    tinDang={tinDang}
                    onAddFavorite={handleAddFavorite}
                    t={t}
                    lazy
                    disabled={addingFavId === tinId}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section--light" aria-labelledby="featured-projects-title">
          <div className="container">
            <div className="section__header">
              <h2 id="featured-projects-title" className="section__title">
                {t("homepage.featuredProjects") || "Dự án bất động sản nổi bật"}
              </h2>
              <Link to="/du-an" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="featured-listings">
              {projects.length > 0 ? (
                projects.map((project, index) => {
                  let parsedMeta = {};
                  try {
                    if (project.ThongTinMoRong) {
                      parsedMeta = typeof project.ThongTinMoRong === 'string'
                        ? JSON.parse(project.ThongTinMoRong)
                        : project.ThongTinMoRong;
                    }
                  } catch (e) {
                    console.error("Lỗi parse metadata dự án:", e);
                  }
                  
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
                    const imageSeed = project.DuAnID ? Number(project.DuAnID) : index;
                    projectImg = FALLBACK_PROJECT_IMAGES[imageSeed % 4];
                  }
                  const projectPrice = project.TinDangHoatDong > 0 
                    ? `Có ${project.TinDangHoatDong} tin đăng`
                    : "Đang cập nhật";
                  const projectArea = project.TongPhong > 0
                    ? `${project.TongPhong} căn / phòng`
                    : "Đang cập nhật";


                  return (
                    <article key={project.DuAnID} className="featured-card">
                      <Link to={`/du-an/${project.DuAnID}`} className="featured-card__image" aria-label={`Xem dự án: ${project.TenDuAn}`}>
                        <img src={projectImg} alt={project.TenDuAn} loading="lazy" decoding="async" />
                      </Link>
                      <div className="featured-card__content">
                        <h3 className="featured-card__title">
                          <Link to={`/du-an/${project.DuAnID}`}>{project.TenDuAn}</Link>
                        </h3>
                        <div className="featured-card__meta-row">
                          <div className="featured-card__price">{projectPrice}</div>
                          <div className="featured-card__area">{projectArea}</div>
                        </div>
                        <address className="featured-card__location">
                          <FaMapMarkerAlt size={12} aria-hidden="true" /> {project.DiaChi || "Chưa có địa chỉ"}
                        </address>
                      </div>
                    </article>
                  );
                })
              ) : (
                FEATURED_PROJECTS.map((project) => (
                  <article key={project.slug} className="featured-card">
                    <Link to="/du-an" className="featured-card__image" aria-label={`Xem dự án: ${project.title}`}>
                      <img src={project.img} alt={project.title} loading="lazy" decoding="async" />
                    </Link>
                    <div className="featured-card__content">
                      <h3 className="featured-card__title">
                        <Link to="/du-an">{project.title}</Link>
                      </h3>
                      <div className="featured-card__meta-row">
                        <div className="featured-card__price">{project.price}</div>
                        <div className="featured-card__area">{project.area}</div>
                      </div>
                      <address className="featured-card__location">
                        <FaMapMarkerAlt size={12} aria-hidden="true" /> {project.location}
                      </address>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section section--light location-map-row" aria-labelledby="location-title">
          <div className="container">
            <div className="location-map-row__inner">
              <div className="location-section">
                <div className="section__header">
                  <h2 id="location-title" className="section__title">
                    {t("homepage.listingsByLocation") || "Bất động sản theo địa điểm"}
                  </h2>
                  <Link to="/nha-dat-ban" className="section__link">
                    {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
                <div className="location-card-layout">
                  <Link 
                    to={`/nha-dat-ban?tinhThanh=${encodeURIComponent("Hồ Chí Minh")}`} 
                    className="location-card location-card--hero"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.82) 100%), url('https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80')`
                    }}
                  >
                    <div className="location-card__content-bottom">
                      <span className="location-card__badge-tag">Khu vực sôi động nhất</span>
                      <div className="location-card__label">TP. Hồ Chí Minh</div>
                      <div className="location-card__count">
                        <FaBuilding size={11} /> {getLocationCount("Hồ Chí Minh")}
                      </div>
                    </div>
                  </Link>

                  <div className="location-card-grid">
                    {[
                      { 
                        name: "Hà Nội", 
                        count: getLocationCount("Hà Nội"), 
                        slug: "ha-noi",
                        query: "Hà Nội",
                        image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
                      },
                      { 
                        name: "Đà Nẵng", 
                        count: getLocationCount("Đà Nẵng"), 
                        slug: "da-nang",
                        query: "Đà Nẵng",
                        image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80"
                      },
                      { 
                        name: "Bình Dương", 
                        count: getLocationCount("Bình Dương"), 
                        slug: "binh-duong",
                        query: "Bình Dương",
                        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"
                      },
                      { 
                        name: "Đồng Nai", 
                        count: getLocationCount("Đồng Nai"), 
                        slug: "dong-nai",
                        query: "Đồng Nai",
                        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                      },
                    ].map((loc) => (
                      <Link 
                        to={`/nha-dat-ban?tinhThanh=${encodeURIComponent(loc.query)}`} 
                        key={loc.slug} 
                        className="location-card location-card--small"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.85) 100%), url('${loc.image}')`
                        }}
                      >
                        <div className="location-card__content-bottom">
                          <div className="location-card__name">{loc.name}</div>
                          <div className="location-card__count">
                            <FaBuilding size={10} /> {loc.count}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="khuvuc-map" aria-label={t("homepage.mapTitle") || "Bản đồ bất động sản"} style={{ zIndex: 1 }}>
                <div className="khuvuc-map__header">
                  <h3 className="khuvuc-map__title">
                    <FaMapMarkerAlt style={{ color: '#ef4444' }} />
                    <span>{t("homepage.mapTitle") || "Bản đồ bất động sản"}</span>
                  </h3>
                  
                  <div className="khuvuc-map__controls">
                    {/* Nút chọn nhanh khu vực */}
                    <div className="khuvuc-map__btn-group">
                      {QUICK_MAP_CITIES.map((city) => (
                        <button
                          key={city.name}
                          type="button"
                          className="khuvuc-map__btn"
                          title={`Xem khu vực ${city.name}`}
                          onClick={() => {
                            setMapCenter(city.coords);
                            setMapZoom(city.zoom);
                          }}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>

                    {/* Nút chọn kiểu bản đồ */}
                    <div className="khuvuc-map__btn-group">
                      {Object.keys(MAP_TILES).map((styleKey) => (
                        <button
                          key={styleKey}
                          type="button"
                          className={`khuvuc-map__btn ${mapStyle === styleKey ? 'khuvuc-map__btn--active' : ''}`}
                          onClick={() => setMapStyle(styleKey)}
                        >
                          {MAP_TILES[styleKey].name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="khuvuc-map__container">
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <MapController center={mapCenter} zoom={mapZoom} />
                    
                    <TileLayer
                      key={mapStyle}
                      attribution={MAP_TILES[mapStyle].attribution}
                      url={MAP_TILES[mapStyle].url}
                      maxZoom={MAP_TILES[mapStyle].maxZoom}
                    />

                    {/* Hiển thị Marker Dự Án BĐS */}
                    {projects
                      .filter((p) => p.ViDo && p.KinhDo)
                      .map((p) => {
                        const lat = parseFloat(p.ViDo);
                        const lng = parseFloat(p.KinhDo);
                        if (isNaN(lat) || isNaN(lng)) return null;

                        return (
                          <Marker key={`proj-${p.DuAnID}`} position={[lat, lng]} icon={pinProjectIcon}>
                            <Popup>
                              <div style={{ width: "190px", fontFamily: "inherit" }}>
                                <div style={{ 
                                  display: "inline-block", 
                                  background: "#10b981", 
                                  color: "white", 
                                  fontSize: "10px", 
                                  fontWeight: 700, 
                                  padding: "2px 6px", 
                                  borderRadius: "4px", 
                                  marginBottom: "4px" 
                                }}>
                                  🏢 DỰ ÁN BĐS
                                </div>
                                <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "bold", color: "#0f172a" }}>
                                  {p.TenDuAn}
                                </h4>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px 0", lineHeight: 1.3 }}>
                                  {p.DiaChi || "Chưa có địa chỉ chi tiết"}
                                </p>
                                <Link to={`/du-an/${p.DuAnID}`} style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold", textDecoration: "none" }}>
                                  Xem chi tiết dự án &rarr;
                                </Link>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}

                    {/* Hiển thị Marker Tin Đăng BĐS */}
                    {tindangs
                      .filter((t) => t.ViDo && t.KinhDo)
                      .map((t) => {
                        const lat = parseFloat(t.ViDo);
                        const lng = parseFloat(t.KinhDo);
                        if (isNaN(lat) || isNaN(lng)) return null;

                        let imageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80";
                        if (t.URL) {
                          try {
                            const parsed = typeof t.URL === "string" ? JSON.parse(t.URL) : t.URL;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              imageUrl = parsed[0];
                            }
                          } catch {
                            if (typeof t.URL === "string" && t.URL.startsWith("http")) {
                              imageUrl = t.URL;
                            }
                          }
                        }

                        return (
                          <Marker key={`tin-${t.TinDangID}`} position={[lat, lng]} icon={pinListingIcon}>
                            <Popup>
                              <div style={{ width: "190px", fontFamily: "inherit" }}>
                                <img
                                  src={imageUrl}
                                  alt={t.TieuDe}
                                  style={{ width: "100%", height: "95px", objectFit: "cover", borderRadius: "6px", marginBottom: "6px" }}
                                />
                                <h4 style={{
                                  margin: "0 0 4px 0",
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  color: "#0f172a",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}>
                                  {t.TieuDe}
                                </h4>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#10b981", marginBottom: "6px" }}>
                                  {t.GiaTien ? `${t.GiaTien >= 1000 ? (t.GiaTien / 1000).toFixed(2) + " Tỷ" : t.GiaTien + " Triệu"}` : "Thỏa thuận"}
                                </div>
                                <Link to={`/tin-dang/${t.TinDangID}`} style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "bold", textDecoration: "none" }}>
                                  Xem chi tiết BĐS &rarr;
                                </Link>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                  </MapContainer>
                </div>
              </aside>
            </div>
          </div>
        </section>



        <section className="section section--light" aria-labelledby="analysis-title">
          <div className="container">
            <div className="section__header">
              <h2 id="analysis-title" className="section__title">
                {t("nav.analysis") || "Phân tích & đánh giá"}
              </h2>
              <Link to="/phan-tich-danh-gia" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="analysis-grid">
              {analysisPosts.length > 0 ? (
                analysisPosts.map((item, index) => {
                  const icons = [
                    <FaBuilding size={40} />,
                    <FaHome size={40} />,
                    <FaCity size={40} />,
                    <FaMapMarkerAlt size={40} />,
                  ];
                  const icon = icons[index % 4];
                  return (
                    <article key={item.BaiVietID} className="analysis-card">
                      <div className="analysis-card__icon" aria-hidden="true">
                        {icon}
                      </div>
                      <h3 className="analysis-card__title">{item.TieuDe}</h3>
                      <p className="analysis-card__desc">{item.TomTat}</p>
                      <Link to={`/bai-viet/${item.BaiVietID}`} className="analysis-card__link">
                        Xem chi tiết <FaArrowRight size={12} aria-hidden="true" />
                      </Link>
                    </article>
                  );
                })
              ) : (
                <div className="analysis-empty">Đang tải phân tích...</div>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="wiki-bds" aria-labelledby="wiki-title">
          <div className="container">
            <div className="section__header">
              <h2 id="wiki-title" className="section__title">
                {t("nav.wiki") || "Wiki bất động sản"}
              </h2>
              <Link to="/wiki-bds" className="section__link">
                {t("common.viewAll") || "Xem tất cả"} <FaArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <nav className="wiki-grid" aria-label="Wiki bất động sản">
              {wikiPosts.length > 0 ? (
                wikiPosts.map((item) => (
                  <Link to={`/bai-viet/${item.BaiVietID}`} key={item.BaiVietID} className="wiki-card">
                    <h3 className="wiki-card__title">{item.TieuDe}</h3>
                    <p className="wiki-card__desc">{item.TomTat}</p>
                  </Link>
                ))
              ) : (
                <div className="wiki-empty">Đang tải cẩm nang...</div>
              )}
            </nav>
          </div>
        </section>
      </main>

      <ChatBot />
      <Footer />
    </div>
  );
}

export default TrangChu;
