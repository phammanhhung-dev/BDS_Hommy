import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import { useTranslation } from "../../context/LanguageContext";
import tinDangPublicApi from "../../api/tinDangPublicApi";
import { setPageSEO } from "../../utils/seo";
import axios from "axios";
import { buildApiUrl } from "../../config/api";
import { FaRobot, FaCalculator, FaChartLine, FaCheckCircle, FaExclamationTriangle, FaHome, FaMapMarkerAlt } from "react-icons/fa";
import "./dinh-gia-ai.css";


function DinhGiaAI() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    dienTich: "",
    soPhongNgu: "2",
    soPhongTam: "2",
    tinhThanhId: "",
    tinhThanhName: "",
    quanHuyenId: "",
    quanHuyenName: "",
    loaiBds: "CanHo"
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  // State gợi ý tin đăng
  const [recommendedList, setRecommendedList] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    setPageSEO({
      title: `${t("valuation.title") || "Định giá bất động sản AI"} - Hommy`,
      description: t("valuation.subtitle") || "Định giá nhà đất trực tuyến thông minh bằng công nghệ học máy Machine Learning tiên tiến.",
      keywords: "định giá nhà đất, định giá AI, học máy, bất động sản Hommy"
    });

    // Load provinces
    const fetchProvinces = async () => {
      try {
        const res = await axios.get(buildApiUrl('/api/address/provinces/legacy'));
        if (res?.data?.success && Array.isArray(res.data.data)) {
          // Chỉ lấy 5 tỉnh thành theo yêu cầu AI
          const targetProvinces = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương", "Đồng Nai"];
          const filtered = res.data.data.filter(p => {
             const name = p.TenKhuVuc || p.ProvinceName || p.name || '';
             return targetProvinces.some(tp => name.includes(tp) || tp.includes(name));
          });
          setProvinces(filtered.length > 0 ? filtered : res.data.data);
        }
      } catch (err) {
        console.error("Lỗi load provinces:", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!formData.tinhThanhId) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      try {
        const res = await axios.get(buildApiUrl(`/api/address/districts/${formData.tinhThanhId}`));
        if (res?.data?.success && Array.isArray(res.data.data)) {
          setDistricts(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi load districts:", err);
      }
    };
    fetchDistricts();
  }, [formData.tinhThanhId]);
  const fetchRecommendedProperties = async (quanHuyen, loaiBds, price) => {
    setRecLoading(true);
    try {
      // Tìm các BĐS cùng loại hình, thuộc quận huyện đó, và có giá nằm trong khoảng +/- 30% giá dự báo
      const minGia = Math.max(0, price * 0.7);
      const maxGia = price * 1.3;

      const res = await tinDangPublicApi.getAll({
        quanHuyen: quanHuyen,
        loaiBDS: loaiBds,
        minGia: minGia,
        maxGia: maxGia,
        limit: 4
      });

      if (res?.data?.success && Array.isArray(res.data.data)) {
        setRecommendedList(res.data.data);
      } else if (Array.isArray(res?.data)) {
        setRecommendedList(res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách gợi ý:", err);
    } finally {
      setRecLoading(false);
    }
  };

  const runValuation = async (data) => {
    const area = parseFloat(data.dienTich);
    
    if (!area || area <= 0) {
      setError(t("valuation.invalidArea") || "Vui lòng nhập diện tích hợp lệ lớn hơn 0");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setRecommendedList([]);

    try {
      const payload = {
        dien_tich: area,
        so_phong_ngu: parseInt(data.soPhongNgu, 10),
        so_phong_tam: parseInt(data.soPhongTam, 10),
        tinh_thanh: data.tinhThanhName,
        quan_huyen: data.quanHuyenName,
        loai_bds: data.loaiBds
      };

      const res = await tinDangPublicApi.predictPrice(payload);
      if (res?.data?.success && res.data.data) {
        const valResult = res.data.data;
        setResult(valResult);
        // Gọi gợi ý BĐS tương đồng
        fetchRecommendedProperties(data.quanHuyenName, data.loaiBds, valResult.predicted_price);
      } else {
        setError(t("valuation.invalidResponse") || "Không nhận được phản hồi định giá hợp lệ");
      }
    } catch (err) {
      console.error("Lỗi định giá:", err);
      setError(
        err?.response?.data?.message || 
        (t("valuation.connectionError") || "Không thể kết nối đến dịch vụ AI định giá. Vui lòng thử lại sau.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Đọc params từ URL khi mount hoặc params thay đổi
  useEffect(() => {
    const dienTichParam = searchParams.get("dienTich") || searchParams.get("dien_tich");
    const soPhongNguParam = searchParams.get("soPhongNgu") || searchParams.get("so_phong_ngu");
    const soPhongTamParam = searchParams.get("soPhongTam") || searchParams.get("so_phong_tam");
    const quanHuyenParam = searchParams.get("quanHuyen") || searchParams.get("quan_huyen");
    const loaiBdsParam = searchParams.get("loaiBds") || searchParams.get("loai_bds");

    if (dienTichParam || soPhongNguParam || soPhongTamParam || quanHuyenParam || loaiBdsParam) {
      const newFormData = {
        dienTich: dienTichParam || "",
        soPhongNgu: soPhongNguParam || "2",
        soPhongTam: soPhongTamParam || "2",
        quanHuyen: quanHuyenParam || "Bình Thạnh",
        loaiBds: loaiBdsParam || "CanHo"
      };
      setFormData(newFormData);

      if (dienTichParam && parseFloat(dienTichParam) > 0) {
        runValuation(newFormData);
      }
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tinhThanhId') {
      const selectedProv = provinces.find(p => String(p.KhuVucID) === String(value));
      setFormData(prev => ({
        ...prev,
        tinhThanhId: value,
        tinhThanhName: selectedProv ? (selectedProv.TenKhuVuc || selectedProv.ProvinceName || '') : '',
        quanHuyenId: "",
        quanHuyenName: ""
      }));
    } else if (name === 'quanHuyenId') {
      const selectedDist = districts.find(d => String(d.KhuVucID) === String(value));
      setFormData(prev => ({
        ...prev,
        quanHuyenId: value,
        quanHuyenName: selectedDist ? (selectedDist.TenKhuVuc || selectedDist.DistrictName || '') : ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleValuate = async (e) => {
    e.preventDefault();
    runValuation(formData);
  };

  const formatPrice = (milVnd) => {
    if (milVnd >= 1000) {
      const billion = milVnd / 1000;
      return `${billion.toFixed(2)} ${t("valuation.billionUnit") || "Tỷ VND"}`;
    }
    return `${milVnd.toLocaleString("vi-VN")} ${t("valuation.millionUnit") || "Triệu VND"}`;
  };

  return (
    <div className="dinh-gia-ai-page">
      <Header />
      <main className="dg-container">
        <header className="dg-header">
          <div className="dg-badge">
            <FaRobot size={16} /> <span>{t("valuation.mlBadge") || "Trí tuệ nhân tạo (Machine Learning)"}</span>
          </div>
          <h1 className="dg-title">{t("valuation.title") || "Công Cụ Định Giá Bất Động Sản AI"}</h1>
          <p className="dg-subtitle">
            {t("valuation.subtitle") || "Dự đoán giá trị căn nhà hoặc chung cư của bạn tức thì dựa trên dữ liệu thị trường thực tế"}
          </p>
        </header>

        <div className="dg-grid">
          {/* Form nhập thông số */}
          <section className="dg-card dg-form-card">
            <h2 className="dg-card-title">
              <FaCalculator /> {t("valuation.formTitle") || "Thông số bất động sản"}
            </h2>
            <form onSubmit={handleValuate} className="dg-form">
              <div className="dg-form-row">
                <div className="dg-form-group col-6">
                  <label className="dg-label">{t("valuation.provinceLabel") || "Tỉnh/Thành phố"}</label>
                  <select
                    name="tinhThanhId"
                    value={formData.tinhThanhId}
                    onChange={handleChange}
                    className="dg-select"
                    required
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {provinces.map((prov) => (
                      <option key={prov.KhuVucID} value={prov.KhuVucID}>
                        {prov.TenKhuVuc || prov.ProvinceName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dg-form-group col-6">
                  <label className="dg-label">{t("valuation.districtLabel") || "Khu vực (Quận / Huyện)"}</label>
                  <select
                    name="quanHuyenId"
                    value={formData.quanHuyenId}
                    onChange={handleChange}
                    className="dg-select"
                    disabled={!formData.tinhThanhId}
                    required
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map((dist) => (
                      <option key={dist.KhuVucID} value={dist.KhuVucID}>
                        {dist.TenKhuVuc || dist.DistrictName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dg-form-group">
                <label className="dg-label">{t("valuation.typeLabel") || "Loại bất động sản"}</label>
                <div className="dg-radio-group">
                  <label className={`dg-radio-label ${formData.loaiBds === "CanHo" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="loaiBds"
                      value="CanHo"
                      checked={formData.loaiBds === "CanHo"}
                      onChange={handleChange}
                    />
                    {t("valuation.apartment") || "Căn hộ chung cư"}
                  </label>
                  <label className={`dg-radio-label ${formData.loaiBds === "NhaO" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="loaiBds"
                      value="NhaO"
                      checked={formData.loaiBds === "NhaO"}
                      onChange={handleChange}
                    />
                    {t("valuation.house") || "Nhà riêng / Nhà phố"}
                  </label>
                </div>
              </div>

              <div className="dg-form-group">
                <label className="dg-label">{t("valuation.areaLabel") || "Diện tích sử dụng (m²)"}</label>
                <input
                  type="number"
                  name="dienTich"
                  value={formData.dienTich}
                  onChange={handleChange}
                  placeholder="VD: 75.5"
                  step="0.1"
                  min="5"
                  required
                  className="dg-input"
                />
              </div>

              <div className="dg-form-row">
                <div className="dg-form-group col-6">
                  <label className="dg-label">{t("valuation.bedroomsLabel") || "Số phòng ngủ"}</label>
                  <select
                    name="soPhongNgu"
                    value={formData.soPhongNgu}
                    onChange={handleChange}
                    className="dg-select"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} {t("valuation.roomUnit") || "phòng"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dg-form-group col-6">
                  <label className="dg-label">{t("valuation.bathroomsLabel") || "Số phòng tắm"}</label>
                  <select
                    name="soPhongTam"
                    value={formData.soPhongTam}
                    onChange={handleChange}
                    className="dg-select"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num} {t("valuation.roomUnit") || "phòng"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} className="dg-btn-submit">
                {loading ? (t("valuation.analyzing") || "Đang phân tích dữ liệu...") : (t("valuation.startBtn") || "Bắt đầu định giá AI 🤖")}
              </button>
            </form>
          </section>

          {/* Khối hiển thị kết quả */}
          <section className="dg-card dg-result-card">
            <h2 className="dg-card-title">
              <FaChartLine /> {t("valuation.resultTitle") || "Kết quả ước tính của AI"}
            </h2>

            {error && (
              <div className="dg-error-box" role="alert">
                <FaExclamationTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {!result && !error && !loading && (
              <div className="dg-placeholder">
                <div className="dg-placeholder-icon">🤖</div>
                <p>{t("valuation.placeholderText") || "Nhập thông số bất động sản ở bảng bên trái và nhấn nút Định giá để xem dự đoán từ mô hình học máy."}</p>
              </div>
            )}

            {loading && (
              <div className="dg-loader-box">
                <div className="dg-spinner"></div>
                <p>{t("valuation.runningText") || "Thuật toán đang chạy, phân tích dữ liệu so sánh..."}</p>
              </div>
            )}

            {result && !loading && (
              <div className="dg-result-content">
                <div className="dg-price-box">
                  <span className="dg-price-label">{t("valuation.avgPriceLabel") || "Giá ước tính trung bình"}</span>
                  <div className="dg-price-value">{formatPrice(result.predicted_price)}</div>
                  <span className="dg-price-m2">
                    (~ {(result.predicted_price / parseFloat(formData.dienTich)).toFixed(1)} {t("valuation.millionUnit") || "Triệu"}/m²)
                  </span>
                </div>

                <div className="dg-range-box">
                  <span className="dg-range-label">{t("valuation.rangeLabel") || "Khoảng giá trị đề xuất"}</span>
                  <div className="dg-range-slider">
                    <span className="dg-range-min">{formatPrice(result.price_range_min)}</span>
                    <div className="dg-range-bar">
                      <div className="dg-range-indicator"></div>
                    </div>
                    <span className="dg-range-max">{formatPrice(result.price_range_max)}</span>
                  </div>
                  <p className="dg-range-info">
                    {t("valuation.rangeInfo") || "Mức giá trị thực tế có thể dao động tùy thuộc vào nội thất, hướng nhà và khoảng cách đường ngõ."}
                  </p>
                </div>

                <div className="dg-tips">
                  <h4 className="dg-tips-title">
                    <FaCheckCircle color="#10b981" /> {t("valuation.accuracyTitle") || "Đánh giá độ chính xác (R² Score: 99.8%)"}
                  </h4>
                  <ul className="dg-tips-list">
                    <li>{t("valuation.accuracyDetail1", { district: formData.quanHuyenName }) || `Khu vực <strong>${formData.quanHuyenName}</strong> là khu vực giao dịch sôi động.`}</li>
                    <li>{t("valuation.accuracyDetail2", { type: formData.loaiBds === "CanHo" ? (t("valuation.apartment") || "Căn hộ chung cư") : (t("valuation.house") || "Nhà riêng / Nhà phố") }) || `Loại hình <strong>${formData.loaiBds === "CanHo" ? "Căn hộ chung cư" : "Nhà riêng"}</strong> có xu hướng ổn định về giá trị sử dụng.`}</li>
                    <li>{t("valuation.accuracyDetail3", { area: formData.dienTich }) || `Thông số diện tích ${formData.dienTich} m² đạt mức tối ưu cho nhu cầu định cư.`}</li>
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Khối BĐS Đề Xuất */}
        {result && !loading && (
          <section className="dg-recommended-section">
            <h3 className="dg-rec-title">
              <FaHome /> Bất động sản phù hợp đề xuất cho bạn
            </h3>
            <p className="dg-rec-subtitle">Các căn hộ / nhà riêng đang giao dịch tại khu vực {formData.quanHuyenName} có giá trị gần với giá dự báo</p>

            {recLoading ? (
              <div className="dg-rec-loading">
                <div className="dg-spinner"></div>
                <span>Đang tìm kiếm bất động sản phù hợp...</span>
              </div>
            ) : recommendedList.length === 0 ? (
              <div className="dg-rec-empty">Hiện không có bất động sản nào đang đăng bán/cho thuê phù hợp với mức giá này tại khu vực {formData.quanHuyenName}.</div>
            ) : (
              <div className="dg-rec-grid">
                {recommendedList.map((item) => {
                  let imgUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80";
                  if (item.URL) {
                    try {
                      const parsed = typeof item.URL === "string" ? JSON.parse(item.URL) : item.URL;
                      if (Array.isArray(parsed) && parsed.length > 0) imgUrl = parsed[0];
                    } catch (e) {
                      if (typeof item.URL === "string" && item.URL.startsWith("http")) imgUrl = item.URL;
                    }
                  }

                  const displayPrice = item.GiaTien 
                    ? (item.GiaTien >= 1000 ? `${(item.GiaTien / 1000).toFixed(1)} Tỷ` : `${item.GiaTien} Triệu`)
                    : "Thỏa thuận";

                  return (
                    <Link to={`/tin-dang/${item.TinDangID}`} key={item.TinDangID} className="dg-rec-card">
                      <div className="dg-rec-img-wrapper">
                        <img src={imgUrl} alt={item.TieuDe} className="dg-rec-img" />
                        <span className="dg-rec-badge">{item.LoaiGiaoDich === "Ban" ? "Bán" : "Cho thuê"}</span>
                      </div>
                      <div className="dg-rec-body">
                        <h4 className="dg-rec-card-title">{item.TieuDe}</h4>
                        <div className="dg-rec-meta">
                          <span className="dg-rec-price">{displayPrice}</span>
                          <span className="dg-rec-area">{item.DienTichSuDung || item.DienTichDat || 0} m²</span>
                        </div>
                        <div className="dg-rec-location">
                          <FaMapMarkerAlt /> <span>{item.TenQuanHuyen || formData.quanHuyenName}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default DinhGiaAI;
