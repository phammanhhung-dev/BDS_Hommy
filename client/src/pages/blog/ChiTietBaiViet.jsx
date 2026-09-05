import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../../components/header";
import Footer from "../../components/footer";
import baiVietPublicApi from "../../api/baiVietPublicApi";
import { setPageSEO, SITE_URL } from "../../utils/seo";
import { FaCalendarAlt, FaFolderOpen, FaArrowLeft } from "react-icons/fa";
import "./blog.css";

function ChiTietBaiViet() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await baiVietPublicApi.getDetail(id);
      if (res?.data?.success && res.data.data) {
        const article = res.data.data;
        setPost(article);

        // Set SEO for this page
        setPageSEO({
          title: `${article.TieuDe} - Hommy`,
          description: article.TomTat || article.MoTa?.slice(0, 150) || "Đọc bài viết trên Hommy",
          canonical: `${SITE_URL}/bai-viet/${id}`,
        });

        // Load related posts from same type
        fetchRelatedPosts(article.Loai, article.BaiVietID);
      } else {
        setError("Không tìm thấy bài viết");
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết bài viết:", err);
      setError("Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async (loai, currentId) => {
    try {
      const res = await baiVietPublicApi.getAll({ loai });
      if (res?.data?.success && Array.isArray(res.data.data)) {
        // Filter out current post
        const filtered = res.data.data.filter(p => p.BaiVietID !== currentId).slice(0, 5);
        setRelatedPosts(filtered);
      }
    } catch (err) {
      console.error("Lỗi lấy bài viết liên quan:", err);
    }
  };

  return (
    <div className="blog">
      <Header />
      <main className="blog__container">
        <div className="blog__back-btn-wrapper">
          <Link to={post?.Loai === "Wiki" ? "/wiki-bds" : post?.Loai === "PhanTich" ? "/phan-tich-danh-gia" : "/tin-tuc-bds"} className="blog__back-btn">
            <FaArrowLeft /> <span>Quay lại danh sách</span>
          </Link>
        </div>

        {loading && <div className="blog__loading">Đang tải nội dung bài viết...</div>}
        {error && <div className="blog__error" role="alert">{error}</div>}

        {!loading && !error && post && (
          <div className="blog__layout">
            {/* Left Column: Full Post Content */}
            <article className="blog__detail-main">
              <header className="blog__detail-header">
                <span className="blog__detail-category">
                  {post.DanhMuc || (post.Loai === "Wiki" ? "Wiki" : post.Loai === "PhanTich" ? "Phân tích" : "Tin tức")}
                </span>
                <h1 className="blog__detail-title">{post.TieuDe}</h1>
                <div className="blog__detail-meta">
                  <span className="meta-item"><FaCalendarAlt /> {new Date(post.TaoLuc).toLocaleDateString("vi-VN")}</span>
                  <span className="meta-item"><FaFolderOpen /> Tác giả: Ban Biên Tập Hommy</span>
                </div>
              </header>

              <div className="blog__detail-img-wrapper">
                <img src={post.HinhAnh} alt={post.TieuDe} className="blog__detail-img" />
              </div>

              {post.TomTat && (
                <div className="blog__detail-summary">
                  <strong>Tóm tắt: </strong>{post.TomTat}
                </div>
              )}

              <div 
                className="blog__detail-content"
                dangerouslySetInnerHTML={{ __html: post.MoTa }}
              />
            </article>

            {/* Right Column: Sidebar */}
            <aside className="blog__sidebar">
              <div className="blog__sidebar-widget">
                <h3 className="blog__sidebar-title">Bài viết cùng chuyên mục</h3>
                <ul className="blog__related-list">
                  {relatedPosts.length > 0 ? (
                    relatedPosts.map((item) => (
                      <li key={item.BaiVietID} className="blog__related-item">
                        <Link to={`/bai-viet/${item.BaiVietID}`} className="related-img-link">
                          <img src={item.HinhAnh} alt={item.TieuDe} />
                        </Link>
                        <div className="related-content">
                          <h4>
                            <Link to={`/bai-viet/${item.BaiVietID}`}>{item.TieuDe}</Link>
                          </h4>
                          <time>{new Date(item.TaoLuc).toLocaleDateString("vi-VN")}</time>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="related-empty">Không có bài viết liên quan nào khác.</li>
                  )}
                </ul>
              </div>

              <div className="blog__sidebar-widget widget-ai">
                <h4>🤖 Định giá nhà đất bằng AI</h4>
                <p>Sử dụng thuật toán học máy Random Forest để tự động tính toán, dự đoán chính xác giá trị thực tế của bất động sản tại TP.HCM.</p>
                <Link to="/dinh-gia-ai" className="widget-ai-btn">Thử nghiệm định giá AI</Link>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default ChiTietBaiViet;
