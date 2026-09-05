import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";
import "./footer.css";
import HommyLogoIcon from "../assets/images/Hommy_Logo_Icon.svg";

const SocialLink = ({ href, label, children }) => (
  <a
    className="social-btn"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
  >
    {children}
    <span className="sr-only">{label}</span>
  </a>
);

function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    setTimeout(() => {
      setEmail("");
      setSent(false);
    }, 2200);
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-about">
            <p className="footer-brand">
              <img src={HommyLogoIcon} alt="Logo Hommy - Nền tảng bất động sản" className="footer-logo" width="40" height="40" />
              <span>{t("footer.brand") || "Hommy BĐS"}</span>
            </p>
            <p className="muted">
              {t("footer.tagline") || "Tìm kiếm và quản lý bất động sản nhanh chóng — an toàn, tiện lợi."}
            </p>
            <address className="contact">
              <a href="tel:+84349195610">0356960304</a>
              <a href="mailto:tuanpham11255@gmail.com">batdongsanhommy@gmail.com</a>
            </address>
          </div>
          <nav className="footer-links" aria-label={t("footer.quickLinks") || "Liên kết nhanh"}>
            <h3>{t("footer.quickLinks") || "Liên kết nhanh"}</h3>
            <ul>
              <li><Link to="/">{t("header.home") || "Trang chủ"}</Link></li>
              <li><Link to="/nha-dat-ban">{t("nav.sell") || "Nhà đất bán"}</Link></li>
              <li><Link to="/nha-dat-cho-thue">{t("nav.rent") || "Nhà đất cho thuê"}</Link></li>
              <li><Link to="/tin-tuc-bds">{t("nav.news") || "Tin tức BĐS"}</Link></li>
              <li><Link to="/bang-gia">{t("header.priceList") || "Bảng giá"}</Link></li>
            </ul>
          </nav>
          <div className="footer-news">
            <h3>{t("footer.notify") || "Nhận thông báo"}</h3>
            <p className="muted">
              {t("footer.subscribeDesc") || "Đăng ký nhận tin khuyến mãi và cập nhật mới."}
            </p>
            <form className="subscribe-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder") || "Nhập email của bạn"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
              <button type="submit" className="btn-primary">
                {sent ? (t("footer.subscribed") || "Đã gửi") : (t("footer.subscribe") || "Đăng ký")}
              </button>
            </form>

            <div className="social-links">
              <SocialLink href="https://facebook.com" label="Facebook">
                <img
                  src="https://event.cafeland.vn/event/app/images/facebook.png"
                  alt="Facebook"
                  className="icon"
                />
              </SocialLink>

              <SocialLink href="https://twitter.com" label="Twitter">
                <img
                  src="https://event.cafeland.vn/event/app/images/twitter.png"
                  alt="Twitter"
                  className="icon"
                />
              </SocialLink>

              <SocialLink href="https://instagram.com" label="Instagram">
                <img
                  src="https://event.cafeland.vn/event/app/images/google.png"
                  alt="Instagram"
                  className="icon"
                />
              </SocialLink>

              <SocialLink href="https://youtube.com" label="YouTube">
                <img
                  src="https://event.cafeland.vn/event/app/images/linkedin.png"
                  alt="YouTube"
                  className="icon"
                />
              </SocialLink>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {t("footer.copy") || "Hommy BĐS. All rights reserved."}
          </div>
          <div className="small-muted">
            {t("footer.mobileTagline") || "Thiết kế gọn nhẹ — trải nghiệm tối ưu trên mobile."}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
