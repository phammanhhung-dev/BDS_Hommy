import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaTimes, FaSave, 
  FaHeading, FaTable, FaLightbulb, FaExclamationTriangle, FaQuoteLeft, 
  FaListUl, FaImage, FaTag, FaLink, FaClock, FaCheckCircle, FaFileAlt, 
  FaExternalLinkAlt, FaSyncAlt, FaNewspaper, FaBook, FaChartLine, FaCheck,
  FaExclamationCircle
} from "react-icons/fa";
import WordRichEditor from "./WordRichEditor";
import "./QuanLyBaiViet.css";

// Các danh mục gợi ý theo từng loại bài viết
const CATEGORY_PRESETS = {
  TinTuc: ["Khu vực", "Mẹo tìm phòng", "Tiện ích", "Xu hướng", "Thị trường", "Quy hoạch"],
  Wiki: ["Hợp đồng", "Trang trí", "Đăng tin", "Kinh nghiệm", "Pháp lý", "Thuế phí", "Phong thủy"],
  PhanTich: ["Phân tích thị trường", "Biểu đồ giá", "Báo cáo thị trường", "Góc nhìn chuyên gia", "Đánh giá dự án", "Tiềm năng hạ tầng"]
};

// Mẫu ảnh BĐS chất lượng cao sẵn có
const SAMPLE_IMAGES = [
  { label: "Thị trường / Biểu đồ", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80" },
  { label: "Căn hộ hiện đại", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80" },
  { label: "Pháp lý / Hợp đồng", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80" },
  { label: "Dự án quy hoạch", url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80" },
];

// Khung bài viết mẫu chuyên nghiệp
const ARTICLE_TEMPLATES = {
  marketReport: {
    title: "Mẫu Báo cáo phân tích thị trường BĐS",
    content: `<h2>1. Tổng quan bối cảnh thị trường</h2>
<p>Nêu rõ bối cảnh kinh tế vĩ mô, diễn biến cung - cầu và thanh khoản trong quý vừa qua...</p>

<h2>2. Diễn biến mặt bằng giá theo từng phân khúc</h2>
<p>Phân tích chi tiết mức giá tại các khu vực trung tâm và đô thị vệ tinh...</p>

<table>
  <thead>
    <tr>
      <th>Khu vực / Phân khúc</th>
      <th>Mức giá trung bình</th>
      <th>Biến động so với quý trước</th>
      <th>Khả năng thanh khoản</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Căn hộ trung cấp TP.HCM</strong></td>
      <td>48 - 65 triệu/m²</td>
      <td><span style="color:#10b981;">▲ Tăng 2.5%</span></td>
      <td>Rất tốt (85% giỏ hàng)</td>
    </tr>
    <tr>
      <td><strong>Đất nền vùng ven</strong></td>
      <td>20 - 32 triệu/m²</td>
      <td><span style="color:#64748b;">Đi ngang</span></td>
      <td>Trung bình</td>
    </tr>
  </tbody>
</table>

<div class="blog__highlight-box">
  <strong>📊 Nhận định chuyên gia:</strong>
  <p>Dòng tiền thông minh đang ưu tiên các dự án có sổ hồng sẵn và phục vụ nhu cầu ở thực.</p>
</div>

<h2>3. Dự báo xu hướng và lời khuyên đầu tư</h2>
<p>Tổng kết khuyến nghị cho nhà đầu tư trong các tháng tiếp theo...</p>`
  },
  legalGuide: {
    title: "Mẫu Cẩm nang pháp lý / Hợp đồng",
    content: `<h2>1. Căn cứ pháp lý theo luật hiện hành</h2>
<p>Trích dẫn các quy định của Luật Đất Đai và Luật Kinh Doanh BĐS mới nhất...</p>

<h2>2. Bốn điều khoản trọng yếu bắt buộc phải kiểm tra</h2>
<ul>
  <li><strong>Điều khoản 1:</strong> Xác minh tính chính chủ và quyền định đoạt tài sản.</li>
  <li><strong>Điều khoản 2:</strong> Tiến độ thanh toán gắn liền với điều kiện bàn giao.</li>
  <li><strong>Điều khoản 3:</strong> Nghĩa vụ nộp thuế thu nhập cá nhân và lệ phí trước bạ.</li>
  <li><strong>Điều khoản 4:</strong> Trách nhiệm bồi thường thiệt hại khi một bên vi phạm hợp đồng.</li>
</ul>

<div class="blog__warning-box">
  <strong>⚠️ Cảnh báo rủi ro pháp lý:</strong>
  <p>Tuyệt đối không thanh toán 100% tiền khi chưa ký hợp đồng công chứng và chưa nhận biên nhận đăng bộ sang tên.</p>
</div>

<h2>3. Quy trình thực hiện chi tiết</h2>
<p>Hướng dẫn các bước nộp hồ sơ tại cơ quan có thẩm quyền...</p>`
  },
  projectReview: {
    title: "Mẫu Đánh giá dự án chi tiết",
    content: `<h2>1. Tổng quan quy mô và vị trí dự án</h2>
<p>Mô tả vị trí tọa lạc, khả năng kết nối giao thông và tiện ích ngoại khu...</p>

<h2>2. Thẩm định 5 yếu tố cốt lõi của dự án</h2>
<ul>
  <li><strong>Pháp lý:</strong> Đã có quy hoạch 1/500 và giấy phép xây dựng chính thức.</li>
  <li><strong>Chủ đầu tư:</strong> Năng lực tài chính và uy tín bàn giao các dự án tiền nhiệm.</li>
  <li><strong>Tiến độ:</strong> Đang thi công đến tầng mấy, có bảo lãnh ngân hàng không?</li>
  <li><strong>Tiện ích:</strong> Mật độ cây xanh, bãi đỗ xe và trường học nội khu.</li>
  <li><strong>Giá bán & Thanh toán:</strong> Chính sách chiết khấu và hỗ trợ lãi suất ngân hàng.</li>
</ul>

<div class="blog__tip-box">
  <strong>💡 Lời khuyên thẩm định từ Hommy:</strong>
  <p>Hãy trực tiếp đến công trường vào ngày nghỉ để quan sát thực tế tiến độ thi công và hạ tầng xung quanh.</p>
</div>`
  }
};

function QuanLyBaiViet() {
  const [baiViets, setBaiViets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentBaiViet, setCurrentBaiViet] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Tab editor vs preview
  const [modalTab, setModalTab] = useState("editor"); // "editor" | "preview"

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form state
  const [formData, setFormData] = useState({
    TieuDe: "",
    TomTat: "",
    NoiDung: "",
    HinhAnh: "",
    Loai: "TinTuc",
    DanhMuc: "",
    Slug: ""
  });

  const fetchBaiViets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/public/bai-viet");
      if (res.data.success) {
        setBaiViets(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaiViets();
  }, []);

  const generateSlug = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleOpenModal = (baiViet = null) => {
    setModalTab("editor");
    if (baiViet) {
      setCurrentBaiViet(baiViet);
      setFormData({
        TieuDe: baiViet.TieuDe || "",
        TomTat: baiViet.TomTat || "",
        NoiDung: baiViet.NoiDung || "",
        HinhAnh: baiViet.HinhAnh || "",
        Loai: baiViet.Loai || "TinTuc",
        DanhMuc: baiViet.DanhMuc || "",
        Slug: baiViet.Slug || ""
      });
    } else {
      setCurrentBaiViet(null);
      setFormData({
        TieuDe: "",
        TomTat: "",
        NoiDung: "",
        HinhAnh: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80",
        Loai: "TinTuc",
        DanhMuc: "Thị trường",
        Slug: ""
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentBaiViet(null);
    setModalTab("editor");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    
    // Tự động sinh slug nếu đang đổi tiêu đề và slug chưa được tự tùy chỉnh
    if (name === "TieuDe" && (!formData.Slug || formData.Slug === generateSlug(formData.TieuDe))) {
      newFormData.Slug = generateSlug(value);
    }
    
    setFormData(newFormData);
  };

  const handleManualSyncSlug = () => {
    if (!formData.TieuDe) return;
    setFormData({ ...formData, Slug: generateSlug(formData.TieuDe) });
  };

  const handleApplyTemplate = (templateKey) => {
    const tpl = ARTICLE_TEMPLATES[templateKey];
    if (!tpl) return;
    if (formData.NoiDung.trim().length > 30 && !window.confirm("Áp dụng mẫu sẽ ghi đè nội dung đang soạn thảo. Bạn có chắc chắn không?")) {
      return;
    }
    setFormData({ ...formData, NoiDung: tpl.content });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.TieuDe.trim()) {
      alert("Vui lòng nhập tiêu đề bài viết!");
      return;
    }
    if (!formData.Slug.trim()) {
      alert("Vui lòng nhập đường dẫn tĩnh (Slug)!");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (currentBaiViet) {
        // Update
        await axios.put(
          `http://localhost:5000/api/admin/bai-viet/${currentBaiViet.BaiVietID}`,
          formData,
          config
        );
        alert("✅ Cập nhật bài viết thành công!");
      } else {
        // Create
        await axios.post(
          "http://localhost:5000/api/admin/bai-viet",
          formData,
          config
        );
        alert("🎉 Thêm bài viết mới thành công!");
      }
      handleCloseModal();
      fetchBaiViets();
    } catch (error) {
      console.error("Lỗi lưu bài viết:", error);
      alert(error.response?.data?.message || "Đã xảy ra lỗi khi lưu bài viết");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      await axios.delete(`http://localhost:5000/api/admin/bai-viet/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Đã xóa bài viết thành công!");
      fetchBaiViets();
    } catch (error) {
      console.error("Lỗi xóa bài viết:", error);
      alert("Đã xảy ra lỗi khi xóa bài viết");
    }
  };

  // Thống kê bài viết
  const stats = useMemo(() => {
    const total = baiViets.length;
    const tintuc = baiViets.filter(b => b.Loai === "TinTuc").length;
    const wiki = baiViets.filter(b => b.Loai === "Wiki").length;
    const phantich = baiViets.filter(b => b.Loai === "PhanTich").length;
    return { total, tintuc, wiki, phantich };
  }, [baiViets]);

  // Bộ lọc danh sách
  const filteredBaiViets = useMemo(() => {
    return baiViets.filter(b => {
      const matchType = selectedTypeFilter === "all" || b.Loai === selectedTypeFilter;
      const matchSearch = !searchTerm || 
        b.TieuDe?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.DanhMuc?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }, [baiViets, selectedTypeFilter, searchTerm]);

  // Tính toán SEO Checklist trong modal
  const seoChecklist = useMemo(() => {
    const hasTitle = formData.TieuDe.trim().length >= 15;
    const hasSummary = formData.TomTat.trim().length >= 40;
    const textOnly = formData.NoiDung.replace(/<[^>]+>/g, " ").trim();
    const wordCount = textOnly ? textOnly.split(/\s+/).length : 0;
    const hasContent = wordCount >= 80;
    const hasImage = !!formData.HinhAnh && formData.HinhAnh.startsWith("http");
    const hasCategory = !!formData.DanhMuc.trim();

    let passedCount = 0;
    if (hasTitle) passedCount++;
    if (hasSummary) passedCount++;
    if (hasContent) passedCount++;
    if (hasImage) passedCount++;
    if (hasCategory) passedCount++;

    const score = Math.round((passedCount / 5) * 100);

    return {
      hasTitle,
      hasSummary,
      hasContent,
      hasImage,
      hasCategory,
      wordCount,
      charCount: textOnly.length,
      readingTime: Math.max(1, Math.ceil(wordCount / 180)),
      score
    };
  }, [formData]);

  return (
    <div className="quanly-baiviet">
      {/* Top Header */}
      <div className="quanly-baiviet__header-modern">
        <div>
          <h2>Quản lý Nội dung & Bài viết</h2>
          <p className="quanly-baiviet__header-sub">
            Soạn thảo, quản lý bài viết chuyên sâu cho chuyên mục Tin tức BĐS, Wiki Cẩm nang và Phân tích đánh giá
          </p>
        </div>
        <button className="quanly-baiviet__btn-add-primary" onClick={() => handleOpenModal()}>
          <FaPlus /> Thêm bài viết mới
        </button>
      </div>

      {/* 4 Thẻ thống kê */}
      <div className="quanly-baiviet__stat-grid">
        <div className="quanly-baiviet__stat-card">
          <div className="stat-icon total"><FaFileAlt /></div>
          <div className="stat-info">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Tổng số bài viết</span>
          </div>
        </div>
        <div className="quanly-baiviet__stat-card">
          <div className="stat-icon tintuc"><FaNewspaper /></div>
          <div className="stat-info">
            <span className="stat-num">{stats.tintuc}</span>
            <span className="stat-label">Tin tức BĐS</span>
          </div>
        </div>
        <div className="quanly-baiviet__stat-card">
          <div className="stat-icon wiki"><FaBook /></div>
          <div className="stat-info">
            <span className="stat-num">{stats.wiki}</span>
            <span className="stat-label">Wiki Cẩm nang</span>
          </div>
        </div>
        <div className="quanly-baiviet__stat-card">
          <div className="stat-icon phantich"><FaChartLine /></div>
          <div className="stat-info">
            <span className="stat-num">{stats.phantich}</span>
            <span className="stat-label">Phân tích đánh giá</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter & Search */}
      <div className="quanly-baiviet__filter-bar">
        <div className="filter-search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tiêu đề hoặc danh mục..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-type-group">
          <button 
            className={`filter-chip ${selectedTypeFilter === "all" ? "active" : ""}`}
            onClick={() => { setSelectedTypeFilter("all"); setCurrentPage(1); }}
          >
            Tất cả ({stats.total})
          </button>
          <button 
            className={`filter-chip tintuc ${selectedTypeFilter === "TinTuc" ? "active" : ""}`}
            onClick={() => { setSelectedTypeFilter("TinTuc"); setCurrentPage(1); }}
          >
            Tin tức ({stats.tintuc})
          </button>
          <button 
            className={`filter-chip wiki ${selectedTypeFilter === "Wiki" ? "active" : ""}`}
            onClick={() => { setSelectedTypeFilter("Wiki"); setCurrentPage(1); }}
          >
            Wiki BĐS ({stats.wiki})
          </button>
          <button 
            className={`filter-chip phantich ${selectedTypeFilter === "PhanTich" ? "active" : ""}`}
            onClick={() => { setSelectedTypeFilter("PhanTich"); setCurrentPage(1); }}
          >
            Phân tích ({stats.phantich})
          </button>
        </div>
      </div>

      {/* Bảng danh sách bài viết */}
      <div className="quanly-baiviet__table-container">
        {loading ? (
          <div className="quanly-baiviet__loading-box">
            <div className="spinner"></div>
            <span>Đang tải danh sách bài viết...</span>
          </div>
        ) : (
          <>
            <table className="quanly-baiviet__table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th style={{ width: "110px" }}>Hình ảnh</th>
                  <th>Tiêu đề bài viết</th>
                  <th style={{ width: "130px" }}>Chuyên mục</th>
                  <th style={{ width: "140px" }}>Danh mục</th>
                  <th style={{ width: "90px" }}>Lượt xem</th>
                  <th style={{ width: "110px" }}>Ngày tạo</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredBaiViets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((bv) => (
                  <tr key={bv.BaiVietID}>
                    <td className="col-id">#{bv.BaiVietID}</td>
                    <td>
                      <div className="thumbnail-wrapper">
                        {bv.HinhAnh ? (
                          <img src={bv.HinhAnh} alt={bv.TieuDe} className="quanly-baiviet__thumbnail" />
                        ) : (
                          <div className="thumbnail-placeholder"><FaImage /></div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="title-cell">
                        <strong className="article-title">{bv.TieuDe}</strong>
                        <span className="article-slug">/bai-viet/{bv.Slug}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-type ${bv.Loai}`}>
                        {bv.Loai === "Wiki" ? "Wiki BĐS" : bv.Loai === "PhanTich" ? "Phân tích" : "Tin tức"}
                      </span>
                    </td>
                    <td>
                      <span className="badge-category">{bv.DanhMuc || "Chung"}</span>
                    </td>
                    <td className="col-views">
                      <FaEye className="view-icon" /> {bv.LuotXem || 0}
                    </td>
                    <td className="col-date">
                      {new Date(bv.TaoLuc).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className="quanly-baiviet__actions">
                        <a 
                          href={`/bai-viet/${bv.BaiVietID}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-action view" 
                          title="Xem trước bài viết trên trang"
                        >
                          <FaExternalLinkAlt />
                        </a>
                        <button 
                          className="btn-action edit"
                          onClick={() => handleOpenModal(bv)}
                          title="Chỉnh sửa bài viết"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDelete(bv.BaiVietID)}
                          title="Xóa bài viết"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBaiViets.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty-table-cell">
                      <FaFileAlt style={{ fontSize: "2rem", color: "#cbd5e1", marginBottom: "8px" }} />
                      <p>Không tìm thấy bài viết nào phù hợp với bộ lọc</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Phân trang */}
            {filteredBaiViets.length > itemsPerPage && (
              <div className="quanly-baiviet__pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-nav-btn"
                >
                  Trang trước
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.ceil(filteredBaiViets.length / itemsPerPage) }, (_, idx) => (
                    <button
                      key={idx + 1}
                      className={`page-num-btn ${currentPage === idx + 1 ? "active" : ""}`}
                      onClick={() => setCurrentPage(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredBaiViets.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredBaiViets.length / itemsPerPage)}
                  className="page-nav-btn"
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA BÀI VIẾT CHUYÊN NGHIỆP                                    */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="quanly-baiviet__modal-overlay">
          <div className="quanly-baiviet__modal-professional">
            {/* Header Modal */}
            <div className="modal-pro-header">
              <div className="header-left">
                <div className={`mode-badge ${currentBaiViet ? "edit" : "create"}`}>
                  {currentBaiViet ? <FaEdit /> : <FaPlus />}
                </div>
                <div>
                  <h3>{currentBaiViet ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</h3>
                  <p className="header-guide">
                    Soạn thảo bài viết chuyên sâu chuẩn SEO, chèn bảng biểu số liệu và xem trước trực quan
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>

            {/* Body 2 Cột */}
            <form onSubmit={handleSubmit} className="modal-pro-form">
              <div className="modal-pro-body">
                {/* ==================== CỘT TRÁI (NỘI DUNG CHÍNH) ==================== */}
                <div className="pro-col-main">
                  {/* Tiêu đề */}
                  <div className="pro-field-group">
                    <div className="field-label-row">
                      <label className="field-label">
                        Tiêu đề bài viết <span className="req">*</span>
                      </label>
                      <span className={`char-counter ${formData.TieuDe.length > 70 ? "warn" : ""}`}>
                        {formData.TieuDe.length}/100 ký tự (Tối ưu: 40 - 70)
                      </span>
                    </div>
                    <input
                      type="text"
                      name="TieuDe"
                      value={formData.TieuDe}
                      onChange={handleChange}
                      placeholder="Ví dụ: Phân tích thị trường căn hộ chung cư TP.HCM quý 3 năm 2025..."
                      className="pro-input pro-input-title"
                      required
                    />
                  </div>

                  {/* Tóm tắt */}
                  <div className="pro-field-group">
                    <div className="field-label-row">
                      <label className="field-label">
                        Tóm tắt ngắn (Sapo / Meta Description)
                      </label>
                      <span className={`char-counter ${formData.TomTat.length > 180 ? "warn" : ""}`}>
                        {formData.TomTat.length}/250 ký tự (Tối ưu: 120 - 160)
                      </span>
                    </div>
                    <textarea
                      name="TomTat"
                      value={formData.TomTat}
                      onChange={handleChange}
                      placeholder="Tóm tắt cô đọng 2-3 câu giới thiệu nội dung nổi bật nhất của bài viết..."
                      className="pro-textarea pro-textarea-summary"
                      rows="2"
                    />
                  </div>

                  {/* Editor Switcher Bar */}
                  <div className="editor-nav-bar">
                    <div className="editor-tab-switch">
                      <button 
                        type="button" 
                        className={`tab-switch-btn ${modalTab === "editor" ? "active" : ""}`}
                        onClick={() => setModalTab("editor")}
                      >
                        <FaFileAlt /> Soạn thảo nội dung
                      </button>
                      <button 
                        type="button" 
                        className={`tab-switch-btn ${modalTab === "preview" ? "active" : ""}`}
                        onClick={() => setModalTab("preview")}
                      >
                        <FaEye /> Xem trước hiển thị (Live Preview)
                      </button>
                    </div>

                    {modalTab === "editor" && (
                      <div className="quick-templates-dropdown">
                        <span className="tpl-label">📝 Chèn mẫu bài nhanh:</span>
                        <button type="button" className="tpl-btn" onClick={() => handleApplyTemplate("marketReport")}>
                          Phân tích BĐS
                        </button>
                        <button type="button" className="tpl-btn" onClick={() => handleApplyTemplate("legalGuide")}>
                          Pháp lý / Hợp đồng
                        </button>
                        <button type="button" className="tpl-btn" onClick={() => handleApplyTemplate("projectReview")}>
                          Đánh giá dự án
                        </button>
                      </div>
                    )}
                  </div>

                  {/* NỘI DUNG SOẠN THẢO HOẶC XEM TRƯỚC */}
                  {modalTab === "editor" ? (
                    <div className="editor-word-wrapper">
                      <WordRichEditor
                        value={formData.NoiDung}
                        onChange={(newHtml) => setFormData(prev => ({ ...prev, NoiDung: newHtml }))}
                        placeholder="Nhập nội dung bài viết hoặc dán (Ctrl+V) toàn bộ bài viết từ trên mạng (kèm hình ảnh, font chữ, bảng biểu, màu sắc)..."
                      />
                    </div>
                  ) : (
                    /* XEM TRƯỚC BÀI VIẾT (LIVE PREVIEW) */
                    <div className="preview-container">
                      <div className="preview-article-header">
                        <span className="preview-badge">
                          {formData.DanhMuc || (formData.Loai === "Wiki" ? "Wiki BĐS" : formData.Loai === "PhanTich" ? "Phân tích đánh giá" : "Tin tức BĐS")}
                        </span>
                        <h1 className="preview-title">{formData.TieuDe || "Chưa có tiêu đề bài viết"}</h1>
                        <div className="preview-meta">
                          <span><FaClock /> {seoChecklist.readingTime} phút đọc</span>
                          <span>• Tác giả: Ban Biên Tập Hommy</span>
                          <span>• Ngày: {new Date().toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>

                      {formData.HinhAnh && (
                        <div className="preview-image-wrap">
                          <img src={formData.HinhAnh} alt="Preview" />
                        </div>
                      )}

                      {formData.TomTat && (
                        <div className="blog__detail-summary">
                          <strong>Tóm tắt: </strong>{formData.TomTat}
                        </div>
                      )}

                      <div 
                        className="blog__detail-content preview-content-body"
                        dangerouslySetInnerHTML={{ __html: formData.NoiDung || "<p style='color:#94a3b8; font-style:italic;'>Nội dung bài viết chưa được nhập. Hãy quay lại tab 'Soạn thảo' để bắt đầu viết...</p>" }}
                      />

                      <div className="blog__detail-disclaimer">
                        <strong>📌 Tuyên bố miễn trừ trách nhiệm & Khuyến nghị từ Hommy:</strong>
                        <p>
                          Bài viết được biên soạn và phân tích chuyên sâu bởi Ban Biên Tập Hommy BĐS nhằm cung cấp góc nhìn đa chiều, khách quan cho độc giả.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ==================== CỘT PHẢI (THIẾT LẬP & SEO) ==================== */}
                <div className="pro-col-side">
                  {/* Card 1: Phân loại & Chuyên mục */}
                  <div className="side-card">
                    <h4 className="side-card-title"><FaTag /> Phân loại bài viết</h4>
                    
                    <div className="type-selector-grid">
                      <label className={`type-option ${formData.Loai === "TinTuc" ? "selected tintuc" : ""}`}>
                        <input
                          type="radio"
                          name="Loai"
                          value="TinTuc"
                          checked={formData.Loai === "TinTuc"}
                          onChange={handleChange}
                        />
                        <div className="type-option-content">
                          <FaNewspaper className="opt-icon" />
                          <span className="opt-title">Tin tức BĐS</span>
                        </div>
                      </label>

                      <label className={`type-option ${formData.Loai === "Wiki" ? "selected wiki" : ""}`}>
                        <input
                          type="radio"
                          name="Loai"
                          value="Wiki"
                          checked={formData.Loai === "Wiki"}
                          onChange={handleChange}
                        />
                        <div className="type-option-content">
                          <FaBook className="opt-icon" />
                          <span className="opt-title">Wiki Cẩm nang</span>
                        </div>
                      </label>

                      <label className={`type-option ${formData.Loai === "PhanTich" ? "selected phantich" : ""}`}>
                        <input
                          type="radio"
                          name="Loai"
                          value="PhanTich"
                          checked={formData.Loai === "PhanTich"}
                          onChange={handleChange}
                        />
                        <div className="type-option-content">
                          <FaChartLine className="opt-icon" />
                          <span className="opt-title">Phân tích</span>
                        </div>
                      </label>
                    </div>

                    {/* Danh mục con */}
                    <div className="category-subfield">
                      <label className="field-sublabel">Danh mục chuyên đề</label>
                      <input
                        type="text"
                        name="DanhMuc"
                        value={formData.DanhMuc}
                        onChange={handleChange}
                        placeholder="Nhập hoặc chọn gợi ý..."
                        className="pro-input"
                      />
                      
                      {/* Chips gợi ý */}
                      <div className="category-chips">
                        {(CATEGORY_PRESETS[formData.Loai] || []).map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            className={`cat-chip ${formData.DanhMuc === cat ? "active" : ""}`}
                            onClick={() => setFormData({ ...formData, DanhMuc: cat })}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Đường dẫn tĩnh (Slug URL) */}
                  <div className="side-card">
                    <h4 className="side-card-title"><FaLink /> Đường dẫn tĩnh (Slug)</h4>
                    <div className="slug-input-wrapper">
                      <span className="slug-prefix">/bai-viet/</span>
                      <input
                        type="text"
                        name="Slug"
                        value={formData.Slug}
                        onChange={handleChange}
                        placeholder="duong-dan-tinh"
                        className="pro-input slug-input"
                        required
                      />
                      <button 
                        type="button" 
                        className="slug-sync-btn" 
                        onClick={handleManualSyncSlug}
                        title="Tạo lại từ tiêu đề"
                      >
                        <FaSyncAlt />
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Ảnh đại diện bài viết */}
                  <div className="side-card">
                    <h4 className="side-card-title"><FaImage /> Ảnh đại diện (Thumbnail)</h4>
                    <input
                      type="text"
                      name="HinhAnh"
                      value={formData.HinhAnh}
                      onChange={handleChange}
                      placeholder="Dán URL hình ảnh..."
                      className="pro-input"
                    />

                    {/* Khung xem trước ảnh */}
                    <div className="image-preview-box">
                      {formData.HinhAnh ? (
                        <img 
                          src={formData.HinhAnh} 
                          alt="Thumbnail Preview" 
                          onError={(e) => { e.target.src = "https://placehold.co/600x400?text=Anh+Loi"; }}
                        />
                      ) : (
                        <div className="no-image-placeholder">
                          <FaImage />
                          <span>Chưa có ảnh đại diện</span>
                        </div>
                      )}
                    </div>

                    {/* Ảnh gợi ý nhanh */}
                    <div className="sample-images-row">
                      <span className="sample-label">Gợi ý ảnh nhanh:</span>
                      <div className="sample-chips">
                        {SAMPLE_IMAGES.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="sample-chip-btn"
                            onClick={() => setFormData({ ...formData, HinhAnh: img.url })}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Điểm chất lượng SEO */}
                  <div className="side-card seo-card">
                    <div className="seo-header">
                      <h4 className="side-card-title">Điểm chuẩn SEO</h4>
                      <span className={`seo-score-badge ${seoChecklist.score >= 80 ? "good" : seoChecklist.score >= 50 ? "medium" : "low"}`}>
                        {seoChecklist.score}%
                      </span>
                    </div>

                    <div className="seo-progress-bar">
                      <div 
                        className="seo-progress-fill" 
                        style={{ 
                          width: `${seoChecklist.score}%`,
                          backgroundColor: seoChecklist.score >= 80 ? "#10b981" : seoChecklist.score >= 50 ? "#f59e0b" : "#ef4444" 
                        }}
                      />
                    </div>

                    <ul className="seo-checklist">
                      <li className={seoChecklist.hasTitle ? "valid" : "invalid"}>
                        {seoChecklist.hasTitle ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span>Tiêu đề rõ ràng (&ge; 15 ký tự)</span>
                      </li>
                      <li className={seoChecklist.hasSummary ? "valid" : "invalid"}>
                        {seoChecklist.hasSummary ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span>Có tóm tắt dẫn dắt (&ge; 40 ký tự)</span>
                      </li>
                      <li className={seoChecklist.hasContent ? "valid" : "invalid"}>
                        {seoChecklist.hasContent ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span>Nội dung chi tiết (&ge; 80 từ)</span>
                      </li>
                      <li className={seoChecklist.hasImage ? "valid" : "invalid"}>
                        {seoChecklist.hasImage ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span>Ảnh đại diện hợp lệ</span>
                      </li>
                      <li className={seoChecklist.hasCategory ? "valid" : "invalid"}>
                        {seoChecklist.hasCategory ? <FaCheckCircle /> : <FaExclamationCircle />}
                        <span>Đã phân loại danh mục</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ==================== FOOTER MODAL ==================== */}
              <div className="modal-pro-footer">
                <div className="footer-status-text">
                  <FaCheckCircle style={{ color: "#10b981" }} />
                  <span>Sẵn sàng lưu vào cơ sở dữ liệu Hommy</span>
                </div>

                <div className="footer-buttons">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal} disabled={submitting}>
                    Hủy bỏ
                  </button>
                  {modalTab === "editor" ? (
                    <button type="button" className="btn-preview-switch" onClick={() => setModalTab("preview")}>
                      <FaEye /> Xem trước
                    </button>
                  ) : (
                    <button type="button" className="btn-preview-switch" onClick={() => setModalTab("editor")}>
                      <FaEdit /> Quay lại soạn thảo
                    </button>
                  )}
                  <button type="submit" className="btn-save-primary" disabled={submitting}>
                    <FaSave /> {submitting ? "Đang lưu..." : currentBaiViet ? "Lưu thay đổi" : "Xuất bản bài viết"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyBaiViet;
