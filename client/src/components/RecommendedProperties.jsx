import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import tinDangPublicApi from "../api/tinDangPublicApi";
import yeuThichApi from "../api/yeuThichApi";
import { getRecentViewedIds, addRecentViewedId } from "../utils/recentViews";
import { getStaticUrl } from "../config/api";
import { useFavoriteToggle, getCurrentUserId } from "../hooks/useFavoriteToggle";
import "./RecommendedProperties.css";

// Helper định dạng tiền tệ
const formatPrice = (g) => {
  if (!g) return "Thỏa thuận";
  const n = Number(g);
  if (isNaN(n) || n === 0) return "Thỏa thuận";
  if (n >= 1_000_000_000) {
    const ty = n / 1_000_000_000;
    return `${ty % 1 === 0 ? ty : ty.toFixed(2).replace(/\.?0+$/, "")} Tỷ`;
  }
  if (n >= 1_000_000) {
    const trieu = n / 1_000_000;
    return `${trieu % 1 === 0 ? trieu : trieu.toFixed(1).replace(/\.?0+$/, "")} Triệu`;
  }
  return `${n.toLocaleString("vi-VN")} VNĐ`;
};

// Helper lấy ảnh đại diện sắc nét
const getListingImage = (tin) => {
  const placeholder = "/assets/images/no-image.svg";
  const raw = tin?.URL ?? tin?.Img ?? tin?.Images ?? tin?.images;
  if (!raw) return placeholder;

  let first = null;
  if (Array.isArray(raw)) {
    first = raw.find(Boolean);
  } else if (typeof raw === "string") {
    const s = raw.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) first = parsed.find(Boolean);
      } catch {
        first = s;
      }
    } else {
      first = s;
    }
  }

  if (!first) return placeholder;
  return getStaticUrl(first) || placeholder;
};

export default function RecommendedProperties({ title, limit = 4 }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { handleToggleFavorite, toastMessage, favoriteLoadingId } = useFavoriteToggle(setProperties);

  const navigate = useNavigate();

  // Tải danh sách BĐS gợi ý
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getCurrentUserId();
      const recentViewedIds = getRecentViewedIds();

      const params = { limit };
      if (userId) params.userId = userId;
      if (recentViewedIds.length > 0) {
        params.recent_viewed_ids = recentViewedIds.join(",");
      }

      const response = await tinDangPublicApi.getRecommended(params);
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setProperties(response.data.data);
      } else {
        setProperties([]);
      }
    } catch (err) {
      console.error("[RecommendedProperties] Error fetching recommendations:", err);
      setError("Không thể tải danh sách gợi ý lúc này.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  // Xử lý khi click vào Card: Ghi nhận vào recent_viewed_ids
  const handleCardClick = (tinId) => {
    addRecentViewedId(tinId);
  };

  return (
    <section className="recommended-section section--light" aria-labelledby="rec-section-title">
      <div className="container recommended-container">
        {/* Header Section: Tiêu đề và link xem tất cả */}
        <div className="recommended-header">
          <div className="recommended-header__text">
            <h2 id="rec-section-title" className="recommended-header__title text-gray-900 dark:text-white">
              {title || "Bất động sản dành cho bạn"}
            </h2>
          </div>

          <div className="recommended-header__actions">
            <Link
              to="/nha-dat-cho-thue?recommend=1"
              className="recommended-view-all text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Xem tất cả</span>
              <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Toast thông báo nhanh */}
        {toastMessage && (
          <div className="rec-toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        )}

        {/* Content Section: Loading Skeleton / Error / Property Grid Layout */}
        {loading ? (
          <div className="recommended-grid">
            {[1, 2, 3, 4].slice(0, limit).map((n) => (
              <div
                key={n}
                className="rec-card rec-card--skeleton bg-white border border-gray-200 dark:bg-[#161f36] dark:border-slate-700"
              >
                <div className="rec-card__image-wrap skeleton-box bg-gray-200 dark:bg-slate-800" />
                <div className="rec-card__content">
                  <div className="skeleton-line bg-gray-200 dark:bg-slate-700/60" style={{ width: "85%", height: "18px", marginBottom: "8px" }} />
                  <div className="skeleton-line bg-gray-200 dark:bg-slate-700/60" style={{ width: "50%", height: "20px", marginBottom: "8px" }} />
                  <div className="skeleton-line bg-gray-200 dark:bg-slate-700/60" style={{ width: "70%", height: "14px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="recommended-fallback-box bg-white border border-dashed border-gray-300 text-gray-600 dark:bg-[#161f36] dark:border-slate-700 dark:text-slate-400">
            <p>{error}</p>
            <button type="button" onClick={fetchRecommendations} className="recommended-retry-btn">
              Thử lại
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="recommended-fallback-box bg-white border border-dashed border-gray-300 text-gray-600 dark:bg-[#161f36] dark:border-slate-700 dark:text-slate-400">
            <p>Hiện chưa có bất động sản gợi ý phù hợp.</p>
          </div>
        ) : (
          <div
            className="recommended-grid"
            role="region"
            aria-label="Danh sách bất động sản gợi ý"
          >
            {properties.slice(0, 4).map((tinDang) => {
              const tinId = tinDang.TinDangID ?? tinDang.id;
              const detailUrl = `/tin-dang/${tinId}`;
              const imgSrc = getListingImage(tinDang);
              const titleText = tinDang.TieuDe || "Tin đăng bất động sản";
              const areaText = tinDang.DienTich ? `${tinDang.DienTich} m²` : (tinDang.DienTichSuDung ? `${tinDang.DienTichSuDung} m²` : "—");
              const priceText = formatPrice(tinDang.GiaTien || tinDang.Gia);
              const addressText = tinDang.DiaChi || [tinDang.TenKhuVuc, tinDang.TenQuanHuyen, tinDang.TenTinh].filter(Boolean).join(", ") || "Đang cập nhật vị trí";

              return (
                <article
                  key={tinId}
                  className="rec-card bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#161f36] dark:border-slate-700 dark:hover:border-blue-500/40"
                  onClick={() => handleCardClick(tinId)}
                >
                  <div className="rec-card__image-wrap bg-gray-100 dark:bg-[#0b1329]">
                    <Link
                      to={detailUrl}
                      className="rec-card__image-link"
                      aria-label={`Xem chi tiết ${titleText}`}
                      tabIndex={-1}
                    >
                      <img
                        src={imgSrc}
                        alt={titleText}
                        className="rec-card__image"
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>

                    {/* Nút tim lưu nhanh: Light Mode (bg-white/90 shadow-sm border-gray-100) vs Dark Mode (dark:bg-black/40 dark:border-white/20) */}
                    <button
                      type="button"
                      className={`rec-card__favorite-btn bg-white/90 shadow-sm border border-gray-100 text-gray-600 hover:text-red-500 hover:border-gray-200 dark:bg-black/40 dark:border-white/20 dark:text-white/80 dark:hover:text-red-500 dark:hover:border-white/40 ${
                        tinDang.isFavorite ? "is-active text-red-500 border-red-500/40" : ""
                      }`}
                      onClick={(e) => handleToggleFavorite(e, tinDang)}
                      disabled={favoriteLoadingId === tinId}
                      aria-label={tinDang.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    >
                      {tinDang.isFavorite ? (
                        <FaHeart className="heart-icon heart-active text-[#ef4444]" aria-hidden="true" />
                      ) : (
                        <FaRegHeart className="heart-icon" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <div className="rec-card__content">
                    <h3 className="rec-card__title">
                      <Link
                        to={detailUrl}
                        title={titleText}
                        className="text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                      >
                        {titleText}
                      </Link>
                    </h3>

                    <div className="rec-card__meta-row">
                      <div className="rec-card__price text-rose-600 dark:text-rose-500 font-extrabold">{priceText}</div>
                      <div className="rec-card__area text-gray-600 bg-gray-100 border border-transparent dark:text-slate-400 dark:bg-white/10 dark:border-white/5">
                        {areaText}
                      </div>
                    </div>

                    <address className="rec-card__location text-gray-600 dark:text-slate-400" title={addressText}>
                      <FaMapMarkerAlt className="rec-card__pin-icon text-gray-400 dark:text-slate-500" aria-hidden="true" />
                      <span>{addressText}</span>
                    </address>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
