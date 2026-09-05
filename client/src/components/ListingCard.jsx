import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { getStaticUrl } from "../config/api";

function ListingCard({ tinDang, onAddFavorite, t, lazy = false, disabled = false }) {
  const tinId = tinDang.TinDangID ?? tinDang.id ?? tinDang._id;
  const imgSrc = getListingImage(tinDang);
  const areaText = tinDang.DienTich ? `${tinDang.DienTich} m²` : "—";
  const title = tinDang.TieuDe || "Tin đăng bất động sản";
  const detailUrl = `/tin-dang/${tinId}`;

  return (
    <article className="featured-card">
      <div className="featured-card__image-wrap">
        <Link to={detailUrl} className="featured-card__image" aria-label={`Xem chi tiết: ${title}`}>
          <img src={imgSrc} alt={title} loading={lazy ? "lazy" : "eager"} decoding="async" />
        </Link>
        <button
          type="button"
          className="featured-card__favorite"
          onClick={() => onAddFavorite(tinDang)}
          disabled={disabled}
          aria-label={t("homepage.addToFavorites") || "Thêm vào yêu thích"}
        >
          ♥
        </button>
      </div>
      <div className="featured-card__content">
        <h3 className="featured-card__title">
          <Link to={detailUrl}>{title}</Link>
        </h3>
        <div className="featured-card__meta-row">
          <div className="featured-card__price">{formatPrice(tinDang.Gia)}</div>
          <div className="featured-card__area">{areaText}</div>
        </div>
        <address className="featured-card__location">
          <FaMapMarkerAlt size={12} aria-hidden="true" /> {tinDang.full_display_address || tinDang.DiaChi || [tinDang.TenKhuVuc, tinDang.TenQuanHuyen, tinDang.TenTinh].filter(Boolean).join(', ') || "Đang cập nhật vị trí"}
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