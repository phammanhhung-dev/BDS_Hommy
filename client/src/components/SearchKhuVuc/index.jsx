import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import khuvucApi from "../../api/khuvucApi";
import { FaSearch, FaMapMarkerAlt, FaHome, FaDollarSign, FaRulerCombined } from "react-icons/fa";
import { useTranslation } from "../../context/LanguageContext";
import "./searchkhuvuc.css";

const LOAI_BDS_OPTIONS = [
  { value: "", label: "Tất cả nhà đất" },
  { value: "CanHo", label: "Căn hộ chung cư" },
  { value: "NhaO", label: "Nhà riêng / Nhà phố" },
  { value: "VanPhong", label: "Văn phòng / Mặt bằng" },
  { value: "DatNen", label: "Đất nền / Đất thổ cư" }
];

const GIA_OPTIONS = [
  { value: "", label: "Mức giá (Tất cả)" },
  { value: "under500", label: "Dưới 500 triệu" },
  { value: "500to1000", label: "500 triệu - 1 tỷ" },
  { value: "1000to2000", label: "1 tỷ - 2 tỷ" },
  { value: "2000to3000", label: "2 tỷ - 3 tỷ" },
  { value: "3000to5000", label: "3 tỷ - 5 tỷ" },
  { value: "5000to10000", label: "5 tỷ - 10 tỷ" },
  { value: "over10000", label: "Trên 10 tỷ" }
];

const DIEN_TICH_OPTIONS = [
  { value: "", label: "Diện tích (Tất cả)" },
  { value: "under30", label: "Dưới 30 m²" },
  { value: "30to50", label: "30 - 50 m²" },
  { value: "50to80", label: "50 - 80 m²" },
  { value: "80to120", label: "80 - 120 m²" },
  { value: "120to150", label: "120 - 150 m²" },
  { value: "150to200", label: "150 - 200 m²" },
  { value: "over200", label: "Trên 200 m²" }
];

function SearchKhuVuc({ onSearch }) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [loaiGiaoDich, setLoaiGiaoDich] = useState("Ban"); // 'Ban' hoặc 'Thue'
  const [tree, setTree] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loaiBds, setLoaiBds] = useState("");
  const [giaRange, setGiaRange] = useState("");
  const [dienTichRange, setDienTichRange] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    setLoading(true);
    try {
      const res = await khuvucApi.getTree();
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setTree(raw);
      setProvinces(raw);
    } catch (err) {
      console.error("Lỗi lấy khu vực:", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (e) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setSelectedDistrict(""); // reset district
    
    if (provinceId) {
      const found = tree.find(node => String(node.KhuVucID || node.id) === String(provinceId));
      setDistricts(found?.children || []);
    } else {
      setDistricts([]);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    // Map giá trị price range
    let minGia = null;
    let maxGia = null;
    if (giaRange === "under500") {
      maxGia = 500;
    } else if (giaRange === "500to1000") {
      minGia = 500;
      maxGia = 1000;
    } else if (giaRange === "1000to2000") {
      minGia = 1000;
      maxGia = 2000;
    } else if (giaRange === "2000to3000") {
      minGia = 2000;
      maxGia = 3000;
    } else if (giaRange === "3000to5000") {
      minGia = 3000;
      maxGia = 5000;
    } else if (giaRange === "5000to10000") {
      minGia = 5000;
      maxGia = 10000;
    } else if (giaRange === "over10000") {
      minGia = 10000;
    }

    // Map diện tích
    let minDienTich = null;
    let maxDienTich = null;
    if (dienTichRange === "under30") {
      maxDienTich = 30;
    } else if (dienTichRange === "30to50") {
      minDienTich = 30;
      maxDienTich = 50;
    } else if (dienTichRange === "50to80") {
      minDienTich = 50;
      maxDienTich = 80;
    } else if (dienTichRange === "80to120") {
      minDienTich = 80;
      maxDienTich = 120;
    } else if (dienTichRange === "120to150") {
      minDienTich = 120;
      maxDienTich = 150;
    } else if (dienTichRange === "150to200") {
      minDienTich = 150;
      maxDienTich = 200;
    } else if (dienTichRange === "over200") {
      minDienTich = 200;
    }

    const payload = {
      loaiGiaoDich,
      KhuVucID: selectedDistrict ? Number(selectedDistrict) : (selectedProvince ? Number(selectedProvince) : null),
      loaiBDS: loaiBds || null,
      minGia,
      maxGia,
      minDienTich,
      maxDienTich,
      keyword: keyword.trim() || null
    };

    console.log("[SearchKhuVuc] Dispatching payload:", payload);

    // Xây dựng query params
    const queryParams = new URLSearchParams();
    if (keyword.trim()) queryParams.set("keyword", keyword.trim());
    
    const locationVal = selectedDistrict || selectedProvince;
    if (locationVal) queryParams.set("KhuVucID", locationVal);
    
    if (loaiBds) queryParams.set("loaiBDS", loaiBds);
    
    if (minGia !== null) queryParams.set("minGia", minGia);
    if (maxGia !== null) queryParams.set("maxGia", maxGia);
    
    if (minDienTich !== null) queryParams.set("minDienTich", minDienTich);
    if (maxDienTich !== null) queryParams.set("maxDienTich", maxDienTich);

    const path = loaiGiaoDich === "Ban" ? "/nha-dat-ban" : "/nha-dat-cho-thue";
    const targetUrl = `${path}?${queryParams.toString()}`;
    
    navigate(targetUrl);

    if (typeof onSearch === "function") {
      onSearch(payload);
    }
  };

  const getBdsLabel = (opt) => {
    if (opt.value === "") return t("categories.all") || opt.label;
    if (opt.value === "CanHo") return t("categories.apartment") || opt.label;
    if (opt.value === "NhaO") return t("categories.townhouse") || opt.label;
    if (opt.value === "VanPhong") return t("categories.office") || opt.label;
    if (opt.value === "DatNen") return t("categories.land") || opt.label;
    return opt.label;
  };

  const getGiaLabel = (opt) => {
    if (opt.value === "") return t("search.allPrice") || opt.label;
    if (language === "en") {
      if (opt.value === "under500") return "Under 500 million";
      if (opt.value === "500to1000") return "500m - 1b";
      if (opt.value === "1000to2000") return "1b - 2b";
      if (opt.value === "2000to3000") return "2b - 3b";
      if (opt.value === "3000to5000") return "3b - 5b";
      if (opt.value === "5000to10000") return "5b - 10b";
      if (opt.value === "over10000") return "Over 10 billion";
    }
    return opt.label;
  };

  const getDienTichLabel = (opt) => {
    if (opt.value === "") return t("search.allArea") || opt.label;
    if (language === "en") {
      if (opt.value === "under30") return "Under 30 m²";
      if (opt.value === "over200") return "Over 200 m²";
      return opt.label;
    }
    return opt.label;
  };

  return (
    <div className="search-bar-wrapper">
      {/* Giao dịch Tabs: Bán & Cho thuê */}
      <div className="search-tabs">
        <button
          type="button"
          className={`search-tab-btn ${loaiGiaoDich === "Ban" ? "active" : ""}`}
          onClick={() => setLoaiGiaoDich("Ban")}
        >
          {t("nav.sell") || "Nhà đất bán"}
        </button>
        <button
          type="button"
          className={`search-tab-btn ${loaiGiaoDich === "Thue" ? "active" : ""}`}
          onClick={() => setLoaiGiaoDich("Thue")}
        >
          {t("nav.rent") || "Nhà đất cho thuê"}
        </button>
      </div>

      {/* Main search form */}
      <form onSubmit={handleSearch} className="search-form-container">
        {/* Row 1: Keyword Search & Locations */}
        <div className="search-row-main">
          <div className="search-input-wrapper keyword-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t("search.placeholder") || "Tìm kiếm dự án, khu vực, từ khóa..."}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="search-input-wrapper select-wrapper">
            <FaMapMarkerAlt className="search-icon" />
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="search-select-field"
            >
              <option value="">{t("search.province") || "Theo đơn vị"}</option>
              {provinces.map(prov => (
                <option key={prov.KhuVucID || prov.id} value={prov.KhuVucID || prov.id}>
                  {prov.TenKhuVuc || prov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="search-input-wrapper select-wrapper">
            <FaMapMarkerAlt className="search-icon" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedProvince}
              className="search-select-field"
            >
              <option value="">{t("search.district") || "Tỉnh/Thành phố"}</option>
              {districts.map(dist => (
                <option key={dist.KhuVucID || dist.id} value={dist.KhuVucID || dist.id}>
                  {dist.TenKhuVuc || dist.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns & Search Button */}
        <div className="search-row-secondary">
          <div className="search-input-wrapper select-wrapper select-sec">
            <FaHome className="search-icon" />
            <select
              value={loaiBds}
              onChange={(e) => setLoaiBds(e.target.value)}
              className="search-select-field"
            >
              {LOAI_BDS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {getBdsLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="search-input-wrapper select-wrapper select-sec">
            <FaDollarSign className="search-icon" />
            <select
              value={giaRange}
              onChange={(e) => setGiaRange(e.target.value)}
              className="search-select-field"
            >
              {GIA_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {getGiaLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <div className="search-input-wrapper select-wrapper select-sec">
            <FaRulerCombined className="search-icon" />
            <select
              value={dienTichRange}
              onChange={(e) => setDienTichRange(e.target.value)}
              className="search-select-field"
            >
              {DIEN_TICH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {getDienTichLabel(opt)}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="search-submit-btn">
            <FaSearch /> <span>{t("search.search") || "Tìm kiếm"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchKhuVuc;
