import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import { getStaticUrl } from "../config/api";
import "./RecommendedProperties.css";

function ListingCard({ tinDang, onAddFavorite, t, lazy = false, disabled = false }) {
  const tinId = tinDang.TinDangID ?? tinDang.id ?? tinDang._id;
  const imgSrc = getListingImage(tinDang);
  const areaText = tinDang.DienTich ? `${tinDang.DienTich} m²` : (tinDang.DienTichSuDung ? `${tinDang.DienTichSuDung} m²` : "—");
  const title = tinDang.TieuDe || "Tin đăng bất động sản";
  const detailUrl = `/tin-dang/${tinId}`;
  const priceText = formatPrice(tinDang.GiaTien || tinDang.Gia);
  const addressText = tinDang.full_display_address || tinDang.DiaChi || [tinDang.TenKhuVuc, tinDang.TenQuanHuyen, tinDang.TenTinh].filter(Boolean).join(', ') || "Đang cập nhật vị trí";

  return (
    <article
      className="rec-card bg-white border border-gray-200 hover:border-gray-300 dark:bg-[#161f36] dark:border-slate-700 dark:hover:border-blue-500/40"
    >
      <div className="rec-card__image-wrap bg-gray-100 dark:bg-[#0b1329]">
        <Link
          to={detailUrl}
          className="rec-card__image-link"
          aria-label={`Xem chi tiết ${title}`}
        >
          <img
            src={imgSrc}
            alt={title}
            className="rec-card__image"
            loading={lazy ? "lazy" : "eager"}
            decoding="async"
          />
        </Link>

        {/* Nút tim lưu nhanh */}
        <button
          type="button"
          className={`rec-card__favorite-btn bg-white/90 shadow-sm border border-gray-100 text-gray-600 hover:text-red-500 hover:border-gray-200 dark:bg-black/40 dark:border-white/20 dark:text-white/80 dark:hover:text-red-500 dark:hover:border-white/40 ${
            tinDang.isFavorite ? "is-active text-red-500 border-red-500/40" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onAddFavorite && onAddFavorite(tinDang);
          }}
          disabled={disabled}
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
            title={title}
            className="text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
          >
            {title}
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
}

function formatPrice(g) {
  if (!g) return "Thỏa thuận";
  const n = Number(g);
  if (isNaN(n)) return g;
  if (n >= 1_000_000_000) {
    const ty = n / 1_000_000_000;
    return `${ty % 1 === 0 ? ty : ty.toFixed(2).replace(/\.?0+$/, '')} Tỷ`;
  }
  if (n >= 1_000_000) {
    const trieu = n / 1_000_000;
    return `${trieu % 1 === 0 ? trieu : trieu.toFixed(1).replace(/\.?0+$/, '')} Triệu`;
  }
  return n.toLocaleString("vi-VN") + " VNĐ";
}

function getListingImage(tin) {
  const placeholder = "/assets/images/no-image.svg";
  const raw = tin?.URL ?? tin?.Img ?? tin?.Images ?? tin?.images;
  if (!raw) return placeholder;

  const normalizeList = (input) => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      const s = input.trim();
      if (s.startsWith("[") && s.endsWith("]")) {
        try {
          const parsed = JSON.parse(s);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [s];
        }
      }
      return [s];
    }
    return [input];
  };

  const first = normalizeList(raw).find(Boolean);
  if (!first) return placeholder;
  return getStaticUrl(first) || placeholder;
}

export default ListingCard;