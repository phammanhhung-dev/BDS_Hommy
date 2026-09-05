import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineChatBubbleLeftRight, HiOutlineXMark, HiOutlineArrowLeft, HiOutlineVideoCamera } from "react-icons/hi2";
import cuocHenApi from "../../api/cuocHenApi";
import { ChatProvider, useChatContext } from "../../context/ChatContext";
import useChat from "../../hooks/useChat";
import useSocket from "../../hooks/useSocket";
import MessageList from "../../components/Chat/MessageList";
import MessageInput from "../../components/Chat/MessageInput";
import "./cuocHenCuaToi.css";

const formatDateTimeVN = (input) => {
  if (!input) return "";
  const d = new Date(String(input).replace(" ", "T"));
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCurrentUser = () => {
  try {
    const raw =
      localStorage.getItem("user") || localStorage.getItem("currentUser");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.user ?? parsed;
    }
  } catch {}
  const userId = localStorage.getItem("userId");
  return userId ? { NguoiDungID: Number(userId) } : null;
};

const getUserRole = (u) => {
  const v = u?.VaiTroID ?? u?.vaiTroId ?? u?.roleId ?? u?.RoleID;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
};

const extractIds = (u) => {
  console.log("[extractIds] Raw user object:", u);

  return {
    khachHangId: u?.KhachHangID ?? u?.NguoiDungID ?? u?.id ?? u?.userId ?? null,
    nhanVienId:
      u?.NhanVienID ??
      u?.NhanVienBanHangID ??
      u?.nhanVienId ??
      u?.id ??
      u?.NguoiDungID ??
      null,
    chuDuAnId:
      u?.ChuDuAnID ??
      u?.chuDuAnId ??
      u?.chuDuAnID ??
      u?.ChuDuAn?.ChuDuAnID ??
      u?.NguoiDungID ??
      u?.id ??
      null,
  };
};

/**
 * Các trạng thái cuộc hẹn không được phép nhắn tin
 * - DaYeuCau: Mới yêu cầu, chưa có nhân viên xử lý
 * - HuyBoiHeThong: Đã bị hệ thống hủy
 */
const TRANG_THAI_KHONG_CHO_NHAN_TIN = ['DaYeuCau', 'HuyBoiHeThong'];

/**
 * Kiểm tra xem cuộc hẹn có được phép nhắn tin không
 */
const canSendMessage = (cuocHen) => {
  if (!cuocHen?.NhanVienBanHangID) return false;
  if (TRANG_THAI_KHONG_CHO_NHAN_TIN.includes(cuocHen?.TrangThai)) return false;
  return true;
};

/**
 * ChatPanel Component - Panel chat với nhân viên bán hàng
 */
const ChatPanel = ({ cuocHen, onClose }) => {
  const { findOrCreateConversation, markConversationAsRead } = useChatContext();
  const { socket, isConnected: socketConnected } = useSocket();
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy thông tin user hiện tại
  let currentUserId = parseInt(localStorage.getItem('userId') || '0');
  let currentUser = {};
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser = JSON.parse(userStr);
      if (!currentUserId) currentUserId = currentUser.NguoiDungID || 0;
    }
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
  }

  // Xử lý gọi video
  const handleVideoCall = () => {
    if (!conversationId) {
      alert('Vui lòng đợi kết nối cuộc trò chuyện');
      return;
    }

    const currentUserName = currentUser.TenDayDu || currentUser.tenDayDu || 'Khách hàng';
    const partnerName = cuocHen.TenNhanVien || 'Nhân viên';

    // Tạo Room ID
    const rawRoomId = `daphongtro_chat_${conversationId}`;
    const secureRoomId = btoa(rawRoomId).replace(/=/g, '');

    // Mã hóa thông tin user
    const userInfo = {
      username: currentUserName,
      userid: currentUserId,
      partner_name: partnerName,
      timestamp: Date.now()
    };
    const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(userInfo))));
    const roomUrl = `https://jbcalling.site/room/${secureRoomId}?data=${encodedData}`;
    
    // Emit socket event để thông báo nhân viên
    if (socket && socketConnected) {
      socket.emit('initiate_video_call', {
        cuocHoiThoaiID: conversationId,
        roomUrl
      });
      console.log('[ChatPanel] Emitted initiate_video_call event');
    }
    
    // Mở window video call
    const width = 1280;
    const height = 720;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      roomUrl,
      'VideoCallWindow',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  // Tạo hoặc tìm cuộc hội thoại khi mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tạo/tìm cuộc hội thoại với nhân viên bán hàng
        const convId = await findOrCreateConversation({
          NguCanhID: cuocHen.CuocHenID,
          NguCanhLoai: 'CuocHen',
          ThanhVienIDs: [cuocHen.NhanVienBanHangID],
          TieuDe: `Cuộc hẹn #${cuocHen.CuocHenID} - ${cuocHen.TieuDeTinDang || 'Tin đăng'}`
        });

        setConversationId(convId);
      } catch (err) {
        console.error('[ChatPanel] Init conversation error:', err);
        setError('Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (cuocHen?.NhanVienBanHangID) {
      initConversation();
    }
  }, [cuocHen, findOrCreateConversation]);

  // Sử dụng useChat hook khi đã có conversationId
  const {
    messages,
    sendMessage,
    handleTyping,
    markAsRead,
    isTyping,
    loading: messagesLoading,
    error: chatError,
    isConnected
  } = useChat(conversationId);

  // Đánh dấu đã đọc khi mở
  useEffect(() => {
    if (conversationId) {
      markAsRead();
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markAsRead, markConversationAsRead]);

  return (
    <div className="appointments__chat-panel">
      <div className="appointments__chat-header">
        <button className="appointments__chat-back" onClick={onClose}>
          <HiOutlineArrowLeft />
        </button>
        <div className="appointments__chat-info">
          <h4>Nhắn tin với {cuocHen.TenNhanVien || 'Nhân viên'}</h4>
          <span className="appointments__chat-status">
            {loading ? 'Đang kết nối...' : 
             !isConnected ? 'Đang kết nối lại...' :
             isTyping ? 'Đang gõ...' : 'Trực tuyến'}
          </span>
        </div>
        <div className="appointments__chat-actions">
          <button 
            className="appointments__chat-video-call"
            onClick={handleVideoCall}
            disabled={loading || !conversationId}
            title="Gọi video"
          >
            <HiOutlineVideoCamera />
          </button>
          <button className="appointments__chat-close" onClick={onClose}>
            <HiOutlineXMark />
          </button>
        </div>
      </div>

      <div className="appointments__chat-body">
        {loading ? (
          <div className="appointments__chat-loading">Đang tải cuộc trò chuyện...</div>
        ) : error || chatError ? (
          <div className="appointments__chat-error">{error || chatError}</div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isTyping={isTyping}
            loading={messagesLoading}
          />
        )}
      </div>

      <div className="appointments__chat-footer">
        <MessageInput
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          disabled={!isConnected || loading}
        />
      </div>
    </div>
  );
};

const AppointmentsContent = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState({});
  const [deleting, setDeleting] = useState({});
  const [editingStatus, setEditingStatus] = useState({});
  const [selectedStatus, setSelectedStatus] = useState({});
  
  // State cho chat panel
  const [selectedCuocHen, setSelectedCuocHen] = useState(null);

  useEffect(() => {
    const root = document.querySelector(".appointments");
    const measure = () => {
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const h = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
      const f = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
      root?.style.setProperty("--safe-top", `${h}px`);
      root?.style.setProperty("--safe-bottom", `${f}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const loadAppointments = async (u) => {
    if (!u) {
      navigate("/login");
      return;
    }

    const role = getUserRole(u) ?? 1; // fallback khách hàng
    const ids = extractIds(u);

    try {
      setLoading(true);
      setError("");

      let res;
      if (role === 4 || role === 5) {
        res = await cuocHenApi.getAll();
      } else if (role === 3) {
        const chuDuAnId = ids.chuDuAnId ?? u?.NguoiDungID ?? u?.id;
        if (!chuDuAnId) {
          setError("Không tìm thấy ChuDuAnID của tài khoản.");
          return;
        }
        res = await cuocHenApi.findByChuDuAn(chuDuAnId);
      } else if (role === 2) {
        if (!ids.nhanVienId) {
          setError("Không tìm thấy NhanVienID của tài khoản.");
          return;
        }
        res = await cuocHenApi.findByNhanVien(ids.nhanVienId);
      } else {
        if (!ids.khachHangId) {
          setError("Không tìm thấy KhachHangID của tài khoản.");
          return;
        }
        // ✅ KHÁCH HÀNG: dùng đúng endpoint /cuoc-hen/search/khach-hang/:khachHangId
        res = await cuocHenApi.findByKhachHang(ids.khachHangId); // [`cuocHenApi.findByKhachHang`](src/api/cuocHenApi.js)
      }

      const raw = res?.data?.data ?? res?.data ?? [];
      const data = Array.isArray(raw) ? raw : [];

      // Chỉ lọc theo KhachHangID nếu là Khách hàng; role khác giữ nguyên
      if (role === 1) {
        const khId = Number(ids.khachHangId);
        setAppointments(
          Number.isFinite(khId)
            ? data.filter(
                (c) =>
                  Number(c?.KhachHangID ?? c?.khachHangId ?? c?.NguoiDungID) ===
                  khId
              )
            : data
        );
      } else {
        setAppointments(data);
      }
    } catch (e) {
      console.error("[loadAppointments] Error:", e);
      setError(
        e?.response?.data?.message || "Không tải được danh sách cuộc hẹn"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getCurrentUser();
    setCurrentUser(u);
    console.log("[Appointments] Current user:", u);
    loadAppointments(u);
  }, [navigate]);

  const handleApprove = async (cuocHenId) => {
    try {
      setApproving((prev) => ({ ...prev, [cuocHenId]: true }));
      await cuocHenApi.update(cuocHenId, { PheDuyetChuDuAn: "DaPheDuyet" });
      await loadAppointments(currentUser);
    } catch (e) {
      alert(e?.response?.data?.message || "Lỗi phê duyệt cuộc hẹn");
    } finally {
      setApproving((prev) => ({ ...prev, [cuocHenId]: false }));
    }
  };

  const handleDelete = async (cuocHenId) => {
    if (!confirm("Bạn có chắc muốn xóa cuộc hẹn này?")) return;

    try {
      setDeleting((prev) => ({ ...prev, [cuocHenId]: true }));
      await cuocHenApi.remove(cuocHenId);
      await loadAppointments(currentUser);
    } catch (e) {
      alert(e?.response?.data?.message || "Lỗi xóa cuộc hẹn");
    } finally {
      setDeleting((prev) => ({ ...prev, [cuocHenId]: false }));
    }
  };

  const handleStatusChange = async (cuocHenId) => {
    const newStatus = selectedStatus[cuocHenId];
    if (!newStatus) return;

    try {
      setEditingStatus((prev) => ({ ...prev, [cuocHenId]: true }));
      await cuocHenApi.update(cuocHenId, { TrangThai: newStatus });
      await loadAppointments(currentUser);
      setSelectedStatus((prev) => {
        const next = { ...prev };
        delete next[cuocHenId];
        return next;
      });
    } catch (e) {
      alert(e?.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setEditingStatus((prev) => ({ ...prev, [cuocHenId]: false }));
    }
  };

  const isChuDuAn = getUserRole(currentUser) === 3;
  const isAdmin = getUserRole(currentUser) === 4 || getUserRole(currentUser) === 5;

  const statusOptions = [
    "ChoXacNhan",
    "DaXacNhan",
    "DangXuLy",
    "HoanThanh",
    "DaHuy",
  ];

  return (
    <div className={`appointments ${selectedCuocHen ? 'appointments--chat-open' : ''}`}>
      <main className="appointments__content">
        <div className="appointments__header">
          <h2 className="appointments__title">
            {isChuDuAn ? "Quản lý cuộc hẹn" : "Cuộc hẹn của tôi"}
          </h2>
          <Link to="/" className="appointments__home-link">
            ← Về trang chủ
          </Link>
        </div>

        {currentUser && (
          <div className="appointments__user">
            Người dùng: ID{" "}
            {currentUser.NguoiDungID ?? currentUser.id ?? currentUser.userId} •
            VaiTroID {getUserRole(currentUser) ?? "—"}
          </div>
        )}

        {loading && <div className="appointments__state">Đang tải...</div>}
        {error && <div className="appointments__error">{error}</div>}

        {!loading && !error && appointments.length === 0 && (
          <div className="appointments__empty">Chưa có cuộc hẹn nào.</div>
        )}

        {!loading && !error && appointments.length > 0 && (
          <div className="appointments__grid">
            {appointments.map((c) => {
              const needsApproval =
                isChuDuAn && c.PheDuyetChuDuAn === "ChoPheDuyet";
              const isApproved = c.PheDuyetChuDuAn === "DaPheDuyet";

              return (
                <article
                  key={c.CuocHenID ?? `${c.TinDangID}-${c.ThoiGianHen}`}
                  className="appointments__card"
                >
                  <div className="appointments__card-top">
                    <strong className="appointments__card-id">
                      # {c.CuocHenID || "-"}
                    </strong>
                    <span className="appointments__card-time">
                      {formatDateTimeVN(c.ThoiGianHen)}
                    </span>
                  </div>

                  <div className="appointments__info-grid">
                    <div className="appointments__info-item">
                      Tin đăng: <strong>{c.TinDangID}</strong>
                    </div>
                    <div className="appointments__info-item">
                      <strong>{c.TieuDeTinDang}</strong>
                    </div>
                    <div className="appointments__info-item">
                      Thời gian hẹn:{" "}
                      <strong>{formatDateTimeVN(c.ThoiGianHen)}</strong>
                    </div>
                    <div className="appointments__info-item">
                      Khách hàng:{" "}
                      <strong>
                        {c.TenKhachHang} ({c.SDTKhachHang})
                      </strong>
                    </div>
                    <div className="appointments__info-item">
                      Nhân viên:{" "}
                      <strong>
                        {c.TenNhanVien} ({c.SDTNhanVien})
                      </strong>
                    </div>
                    <div className="appointments__info-item">
                      Phòng: <strong>{c.PhongID ?? "—"}</strong>
                    </div>
                    <div className="appointments__info-item">
                      Nhân viên ID:{" "}
                      <strong>{c.NhanVienBanHangID ?? "—"}</strong>
                    </div>
                    <div className="appointments__info-item">
                      Trạng thái:{" "}
                      {isAdmin ? (
                        <div className="appointments__status-edit">
                          <select
                            value={selectedStatus[c.CuocHenID] ?? c.TrangThai}
                            onChange={(e) =>
                              setSelectedStatus((prev) => ({
                                ...prev,
                                [c.CuocHenID]: e.target.value,
                              }))
                            }
                            disabled={editingStatus[c.CuocHenID]}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          {selectedStatus[c.CuocHenID] &&
                            selectedStatus[c.CuocHenID] !== c.TrangThai && (
                              <button
                                onClick={() => handleStatusChange(c.CuocHenID)}
                                disabled={editingStatus[c.CuocHenID]}
                                className="appointments__btn-mini"
                              >
                                {editingStatus[c.CuocHenID] ? "..." : "Lưu"}
                              </button>
                            )}
                        </div>
                      ) : (
                        <strong>{c.TrangThai || "—"}</strong>
                      )}
                    </div>
                    {(isChuDuAn || isAdmin) && (
                      <div className="appointments__info-item">
                        Khách hàng ID: <strong>{c.KhachHangID ?? "—"}</strong>
                      </div>
                    )}
                  </div>

                  {(isChuDuAn || isAdmin) && (
                    <div
                      className={`appointments__approval-status ${
                        isApproved ? "approved" : "pending"
                      }`}
                    >
                      Phê duyệt chủ dự án:{" "}
                      <strong>
                        {isApproved ? "✓ Đã phê duyệt" : "⏳ Chờ phê duyệt"}
                      </strong>
                    </div>
                  )}

                  {c.GhiChu && (
                    <div className="appointments__note">
                      Ghi chú: {c.GhiChu}
                    </div>
                  )}

                  <div className="appointments__actions">
                    <button
                      onClick={() => navigate(`/tin-dang/${c.TinDangID}`)}
                      className="appointments__btn"
                      title="Xem tin đăng"
                    >
                      Xem tin
                    </button>
                    {/* Nút nhắn tin - chỉ hiển thị khi trạng thái cho phép */}
                    {canSendMessage(c) && (
                      <button
                        onClick={() => setSelectedCuocHen(c)}
                        className="appointments__btn appointments__btn--chat"
                        title="Nhắn tin với nhân viên bán hàng"
                      >
                        <HiOutlineChatBubbleLeftRight />
                        Nhắn tin
                      </button>
                    )}
                    {needsApproval && (
                      <button
                        onClick={() => handleApprove(c.CuocHenID)}
                        className="appointments__btn appointments__btn--approve"
                        disabled={approving[c.CuocHenID]}
                        title="Phê duyệt cuộc hẹn"
                      >
                        {approving[c.CuocHenID] ? "Đang xử lý..." : "Phê duyệt"}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(c.CuocHenID)}
                        className="appointments__btn appointments__btn--delete"
                        disabled={deleting[c.CuocHenID]}
                        title="Xóa cuộc hẹn"
                      >
                        {deleting[c.CuocHenID] ? "Đang xóa..." : "Xóa"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Chat Panel - hiển thị khi chọn cuộc hẹn để nhắn tin */}
      {selectedCuocHen && (
        <ChatPanel 
          cuocHen={selectedCuocHen} 
          onClose={() => setSelectedCuocHen(null)} 
        />
      )}
    </div>
  );
};

/**
 * Wrapper component với ChatProvider
 */
const Appointments = () => {
  return (
    <ChatProvider>
      <AppointmentsContent />
    </ChatProvider>
  );
};

export default Appointments;
