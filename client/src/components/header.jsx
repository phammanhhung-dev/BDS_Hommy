import "./header.css";
import logo from "../assets/images/Hommy_Logo_Web.svg";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import yeuThichApi from "../api/yeuThichApi";
import thongBaoApi from "../api/thongBaoApi";
import { getStaticUrl } from "../config/api";
import {
  HiOutlineLanguage,
  HiOutlineSun,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowTrendingUp
} from "react-icons/hi2";
import {
  MdOutlineDashboard,
  MdOutlineArticle,
  MdOutlinePeople,
  MdOutlineSupportAgent,
  MdOutlineCardMembership,
  MdOutlineAccountBalanceWallet,
  MdOutlineSettings,
  MdOutlineLock,
  MdExitToApp,
  MdOutlineSync,
} from 'react-icons/md';
import { HiOutlinePhone, HiOutlineMail } from "react-icons/hi";
import { HiOutlineHeart, HiHeart, HiOutlineBell, HiBell } from 'react-icons/hi';
import { GiTopHat } from 'react-icons/gi';
import { useLanguage, useTranslation } from "../context/LanguageContext";
import axiosClient from "../api/axiosClient";

function Header() {
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notificationCount = notifications.filter(n => n.unread).length;

  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const userRef = useRef(null);
  const favRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (favRef.current && !favRef.current.contains(event.target)) {
        setShowFavorites(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // PWA install flow removed to simplify header UI

  // Load saved preferences
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  // lấy user từ localStorage (với cấu trúc bạn đã paste: { user: { ... } })
  useEffect(() => {
    const raw =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("nguoidung");
    if (!raw) {
      const idKey = localStorage.getItem("userId");
      if (idKey && !isNaN(Number(idKey)))
        setCurrentUser({ NguoiDungID: Number(idKey) });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const actual = parsed.user ?? parsed;
      const id = actual?.NguoiDungID ?? actual?.id ?? actual?.userId;
      const name =
        actual?.TenDayDu ?? actual?.Ten ?? actual?.fullname ?? actual?.name;
      setCurrentUser({ ...actual, NguoiDungID: id, TenDayDu: name });
    } catch (e) {
      // not JSON -> ignore
      const num = Number(raw);
      if (!isNaN(num)) setCurrentUser({ NguoiDungID: num });
    }
  }, []);

  // load favorites khi có userId
  useEffect(() => {
    if (!currentUser?.NguoiDungID) return;
    (async () => {
      setFavLoading(true);
      try {
        const res = await yeuThichApi.listWithTinDetails(
          currentUser.NguoiDungID
        );
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        setFavorites(raw);
      } catch (err) {
        console.error("Lỗi lấy yêu thích:", err?.response?.data || err.message);
        setFavorites([]);
      } finally {
        setFavLoading(false);
      }
    })();
  }, [currentUser]);

  // Helper: Định dạng thời gian thông báo
  const formatNotifTime = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Vừa xong";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    if (diffSec < 172800) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Helper: Lấy icon biểu tượng theo từng loại thông báo
  const getNotifIcon = (payload, categoryType) => {
    if (payload?.icon) return payload.icon;
    const subType = payload?.subType || payload?.type;
    if (subType === 'nap_tien' || subType === 'thanh_toan' || categoryType === 'tai-chinh') return '💰';
    if (subType === 'dang_nhap') return '🔐';
    if (subType === 'voucher' || subType === 'uu_dai' || categoryType === 'khuyen-mai') return '🎁';
    if (subType === 'cuoc_hen_moi' || subType === 'lich_hen') return '📅';
    if (subType === 'tin_dang_duyet') return '🏠';
    if (subType === 'tin_dang_tuchoi') return '⚠️';
    return '📢';
  };

  // load notifications khi có userId
  useEffect(() => {
    if (!currentUser?.NguoiDungID) {
      setNotifications([]);
      return;
    }
    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await thongBaoApi.layDanhSach({ limit: 50 });
        const raw = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
        const mapped = raw.map((n) => {
          let type = "tin-dang";
          if (n.Payload?.type) {
            const pType = n.Payload.type;
            if (["tro_chuyen_moi", "cuoc_hen_moi", "tin_dang_duyet", "tin_dang_tuchoi", "tin-dang", "tin_dang", "dang_nhap"].includes(pType)) {
              type = "tin-dang";
            } else if (["giao_dich_coc", "tai-chinh", "tai_chinh", "nap_tien", "thanh_toan", "hoan_tien"].includes(pType)) {
              type = "tai-chinh";
            } else if (["khuyen-mai", "khuyen_mai", "voucher", "uu_dai"].includes(pType)) {
              type = "khuyen-mai";
            }
          }
          return {
            id: n.ThongBaoID,
            type: type,
            title: n.TieuDe,
            desc: n.NoiDung,
            date: n.TaoLuc ? formatNotifTime(n.TaoLuc) : "",
            unread: n.TrangThai === "ChuaDoc",
            icon: getNotifIcon(n.Payload, type),
            url: n.Payload?.url || (type === 'tai-chinh' ? '/vi' : type === 'tin-dang' ? '/chu-du-an/tin-dang' : '/'),
            payload: n.Payload
          };
        });
        setNotifications(mapped);
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err?.response?.data || err.message);
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();

    // Thỉnh thoảng refresh (ví dụ: mỗi 60 giây)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Tạo thông báo thử cho demo
  const handleCreateTestNotif = async (loai) => {
    try {
      await axiosClient.post("/thong-bao/tao-thu", { loai });
      const res = await thongBaoApi.layDanhSach({ limit: 50 });
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      const mapped = raw.map((n) => {
        let type = "tin-dang";
        if (n.Payload?.type) {
          const pType = n.Payload.type;
          if (["tro_chuyen_moi", "cuoc_hen_moi", "tin_dang_duyet", "tin_dang_tuchoi", "tin-dang", "tin_dang", "dang_nhap"].includes(pType)) {
            type = "tin-dang";
          } else if (["giao_dich_coc", "tai-chinh", "tai_chinh", "nap_tien", "thanh_toan", "hoan_tien"].includes(pType)) {
            type = "tai-chinh";
          } else if (["khuyen-mai", "khuyen_mai", "voucher", "uu_dai"].includes(pType)) {
            type = "khuyen-mai";
          }
        }
        return {
          id: n.ThongBaoID,
          type: type,
          title: n.TieuDe,
          desc: n.NoiDung,
          date: n.TaoLuc ? formatNotifTime(n.TaoLuc) : "",
          unread: n.TrangThai === "ChuaDoc",
          icon: getNotifIcon(n.Payload, type),
          url: n.Payload?.url || (type === 'tai-chinh' ? '/vi' : type === 'tin-dang' ? '/chu-du-an/tin-dang' : '/'),
          payload: n.Payload
        };
      });
      setNotifications(mapped);
    } catch (err) {
      console.error("Lỗi tạo thông báo thử:", err);
    }
  };

  const handleRemoveFav = async (item) => {
    if (!currentUser?.NguoiDungID) return;
    const tin = item.TinDang ?? item.tinDang ?? item;
    const tinId = tin?.TinDangID ?? tin?.id ?? tin?._id;
    if (!tinId) return;
    if (!window.confirm(t('header.confirmRemove'))) return;
    try {
      await yeuThichApi.remove(currentUser.NguoiDungID, tinId);
      setFavorites((prev) =>
        prev.filter((f) => {
          const fi =
            (f.TinDang ?? f).TinDangID ??
            (f.TinDang ?? f).id ??
            (f.TinDang ?? f)._id;
          return fi !== tinId;
        })
      );
    } catch (err) {
      console.error("Lỗi xóa yêu thích:", err?.response?.data || err.message);
      alert(t('header.removeFailed'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    sessionStorage.clear();
    setCurrentUser(null);
    setFavorites([]);
    // Force reload và redirect về login
    window.location.href = "/login";
  };

  const resolveImageSrc = (value) => {
    if (!value) return null;

    const normalizeCandidates = (input) => {
      if (!input) return [];
      if (Array.isArray(input)) return input;
      if (typeof input === "string") {
        if (input.trim().startsWith("[")) {
          try {
            const parsed = JSON.parse(input);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [input];
          }
        }
        return [input];
      }
      return [input];
    };

    const firstCandidate = normalizeCandidates(value).find(Boolean);
    if (!firstCandidate || typeof firstCandidate !== "string") return null;
    return getStaticUrl(firstCandidate);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Hàm lấy VaiTroID từ user object
  const getRoleId = (user) => {
    if (!user) return null;
    return user.VaiTroHoatDongID || user.VaiTroID || user.roleId;
  };

  const getUserMenuItems = (roleId) => {
    // 1. Khách hàng hoặc chưa có role (role 1 hoặc null)
    if (roleId === 1 || !roleId) {
      return [
        {
          onClick: handleSwitchToPostAd,
          label: 'Chuyển sang đăng tin',
          icon: <MdOutlineSync />,
          dividerAfter: true,
        },
        {
          to: '/cuochencuatoi',
          label: 'Lịch hẹn của tôi',
          icon: <MdOutlineDashboard />,
        },
        {
          to: '/vi',
          label: 'Ví của tôi (Nạp tiền)',
          icon: <MdOutlineAccountBalanceWallet />,
        },
        {
          to: '/cai-dat',
          label: 'Cài đặt tài khoản',
          icon: <MdOutlineSettings />,
          dividerAfter: true,
        }
      ];
    }

    // 2. Chủ dự án (role 3)
    if (roleId === 3) {
      return [
        {
          to: '/chu-du-an/dashboard',
          label: 'Tổng quan',
          icon: <HiOutlineChartBar />,
        },
        {
          to: '/chu-du-an/tin-dang',
          label: 'Tin đăng',
          icon: <HiOutlineDocumentText />,
        },
        {
          to: '/chu-du-an/du-an',
          label: 'Dự án',
          icon: <HiOutlineHome />,
        },
        {
          to: '/chu-du-an/cuoc-hen',
          label: 'Cuộc hẹn',
          icon: <HiOutlineCalendar />,
        },
        {
          to: '/chu-du-an/tin-nhan',
          label: 'Trò chuyện',
          icon: <HiOutlineChatBubbleLeftRight />,
        },
        {
          to: '/chu-du-an/bao-cao',
          label: 'Báo cáo',
          icon: <HiOutlineArrowTrendingUp />,
        },
        {
          to: '/chu-du-an/hop-dong',
          label: 'Hợp đồng',
          icon: <HiOutlineDocumentText />,
        },
        {
          to: '/vi',
          label: 'Ví của tôi (Nạp tiền)',
          icon: <MdOutlineAccountBalanceWallet />,
          dividerAfter: true,
        },
        {
          to: '/cai-dat',
          label: 'Cài đặt tài khoản',
          icon: <MdOutlineSettings />,
          dividerAfter: true,
        }
      ];
    }

    // 3. Nhân viên bán hàng (role 2)
    if (roleId === 2) {
      return [
        {
          to: '/nhan-vien-ban-hang',
          label: 'Tổng quan nhân viên',
          icon: <MdOutlineDashboard />,
        },
        {
          to: '/nhan-vien-ban-hang/lich-lam-viec',
          label: 'Lịch làm việc',
          icon: <MdOutlineSync />,
        },
        {
          to: '/nhan-vien-ban-hang/cuoc-hen',
          label: 'Quản lý cuộc hẹn',
          icon: <MdOutlinePeople />,
          dividerAfter: true,
        },
        {
          to: '/cai-dat',
          label: 'Cài đặt tài khoản',
          icon: <MdOutlineSettings />,
          dividerAfter: true,
        }
      ];
    }

    // 4. Nhân viên điều hành (role 4)
    if (roleId === 4) {
      return [
        {
          to: '/nvdh/dashboard',
          label: 'Tổng quan điều hành',
          icon: <MdOutlineDashboard />,
        },
        {
          to: '/nvdh/duyet-tin-dang',
          label: 'Duyệt tin đăng',
          icon: <MdOutlineArticle />,
        },
        {
          to: '/nvdh/du-an',
          label: 'Quản lý dự án',
          icon: <MdOutlineSync />,
        },
        {
          to: '/nvdh/nhan-vien',
          label: 'Quản lý nhân viên',
          icon: <MdOutlinePeople />,
          dividerAfter: true,
        }
      ];
    }

    // 5. Admin (role 5)
    return [
      {
        to: '/quan-ly',
        label: 'Trang Admin',
        icon: <MdOutlineDashboard />,
        dividerAfter: true,
      }
    ];
  };

  // Handler khi bấm "Đăng tin" - kiểm tra role và hiển thị modal nếu cần
  const handlePostAdClick = (e) => {
    e.preventDefault();
    closeMobileMenu();

    const roleId = getRoleId(currentUser);

    // Nếu là Khách hàng (role 1) hoặc chưa có role -> hiển thị modal nâng cấp
    if (roleId === 1 || roleId === null) {
      setShowUpgradeModal(true);
    } else if (roleId === 3) {
      // Nếu đã là Chủ dự án -> hiển thị modal xác nhận chuyển qua
      setShowSwitchModal(true);
    } else {
      // Role khác -> navigate trực tiếp
      navigate('/chu-du-an/tao-tin-dang');
    }
  };

  // Handler khi bấm "Chuyển sang đăng tin" trong dropdown
  const handleSwitchToPostAd = () => {
    setUserMenuOpen(false);

    const roleId = getRoleId(currentUser);

    // Nếu là Khách hàng (role 1) hoặc chưa có role -> hiển thị modal nâng cấp
    if (roleId === 1 || roleId === null) {
      setShowUpgradeModal(true);
    } else if (roleId === 3) {
      // Nếu đã là Chủ dự án -> hiển thị modal xác nhận chuyển qua
      setShowSwitchModal(true);
    } else {
      // Role khác -> navigate trực tiếp
      navigate('/chu-du-an/tao-tin-dang');
    }
  };

  // Handler nâng cấp lên Chủ dự án
  const handleUpgradeRole = async () => {
    if (!currentUser?.NguoiDungID) return;

    setUpgrading(true);
    try {
      const response = await axiosClient.put(`/users/${currentUser.NguoiDungID}/upgrade-role`, {
        targetRole: 3
      });

      if (response.data.success) {
        // Lấy token hiện tại từ localStorage
        const currentToken = localStorage.getItem('token');

        // Cập nhật user trong localStorage với cấu trúc PHẲNG như lúc đăng nhập
        // TenVaiTro sẽ được middleware authMiddleware lấy từ DB mỗi request
        const updatedUser = {
          ...currentUser,
          VaiTroHoatDongID: 3,
          VaiTroID: 3,
          TenVaiTro: 'Chủ dự án'  // Tên vai trò từ bảng vaitro (đã UPDATE)
        };

        // Cấu trúc PHẲNG: { token, ...userFields }
        localStorage.setItem('user', JSON.stringify({
          token: currentToken,
          ...updatedUser
        }));

        // Cập nhật state
        setCurrentUser(updatedUser);

        // Đóng modal và navigate
        setShowUpgradeModal(false);
        navigate('/chu-du-an/tao-tin-dang');
      } else {
        alert('Lỗi nâng cấp: ' + (response.data.message || 'Không thể nâng cấp'));
      }
    } catch (error) {
      console.error('Lỗi nâng cấp role:', error);
      alert('Lỗi hệ thống khi nâng cấp: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpgrading(false);
    }
  };

  // Close user menu on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Bỏ qua đến nội dung chính
      </a>
      <div className="header__topbar">
        <div className="header__topbar-container">
          <div className="header__topbar-left">
            <a href="tel:0349195610" className="header__topbar-link">
              <HiOutlinePhone className="header__topbar-icon" />
              <span>0356960304</span>
            </a>
            <a href="mailto:tuanpham11255@gmail.com" className="header__topbar-link">
              <HiOutlineMail className="header__topbar-icon" />
              <span>batdongsanhommy@gmail.com</span>
            </a>
          </div>
          <div className="header__topbar-right">
            <ul className="header__topbar-list">
              {!currentUser && (
                <>
                  <li className="header__topbar-item">
                    <Link to="/dangky" className="header__topbar-link header__auth-btn header__auth-btn--ghost">
                      {t('header.register')}
                    </Link>
                  </li>
                  <li className="header__topbar-item">
                    <Link to="/login" className="header__topbar-link header__auth-btn header__auth-btn--primary">
                      {t('header.login')}
                    </Link>
                  </li>
                </>
              )}
              {currentUser && (
                <>
                  <li className="header__topbar-item">
                    <span className="header__topbar-text">
                      {t('header.hello')}: {currentUser.TenDayDu ?? currentUser.name ?? `ID:${currentUser.NguoiDungID}`}
                    </span>
                  </li>
                  <li className="header__topbar-item">
                    <button onClick={handleLogout} className="header__topbar-btn header__auth-btn header__auth-btn--ghost" type="button">
                      {t('header.logout')}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="header__container">
          <div className="header__left">
            <div className="header__logo">
              <Link to="/" onClick={closeMobileMenu} aria-label="Trang chủ">
                <img src={logo} alt="Hommy - Nền tảng bất động sản" width="64" height="64" loading="eager" />
              </Link>
            </div>

            <button
              className="header__menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              type="button"
            >
              <span className="header__menu-toggle-line"></span>
              <span className="header__menu-toggle-line"></span>
              <span className="header__menu-toggle-line"></span>
            </button>

            <nav className={`header__nav ${mobileMenuOpen ? 'header__nav--open' : ''}`}>
              <ul className="header__nav-list">
                <li className="header__nav-item">
                  <Link to="/nha-dat-ban" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.sell')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/nha-dat-cho-thue" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.rent')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/du-an" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.projects')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/wiki-bds" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.wiki')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/phan-tich-danh-gia" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.analysis')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/tin-tuc-bds" className="header__nav-link" onClick={closeMobileMenu}>
                    {t('nav.news')}
                  </Link>
                </li>
                <li className="header__nav-item">
                  <Link to="/dinh-gia-ai" className="header__nav-link header__nav-link--ai" style={{ fontWeight: 'bold', color: '#10b981' }} onClick={closeMobileMenu}>
                    Định giá AI 🤖
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="header__right">
            <div className="header__actions">
              {/* Language Toggle */}
              <button
                className="header__action-btn header__action-btn--language"
                onClick={toggleLanguage}
                type="button"
                aria-label="Đổi ngôn ngữ"
                title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              >
                <HiOutlineLanguage className="header__action-icon" />
                <span className="header__action-text">{language === 'vi' ? 'VI' : 'EN'}</span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                className="header__action-btn header__action-btn--theme"
                onClick={toggleDarkMode}
                type="button"
                aria-label="Chế độ sáng/tối"
                title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              >
                {darkMode ? (
                  <HiOutlineSun className="header__action-icon" />
                ) : (
                  <HiOutlineLightBulb className="header__action-icon" />
                )}
              </button>
            </div>

            <div className="header__favorites" ref={favRef}>
              <button
                className="header__favorites-btn"
                onClick={() => { setShowFavorites(!showFavorites); setShowNotifications(false); }}
                type="button"
                aria-label="Yêu thích"
              >
                <HiOutlineHeart className="header__favorites-icon" aria-hidden />
                {favorites.length > 0 && (
                  <span className="header__favorites-badge">{favorites.length}</span>
                )}
              </button>

              {showFavorites && (
                <div className="header__favorites-dropdown">
                  <h4 className="dropdown-title">Tin đăng đã lưu</h4>
                  {favLoading ? (
                    <div className="dropdown-loading">Đang tải...</div>
                  ) : favorites.length === 0 ? (
                    <div className="dropdown-empty">Chưa có tin đăng yêu thích nào</div>
                  ) : (
                    <ul className="dropdown-list">
                      {favorites.map((item) => {
                        const tin = item.TinDang ?? item.tinDang ?? item;
                        const tinId = tin?.TinDangID ?? tin?.id ?? tin?._id;
                        let imageUrl = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80";
                        const imageSource = tin?.Img || tin?.URL || tin?.HinhAnh || tin?.HinhAnhPhong;
                        if (imageSource) {
                          try {
                            const parsed = typeof imageSource === "string" ? JSON.parse(imageSource) : imageSource;
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              imageUrl = getStaticUrl(parsed[0]);
                            } else if (typeof parsed === "string") {
                              imageUrl = getStaticUrl(parsed);
                            }
                          } catch {
                            if (typeof imageSource === "string") {
                              imageUrl = getStaticUrl(imageSource);
                            }
                          }
                        }

                        return (
                          <li key={tinId} className="dropdown-item">
                            <Link to={`/tin-dang/${tinId}`} onClick={() => setShowFavorites(false)} className="item-link">
                              <img src={imageUrl} alt={tin?.TieuDe} className="item-thumb" />
                              <div className="item-info">
                                <h5 className="item-title">{tin?.TieuDe}</h5>
                                <span className="item-price">
                                  {tin?.GiaTien ? `${tin.GiaTien >= 1000 ? (tin.GiaTien / 1000).toFixed(1) + " Tỷ" : tin.GiaTien + " Triệu"}` : "Thỏa thuận"}
                                </span>
                              </div>
                            </Link>
                            <button type="button" className="item-remove-btn" onClick={() => handleRemoveFav(item)}>×</button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="header__notify" ref={notifRef}>
              <button
                className="header__notify-btn"
                onClick={() => { setShowNotifications(!showNotifications); setShowFavorites(false); }}
                type="button"
                aria-label="Thông báo"
              >
                <HiOutlineBell className="header__notify-icon" aria-hidden />
                {notificationCount > 0 && (
                  <span className="header__notify-badge">{notificationCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="header__notify-dropdown notify-dropdown--premium">
                  <div className="notify-dropdown__header">
                    <span className="notify-dropdown__title">Thông báo</span>
                    <div className="notify-dropdown__controls">
                      <label className="unread-toggle">
                        <input
                          type="checkbox"
                          checked={unreadOnly}
                          onChange={(e) => setUnreadOnly(e.target.checked)}
                        />
                        <span className="slider"></span>
                        <span className="label-text">Chưa đọc</span>
                      </label>
                      <button
                        type="button"
                        className="mark-read-all-btn"
                        title="Đánh dấu tất cả đã đọc"
                        onClick={async () => {
                          try {
                            await thongBaoApi.danhDauDocTatCa();
                            setNotifications((prev) =>
                              prev.map((n) => ({ ...n, unread: false }))
                            );
                          } catch (err) {
                            console.error("Lỗi đánh dấu đọc tất cả:", err);
                          }
                        }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        className="delete-all-notif-btn"
                        title="Xóa tất cả thông báo"
                        onClick={async () => {
                          if (!window.confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) return;
                          try {
                            await thongBaoApi.xoaTatCa();
                            setNotifications([]);
                          } catch (err) {
                            console.error("Lỗi xóa tất cả thông báo:", err);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="notify-dropdown__tabs">
                    {[
                      { id: "all", label: "Tất cả" },
                      { id: "tin-dang", label: "Tin đăng" },
                      { id: "tai-chinh", label: "Tài chính" },
                      { id: "khuyen-mai", label: "Khuyến mãi" },
                    ].map((tab) => {
                      const count = notifications.filter(
                        (n) => (!unreadOnly || n.unread) && (tab.id === "all" || n.type === tab.id)
                      ).length;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`tab-btn ${activeNotifTab === tab.id ? "active" : ""}`}
                          onClick={() => setActiveNotifTab(tab.id)}
                        >
                          <span>{tab.label}</span>
                          {count > 0 && <span className="tab-badge">{count}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <ul className="dropdown-list notify-list-premium">
                    {favLoading || notifLoading ? (
                      <div className="dropdown-loading">Đang tải...</div>
                    ) : notifications
                      .filter((n) => !unreadOnly || n.unread)
                      .filter((n) => activeNotifTab === "all" || n.type === activeNotifTab)
                      .length === 0 ? (
                      <div className="dropdown-empty">Chưa có thông báo nào</div>
                    ) : (
                      notifications
                        .filter((n) => !unreadOnly || n.unread)
                        .filter((n) => activeNotifTab === "all" || n.type === activeNotifTab)
                        .map((notif) => (
                          <li
                            key={notif.id}
                            data-type={notif.type}
                            className={`dropdown-item notif-item ${notif.unread ? "unread" : ""
                              }`}
                            onClick={async () => {
                              if (notif.unread) {
                                try {
                                  await thongBaoApi.danhDauDaDoc(notif.id);
                                  setNotifications((prev) =>
                                    prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
                                  );
                                } catch (err) {
                                  console.error("Lỗi đánh dấu đã đọc:", err);
                                }
                              }
                              if (notif.url) {
                                setShowNotifications(false);
                                navigate(notif.url);
                              }
                            }}
                          >
                            {notif.unread && <span className="unread-dot"></span>}
                            <div className="notif-circle">{notif.icon || "📢"}</div>
                            <div className="notif-info">
                              <h5 className="notif-title">{notif.title}</h5>
                              <p className="notif-desc">{notif.desc}</p>
                              <span className="notif-time">{notif.date}</span>
                            </div>
                            <button
                              type="button"
                              className="notif-delete-btn"
                              title="Xóa thông báo này"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await thongBaoApi.xoa(notif.id);
                                  setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                                } catch (err) {
                                  console.error("Lỗi xóa thông báo:", err);
                                }
                              }}
                            >
                              ×
                            </button>
                          </li>
                        ))
                    )}
                  </ul>

                  <div className="notify-dropdown__footer">
                    <span className="notify-dropdown__footer-title">Tạo nhanh:</span>
                    <div className="test-notif-group">
                      <button
                        type="button"
                        className="test-notif-btn test-notif-btn--finance"
                        title="Tạo thông báo Nạp tiền thành công"
                        onClick={() => handleCreateTestNotif('nap_tien')}
                      >
                        + 💰 Nạp tiền
                      </button>
                      <button
                        type="button"
                        className="test-notif-btn test-notif-btn--promo"
                        title="Tạo thông báo Khuyến mãi"
                        onClick={() => handleCreateTestNotif('khuyen_mai')}
                      >
                        + 🎁 KM
                      </button>
                      <button
                        type="button"
                        className="test-notif-btn"
                        title="Tạo thông báo Tin đăng được duyệt"
                        onClick={() => handleCreateTestNotif('tin_dang')}
                      >
                        + 🏠 Tin đăng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="header__user" ref={userRef}>
              {currentUser ? (
                <>
                  <button
                    className="header__user-btn"
                    onClick={() => setUserMenuOpen((s) => !s)}
                    aria-label="Tài khoản"
                    type="button"
                  >
                    {resolveImageSrc(currentUser.Anh) ? (
                      <img src={resolveImageSrc(currentUser.Anh)} alt={currentUser.TenDayDu || 'User'} className="header__user-avatar-img" />
                    ) : (
                      <div className="header__user-avatar header__user-avatar--initial">
                        {(currentUser.TenDayDu || currentUser.name || `U`).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="header__user-dropdown header__user-dropdown--bds">
                      <div className="header__user-voucher">
                        <div className="header__user-voucher-icon">
                          <GiTopHat aria-hidden="true" />
                        </div>
                        <div className="header__user-voucher-body">
                          <div className="header__user-voucher-title">Gói voucher tin VIP</div>
                          <div className="header__user-voucher-sub">Tiết kiệm chi phí, nâng tầm tin đăng</div>
                          <button type="button" className="header__user-voucher-btn" onClick={() => { setUserMenuOpen(false); navigate('/vi'); }}>Mua ngay</button>
                        </div>
                      </div>

                      <div className="header__user-menu">
                        <div className="header__user-name-block">{currentUser.TenDayDu || currentUser.name || `ID:${currentUser.NguoiDungID}`}</div>

                        <ul className="header__user-menu-list">
                          {getUserMenuItems(getRoleId(currentUser)).map((it) => (
                            <li
                              key={it.to || it.label}
                              className={`header__user-menu-item${it.dividerAfter ? ' header__user-menu-item--divider' : ''}`}
                              onClick={() => {
                                setUserMenuOpen(false);
                                if (it.onClick) {
                                  it.onClick();
                                } else if (it.to) {
                                  navigate(it.to);
                                }
                              }}
                            >
                              <span className="header__user-menu-icon">{it.icon}</span>
                              <span className="header__user-menu-label">{it.label}</span>
                              {it.badge && <span className="header__user-badge">{it.badge}</span>}
                            </li>
                          ))}

                          <li className="header__user-menu-item" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                            <span className="header__user-menu-icon"><MdExitToApp /></span>
                            <span className="header__user-menu-label">Đăng xuất</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className={`header__post-btn-wrapper ${mobileMenuOpen ? 'header__post-btn-wrapper--open' : ''}`}>
              <button onClick={handlePostAdClick} className="header__post-btn">
                {t('header.postAd') || 'Đăng tin'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal xác nhận nâng cấp lên Chủ dự án */}
      {showUpgradeModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Nâng cấp thành Chủ dự án
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#4b5563',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              Bạn hiện đang là <strong>Khách hàng</strong>. Để đăng tin dự án, bạn cần nâng cấp tài khoản thành <strong>Chủ dự án</strong>.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowUpgradeModal(false)}
                disabled={upgrading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  opacity: upgrading ? 0.5 : 1
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpgradeRole}
                disabled={upgrading}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: upgrading ? 'not-allowed' : 'pointer',
                  opacity: upgrading ? 0.5 : 1
                }}
              >
                {upgrading ? 'Đang nâng cấp...' : 'Đồng ý nâng cấp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận chuyển qua trang chủ dự án */}
      {showSwitchModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '1rem'
            }}>
              Chuyển qua trang chủ dự án
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#4b5563',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              Bạn hiện đang là <strong>Chủ dự án</strong>. Bạn có muốn chuyển qua trang đăng tin dự án không?
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSwitchModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  navigate('/chu-du-an/tao-tin-dang');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Đồng ý chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
