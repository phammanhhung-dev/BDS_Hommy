import React, { useRef, useEffect, useState } from "react";
import {
  FaUndo, FaRedo, FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListUl, FaListOl, FaQuoteLeft, FaLink, FaUnlink, FaImage, FaTable,
  FaLightbulb, FaExclamationTriangle, FaCode, FaEraser, FaCompress, FaExpand,
  FaUpload
} from "react-icons/fa";
import "./WordRichEditor.css";

const FONT_FAMILIES = [
  { label: "Mặc định hệ thống", value: "inherit" },
  { label: "Segoe UI", value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [
  { label: "13px (Nhỏ)", value: "1" },
  { label: "14px", value: "2" },
  { label: "16px (Chuẩn)", value: "3" },
  { label: "18px (Lớn vừa)", value: "4" },
  { label: "24px (Lớn)", value: "5" },
  { label: "32px (Tiêu đề)", value: "6" },
];

function WordRichEditor({ value, onChange, placeholder = "Nhập nội dung hoặc dán (Ctrl+V) bài viết từ trên mạng kèm hình ảnh, font chữ tại đây..." }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value || "");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Khởi tạo nội dung lần đầu hoặc khi value thay đổi từ ngoài (không phải do gõ)
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
        updateStats();
      }
    }
    setHtmlCode(value || "");
  }, [value, isHtmlMode]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(cleanText.length);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    setHtmlCode(currentHtml);
    updateStats();
    if (onChange) onChange(currentHtml);
  };

  // Thực thi lệnh định dạng Word execCommand
  const execCmd = (command, val = null) => {
    if (isHtmlMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  };

  // Xử lý dán (Paste) nâng cao: Hỗ trợ giữ nguyên HTML/Ảnh từ web và dán file ảnh từ clipboard (Screenshot)
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    // Kiểm tra nếu người dùng dán trực tiếp file ảnh chụp màn hình (Screenshot / Image)
    const items = clipboardData.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64Url = evt.target.result;
            execCmd(
              "insertHTML",
              `<div class="article-image-block" style="text-align:center; margin: 20px 0;"><img src="${base64Url}" alt="Ảnh dán trực tiếp" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" /><p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-top: 6px;">Ảnh minh họa</p></div><p><br/></p>`
            );
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    // Nếu dán văn bản giàu HTML từ trình duyệt khác (VnExpress, CafeF, Word...):
    // Trình duyệt contentEditable mặc định sẽ giữ lại toàn bộ HTML, font, màu sắc, thẻ <img>.
    // Chúng ta kích hoạt đồng bộ sau 50ms để bắt toàn bộ DOM mới được dán vào.
    setTimeout(() => {
      handleInput();
    }, 50);
  };

  // Chèn liên kết
  const handleInsertLink = () => {
    const url = prompt("Nhập địa chỉ liên kết (URL):", "https://");
    if (url && url !== "https://") {
      execCmd("createLink", url);
    }
  };

  // Chèn hình ảnh qua URL
  const handleInsertImageByUrl = () => {
    const url = prompt("Dán đường dẫn URL hình ảnh:", "https://");
    if (url && url !== "https://") {
      execCmd(
        "insertHTML",
        `<div class="article-image-block" style="text-align:center; margin: 20px 0;"><img src="${url}" alt="Ảnh bài viết" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" /><p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-top: 6px;">Ảnh minh họa</p></div><p><br/></p>`
      );
    }
  };

  // Chèn hình ảnh từ máy tính (File Upload)
  const handleUploadLocalImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target.result;
      execCmd(
        "insertHTML",
        `<div class="article-image-block" style="text-align:center; margin: 20px 0;"><img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" /><p style="font-size: 0.85rem; color: #64748b; font-style: italic; margin-top: 6px;">Ảnh: ${file.name}</p></div><p><br/></p>`
      );
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // reset input
  };

  // Chèn Bảng số liệu BĐS
  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width:100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">Khu vực / Chỉ số</th>
            <th style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">Mức giá trung bình</th>
            <th style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">Tỷ suất sinh lời</th>
            <th style="padding: 10px 14px; border: 1px solid #cbd5e1; text-align: left; font-weight: bold;">Đánh giá tiềm năng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">Quận 1, TP.HCM</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">150 - 220 triệu/m²</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">4.2%/năm</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #10b981; font-weight: bold;">Thanh khoản cao</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">TP. Thủ Đức</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">65 - 95 triệu/m²</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1;">5.8%/năm</td>
            <td style="padding: 10px 14px; border: 1px solid #cbd5e1; color: #2563eb; font-weight: bold;">Hưởng lợi Metro số 1</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd("insertHTML", tableHtml);
  };

  // Chèn Hộp Mẹo Hommy
  const handleInsertTipBox = () => {
    const tipHtml = `
      <div class="blog__tip-box" style="background:#f0fdf4; border-left: 4px solid #10b981; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; color: #065f46;">
        <strong style="color: #047857; display: block; margin-bottom: 6px; font-size: 1.05rem;">💡 Lời khuyên từ Ban Biên Tập Hommy:</strong>
        <p style="margin: 0; line-height: 1.7;">Nhập nội dung lời khuyên hoặc kinh nghiệm chuyên gia hữu ích tại đây...</p>
      </div>
      <p><br/></p>
    `;
    execCmd("insertHTML", tipHtml);
  };

  // Chèn Cảnh báo pháp lý
  const handleInsertWarningBox = () => {
    const warnHtml = `
      <div class="blog__warning-box" style="background:#fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; color: #92400e;">
        <strong style="color: #b45309; display: block; margin-bottom: 6px; font-size: 1.05rem;">⚠️ Cảnh báo pháp lý quan trọng:</strong>
        <p style="margin: 0; line-height: 1.7;">Nêu rõ điều khoản hoặc rủi ro pháp lý cần lưu ý khi tham gia giao dịch...</p>
      </div>
      <p><br/></p>
    `;
    execCmd("insertHTML", warnHtml);
  };

  // Chuyển đổi giữa chế độ Soạn thảo trực quan và Mã nguồn HTML
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Chuyển từ HTML sang Visual
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlCode;
      }
      setIsHtmlMode(false);
      if (onChange) onChange(htmlCode);
      updateStats();
    } else {
      // Chuyển từ Visual sang HTML
      if (editorRef.current) {
        setHtmlCode(editorRef.current.innerHTML);
      }
      setIsHtmlMode(true);
    }
  };

  const handleHtmlTextareaChange = (e) => {
    const val = e.target.value;
    setHtmlCode(val);
    if (onChange) onChange(val);
  };

  return (
    <div className={`word-editor-container ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Ẩn input file cho nút tải ảnh từ máy tính */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUploadLocalImage} 
        accept="image/*" 
        style={{ display: "none" }} 
      />

      {/* THANH CÔNG CỤ SOẠN THẢO KIỂU WORD (WORD RIBBON TOOLBAR) */}
      <div className="word-editor-toolbar">
        {/* Nhóm Lịch sử */}
        <div className="toolbar-group">
          <button type="button" className="t-btn" onClick={() => execCmd("undo")} title="Hoàn tác (Ctrl+Z)">
            <FaUndo />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("redo")} title="Làm lại (Ctrl+Y)">
            <FaRedo />
          </button>
        </div>

        <div className="t-divider" />

        {/* Nhóm Kiểu đề mục */}
        <div className="toolbar-group">
          <select 
            className="t-select format-block-select" 
            onChange={(e) => { execCmd("formatBlock", e.target.value); e.target.value = ""; }}
            defaultValue=""
          >
            <option value="" disabled>Kiểu văn bản</option>
            <option value="p">Đoạn văn (Normal)</option>
            <option value="h2">Đề mục lớn (H2)</option>
            <option value="h3">Mục con (H3)</option>
            <option value="h4">Mục nhỏ (H4)</option>
            <option value="blockquote">Trích dẫn (Quote)</option>
          </select>

          {/* Phông chữ */}
          <select 
            className="t-select font-family-select" 
            onChange={(e) => execCmd("fontName", e.target.value)}
            defaultValue="inherit"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* Cỡ chữ */}
          <select 
            className="t-select font-size-select" 
            onChange={(e) => execCmd("fontSize", e.target.value)}
            defaultValue="3"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="t-divider" />

        {/* Nhóm Định dạng chữ */}
        <div className="toolbar-group">
          <button type="button" className="t-btn" onClick={() => execCmd("bold")} title="In đậm (Ctrl+B)">
            <FaBold />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("italic")} title="In nghiêng (Ctrl+I)">
            <FaItalic />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("underline")} title="Gạch chân (Ctrl+U)">
            <FaUnderline />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("strikeThrough")} title="Gạch ngang">
            <FaStrikethrough />
          </button>

          {/* Màu chữ */}
          <label className="t-color-label" title="Màu chữ">
            <span className="color-indicator text-indicator">A</span>
            <input 
              type="color" 
              className="t-color-input" 
              onChange={(e) => execCmd("foreColor", e.target.value)} 
              defaultValue="#0f172a" 
            />
          </label>

          {/* Màu nền / Highlight */}
          <label className="t-color-label" title="Đánh dấu highlight">
            <span className="color-indicator bg-indicator">🖍️</span>
            <input 
              type="color" 
              className="t-color-input" 
              onChange={(e) => execCmd("hiliteColor", e.target.value)} 
              defaultValue="#fef08a" 
            />
          </label>

          <button type="button" className="t-btn" onClick={() => execCmd("removeFormat")} title="Xóa định dạng">
            <FaEraser />
          </button>
        </div>

        <div className="t-divider" />

        {/* Nhóm Canh lề & Danh sách */}
        <div className="toolbar-group">
          <button type="button" className="t-btn" onClick={() => execCmd("justifyLeft")} title="Canh trái">
            <FaAlignLeft />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("justifyCenter")} title="Canh giữa">
            <FaAlignCenter />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("justifyRight")} title="Canh phải">
            <FaAlignRight />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("justifyFull")} title="Canh đều 2 bên">
            <FaAlignJustify />
          </button>

          <button type="button" className="t-btn" onClick={() => execCmd("insertUnorderedList")} title="Danh sách chấm">
            <FaListUl />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("insertOrderedList")} title="Danh sách số">
            <FaListOl />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("formatBlock", "blockquote")} title="Trích dẫn">
            <FaQuoteLeft />
          </button>
        </div>

        <div className="t-divider" />

        {/* Nhóm Chèn đa phương tiện & Bảng */}
        <div className="toolbar-group">
          <button type="button" className="t-btn" onClick={handleInsertLink} title="Chèn liên kết web">
            <FaLink />
          </button>
          <button type="button" className="t-btn" onClick={() => execCmd("unlink")} title="Hủy liên kết">
            <FaUnlink />
          </button>
          
          <button type="button" className="t-btn t-btn-media" onClick={handleInsertImageByUrl} title="Chèn ảnh bằng URL">
            <FaImage /> <span>URL Ảnh</span>
          </button>
          <button type="button" className="t-btn t-btn-media" onClick={() => fileInputRef.current?.click()} title="Tải ảnh từ máy tính">
            <FaUpload /> <span>Tải ảnh lên</span>
          </button>

          <button type="button" className="t-btn t-btn-table" onClick={handleInsertTable} title="Chèn bảng số liệu BĐS">
            <FaTable /> <span>Bảng BĐS</span>
          </button>
        </div>

        <div className="t-divider" />

        {/* Nhóm Khối BĐS Hommy */}
        <div className="toolbar-group">
          <button type="button" className="t-btn t-btn-tip" onClick={handleInsertTipBox} title="Khối lời khuyên chuyên gia">
            <FaLightbulb /> <span>Mẹo Hommy</span>
          </button>
          <button type="button" className="t-btn t-btn-warn" onClick={handleInsertWarningBox} title="Khối cảnh báo pháp lý">
            <FaExclamationTriangle /> <span>Cảnh báo</span>
          </button>
        </div>

        <div className="t-divider" />

        {/* Nhóm Chế độ xem & Toàn màn hình */}
        <div className="toolbar-group" style={{ marginLeft: "auto" }}>
          <button 
            type="button" 
            className={`t-btn t-btn-mode ${isHtmlMode ? "active" : ""}`} 
            onClick={toggleHtmlMode} 
            title={isHtmlMode ? "Quay lại giao diện Word" : "Xem mã nguồn HTML"}
          >
            <FaCode /> <span>{isHtmlMode ? "Trở về Word" : "Mã HTML"}</span>
          </button>
          <button 
            type="button" 
            className={`t-btn ${isFullscreen ? "active" : ""}`} 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* KHÔNG GIAN SOẠN THẢO TRANG GIẤY WORD (WORD PAPER CANVAS) */}
      <div className="word-paper-workspace">
        {isHtmlMode ? (
          <textarea
            className="word-html-raw-textarea"
            value={htmlCode}
            onChange={handleHtmlTextareaChange}
            placeholder="Nhập hoặc dán mã nguồn HTML..."
          />
        ) : (
          <div className="word-paper-sheet">
            <div
              ref={editorRef}
              className="word-paper-content blog__detail-content"
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={handleInput}
              onPaste={handlePaste}
              data-placeholder={placeholder}
            />
          </div>
        )}
      </div>

      {/* THANH TRẠNG THÁI CUỐI TRANG (WORD STATUS BAR) */}
      <div className="word-editor-status-bar">
        <div className="status-left">
          <span>Trang 1 / 1</span>
          <span className="status-dot">•</span>
          <span><strong>{wordCount}</strong> từ</span>
          <span className="status-dot">•</span>
          <span><strong>{charCount}</strong> ký tự</span>
          <span className="status-dot">•</span>
          <span>Thời gian đọc: <strong>~{Math.max(1, Math.ceil(wordCount / 180))} phút</strong></span>
        </div>
        <div className="status-right">
          <span className="paste-hint">💡 <em>Mẹo: Bạn có thể sao chép bài viết bất kỳ trên mạng rồi nhấn <strong>Ctrl + V</strong> để giữ nguyên toàn bộ chữ, ảnh, bảng biểu!</em></span>
        </div>
      </div>
    </div>
  );
}

export default WordRichEditor;
