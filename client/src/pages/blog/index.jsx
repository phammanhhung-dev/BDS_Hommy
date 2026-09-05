import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import { useTranslation, useLanguage } from "../../context/LanguageContext";
import "./blog.css";
import { setPageSEO, SITE_URL } from "../../utils/seo";
import baiVietPublicApi from "../../api/baiVietPublicApi";
import {
  FaHome,
  FaBuilding,
  FaCity,
  FaDollarSign,
  FaGavel,
  FaSun,
  FaChartLine,
  FaVideo,
  FaUserTie,
  FaChevronRight,
  FaMapMarkerAlt
} from "react-icons/fa";

// Custom icons that we can fallback to for categories
const CATEGORIES_BY_PATH = {
  "/wiki-bds": [
    { label: "Mua BĐS", icon: <FaHome size={22} /> },
    { label: "Bán BĐS", icon: <FaBuilding size={22} /> },
    { label: "Thuê BĐS", icon: <FaCity size={22} /> },
    { label: "Tài chính BĐS", icon: <FaDollarSign size={22} /> },
    { label: "Quy hoạch - Pháp lý", icon: <FaGavel size={22} /> },
    { label: "Nội thất", icon: <FaHome size={22} /> },
    { label: "Phong thủy", icon: <FaSun size={22} /> },
  ],
  "/phan-tich-danh-gia": [
    { label: "Biểu đồ giá", icon: <FaChartLine size={22} /> },
    { label: "Video đánh giá", icon: <FaVideo size={22} /> },
    { label: "Báo cáo thị trường", icon: <FaDollarSign size={22} /> },
    { label: "Góc nhìn chuyên gia", icon: <FaUserTie size={22} /> },
  ]
};

const PAGE_SEO = {
  "/tin-tuc-bds": {
    title: "Tin tức bất động sản - Hommy",
    description: "Cập nhật tin tức, xu hướng và phân tích thị trường bất động sản Việt Nam mới nhất trên Hommy.",
  },
  "/wiki-bds": {
    title: "Wiki bất động sản - Hommy",
    description: "Kiến thức, hướng dẫn và thuật ngữ bất động sản dành cho người mua, bán và cho thuê nhà đất.",
  },
  "/phan-tich-danh-gia": {
    title: "Phân tích & đánh giá bất động sản - Hommy",
    description: "Phân tích giá, xu hướng đầu tư và đánh giá dự án bất động sản tại các khu vực trọng điểm.",
  },
};

const getLoaiByPathname = (path) => {
  if (path === "/wiki-bds") return "Wiki";
  if (path === "/phan-tich-danh-gia") return "PhanTich";
  return "TinTuc";
};

function Blog() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPageTitleStr = (path) => {
    if (path === "/wiki-bds") return t("nav.wiki") || "Wiki BĐS";
    if (path === "/phan-tich-danh-gia") return t("nav.analysis") || "Phân tích đánh giá";
    return t("blog.latestNewsTitle") || "Tin tức bất động sản mới nhất";
  };

  const getPageSubtitleStr = (path) => {
    if (path === "/wiki-bds") return t("blog.wikiSubtitle") || "Mọi kiến thức và kỹ năng cần thiết cho chủ nhà, người đi tìm mua và đi thuê nhà đất";
    if (path === "/phan-tich-danh-gia") return t("blog.analysisSubtitle") || "Trải nghiệm và phân tích dữ liệu chuyên nghiệp từ đội ngũ cố vấn Hommy";
    return t("blog.newsSubtitle") || "Thông tin mới, đầy đủ, hấp dẫn về thị trường bất động sản Việt Nam thông qua dữ liệu lịch sử giá";
  };

  const getCategoryLabel = (lbl) => {
    switch (lbl) {
      case "Mua BĐS": return t("blog.cat.buyBds") || "Mua BĐS";
      case "Bán BĐS": return t("blog.cat.sellBds") || "Bán BĐS";
      case "Thuê BĐS": return t("blog.cat.rentBds") || "Thuê BĐS";
      case "Tài chính BĐS": return t("blog.cat.financeBds") || "Tài chính BĐS";
      case "Quy hoạch - Pháp lý": return t("blog.cat.lawBds") || "Quy hoạch - Pháp lý";
      case "Nội thất": return t("blog.cat.interiorBds") || "Nội thất";
      case "Phong thủy": return t("blog.cat.fengshuiBds") || "Phong thủy";
      case "Biểu đồ giá": return t("blog.cat.priceChart") || "Biểu đồ giá";
      case "Video đánh giá": return t("blog.cat.videoReview") || "Video đánh giá";
      case "Báo cáo thị trường": return t("blog.cat.marketReport") || "Báo cáo thị trường";
      case "Góc nhìn chuyên gia": return t("blog.cat.expertView") || "Góc nhìn chuyên gia";
      default: return lbl;
    }
  };

  const getSectionHeading = (path) => {
    if (path === "/wiki-bds") return t("blog.latestWikiGuide") || "Cẩm nang Wiki BĐS mới nhất";
    if (path === "/phan-tich-danh-gia") return t("blog.latestAnalysisGuide") || "Cẩm nang Phân tích đánh giá mới nhất";
    return t("blog.latestNewsGuide") || "Cẩm nang Tin tức bất động sản mới nhất";
  };

  useEffect(() => {
    const seo = {
      "/tin-tuc-bds": {
        title: `${t("nav.news") || "Tin tức BĐS"} - Hommy`,
        description: t("blog.newsDesc") || "Cập nhật tin tức, xu hướng và phân tích thị trường bất động sản Việt Nam mới nhất.",
      },
      "/wiki-bds": {
        title: `${t("nav.wiki") || "Wiki BĐS"} - Hommy`,
        description: t("blog.wikiDesc") || "Kiến thức, hướng dẫn và thuật ngữ bất động sản dành cho người mua, bán và cho thuê nhà đất.",
      },
      "/phan-tich-danh-gia": {
        title: `${t("nav.analysis") || "Phân tích đánh giá"} - Hommy`,
        description: t("blog.analysisDesc") || "Phân tích giá, xu hướng đầu tư và đánh giá dự án bất động sản tại các khu vực trọng điểm.",
      },
    };
    const currentSeo = seo[location.pathname] || seo["/tin-tuc-bds"];
    setPageSEO({
      ...currentSeo,
      canonical: `${SITE_URL}${location.pathname}`,
    });

    fetchPosts();
  }, [location.pathname]);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const loai = getLoaiByPathname(location.pathname);
      const res = await baiVietPublicApi.getAll({ loai });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setPosts(res.data.data);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bài viết:", err);
      setError(t("blog.errorLoad") || "Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  const categories = CATEGORIES_BY_PATH[location.pathname] || [];
  const featuredPost = posts[0];
  const rightFeaturedPosts = posts.slice(1, 4);
  const mainPosts = posts.slice(4);

  return (
    <div className="blog">
      <Header />
      <main className="blog__container">
        
        {/* Header Block */}
        <header className="blog__header">
          <h1 className="blog__title">{getPageTitleStr(location.pathname)}</h1>
          <p className="blog__subtitle">{getPageSubtitleStr(location.pathname)}</p>
        </header>

        {loading && <div className="blog__loading">{t("blog.loading") || "Đang tải bài viết..."}</div>}
        {error && <div className="blog__error" role="alert">{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div className="blog__empty">{t("blog.empty") || "Không có bài viết nào trong danh mục này."}</div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            {/* Top Highlight Grid */}
            <section className="blog__top-grid">
              {featuredPost && (
                <div className="blog__top-featured">
                  <Link to={`/bai-viet/${featuredPost.BaiVietID || featuredPost.id}`} className="blog__top-featured-img">
                    <img src={featuredPost.HinhAnh} alt={featuredPost.TieuDe} />
                    <span className="blog__badge-main">{t("blog.featured") || "Tiêu Điểm"}</span>
                  </Link>
                  <div className="blog__top-featured-body">
                    <h2>
                      <Link to={`/bai-viet/${featuredPost.BaiVietID || featuredPost.id}`}>{featuredPost.TieuDe}</Link>
                    </h2>
                    <p>{featuredPost.TomTat}</p>
                    <time>{new Date(featuredPost.TaoLuc).toLocaleDateString(language === "en" ? "en-US" : "vi-VN")}</time>
                  </div>
                </div>
              )}

              <div className="blog__top-side-list">
                {rightFeaturedPosts.map((post) => (
                  <article key={post.BaiVietID} className="blog__top-side-item">
                    <Link to={`/bai-viet/${post.BaiVietID || post.id}`} className="blog__top-side-item-img">
                      <img src={post.HinhAnh} alt={post.TieuDe} />
                    </Link>
                    <div className="blog__top-side-item-content">
                      <h3>
                        <Link to={`/bai-viet/${post.BaiVietID || post.id}`}>{post.TieuDe}</Link>
                      </h3>
                      <time>{new Date(post.TaoLuc).toLocaleDateString(language === "en" ? "en-US" : "vi-VN")}</time>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Categories Circular Block */}
            {categories.length > 0 && (
              <section className="blog__categories-section">
                <h3 className="blog__categories-title">{t("blog.categories") || "Chuyên mục"}</h3>
                <div className="blog__categories-grid">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="blog__cat-circle-card">
                      <div className="blog__cat-circle-icon">
                        {cat.icon}
                      </div>
                      <span>{getCategoryLabel(cat.label)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Main Section: Left List + Right Sidebar */}
            <div className="blog__layout">
              {/* Left Column: Vertical cards list */}
              <div className="blog__list">
                <h3 className="blog__section-heading">
                  {getSectionHeading(location.pathname)}
                </h3>
                
                {(mainPosts.length > 0 ? mainPosts : posts).map((post) => {
                  const id = post.BaiVietID ?? post.id ?? post.Slug;
                  return (
                    <article key={id} className="blog__post-card-horizontal">
                      <Link to={`/bai-viet/${id}`} className="blog__post-card-horizontal-img">
                        <img src={post.HinhAnh} alt={post.TieuDe} />
                      </Link>
                      <div className="blog__post-card-horizontal-body">
                        <span className="blog__post-card-horizontal-tag">
                          {post.DanhMuc || (post.Loai === "Wiki" ? (t("nav.wiki") || "Wiki") : post.Loai === "PhanTich" ? (t("nav.analysis") || "Phân tích") : (t("nav.news") || "Tin tức"))}
                        </span>
                        <h2>
                          <Link to={`/bai-viet/${id}`}>{post.TieuDe}</Link>
                        </h2>
                        <p>{post.TomTat}</p>
                        <div className="blog__post-card-horizontal-meta">
                          <time>{new Date(post.TaoLuc).toLocaleDateString(language === "en" ? "en-US" : "vi-VN")}</time>
                          <Link to={`/bai-viet/${id}`} className="blog__post-card-horizontal-more">
                            {t("common.viewDetail") || "Xem chi tiết"} <FaChevronRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Right Column: Sidebar */}
              <aside className="blog__sidebar">
                {/* 1. Most viewed */}
                <div className="blog__sidebar-widget widget-top-views">
                  <h3 className="blog__sidebar-title">{t("blog.mostViewed") || "Bài viết được xem nhiều nhất"}</h3>
                  <ol className="blog__top-views-list">
                    {posts.slice(0, 5).map((post, idx) => (
                      <li key={post.BaiVietID}>
                        <span className="idx-number">{idx + 1}</span>
                        <Link to={`/bai-viet/${post.BaiVietID}`}>{post.TieuDe}</Link>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 2. Hot Cities Map */}
                <div className="blog__sidebar-widget widget-cities">
                  <h3 className="blog__sidebar-title">{t("blog.hotMarkets") || "Thị trường sôi động nhất"}</h3>
                  <div className="city-cards-grid">
                    <Link to="/nha-dat-ban?KhuVucID=1" className="city-mini-card hanoi">
                      <span>Hà Nội</span>
                    </Link>
                    <Link to="/nha-dat-ban?KhuVucID=2" className="city-mini-card hcm">
                      <span>TP. HCM</span>
                    </Link>
                  </div>
                </div>

                {/* 3. Popular Places List */}
                <div className="blog__sidebar-widget widget-popular-places">
                  <h3 className="blog__sidebar-title">{t("blog.popularMarkets") || "Thị trường BĐS phổ biến"}</h3>
                  <ul className="places-list">
                    {[
                      { name: "Bình Dương", count: "1.250+", link: "/nha-dat-ban?KhuVucID=3" },
                      { name: "Đà Nẵng", count: "980+", link: "/nha-dat-ban?KhuVucID=4" },
                      { name: "Đồng Nai", count: "870+", link: "/nha-dat-ban?KhuVucID=5" },
                      { name: "Khánh Hòa", count: "540+", link: "/nha-dat-ban?KhuVucID=6" },
                      { name: "Hải Phòng", count: "480+", link: "/nha-dat-ban?KhuVucID=7" },
                      { name: "Long An", count: "390+", link: "/nha-dat-ban?KhuVucID=8" },
                    ].map((place, idx) => (
                      <li key={idx}>
                        <Link to={place.link}>
                          <span>📍 {place.name}</span>
                          <span className="badge-count">{place.count} {t("blog.listingsCount") || "tin"}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Blog;
