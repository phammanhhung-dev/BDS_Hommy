import React, { useEffect, useMemo, useState } from "react";
import "./quanlytaikhoan.css";
import userApi from "../../api/userApi";

const createEmptyForm = () => ({
  id: null,
  TenDayDu: "",
  Email: "",
  SoDienThoai: "",
  password: "",
  VaiTroID: 1,
  TrangThai: "HoatDong",
});

function QuanLyTaiKhoan() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [form, setForm] = useState(createEmptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Helper để map ID vai trò ra tên vai trò
  const vaiTroMap = {
    1: "Khách hàng",
    3: "Chủ dự án",
    2: "Nhân viên bán hàng",
    4: "Nhân viên Điều hành",
    5: "Quản trị viên Hệ thống",
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userApi.getAll();
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const mapped = raw.map((u) => ({
        id: u.NguoiDungID ?? u.id ?? u._id,
        TenDayDu: u.TenDayDu ?? u.name ?? u.fullname,
        Email: u.Email ?? u.email,
        SoDienThoai: u.SoDienThoai ?? u.phone,
        VaiTroID: u.VaiTroID ?? u.roleId ?? u.role,
        TrangThai: u.TrangThai,
      }));
      setUsers(mapped);
    } catch (err) {
      console.error("Lỗi lấy users:", err?.response?.data || err.message);
      setError("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setForm(createEmptyForm());
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setModalMode("edit");
    setForm({
      id: user.id,
      TenDayDu: user.TenDayDu,
      Email: user.Email,
      SoDienThoai: user.SoDienThoai,
      password: "",
      VaiTroID: user.VaiTroID ?? 1,
      TrangThai: user.TrangThai ?? "HoatDong",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === "create") {
        const payload = {
          TenDayDu: form.TenDayDu,
          Email: form.Email,
          SoDienThoai: form.SoDienThoai,
          password: form.password,
          VaiTroID: Number(form.VaiTroID),
          TrangThai: form.TrangThai ?? "HoatDong",
        };
        await userApi.create(payload);
      } else {
        const payload = {
          TenDayDu: form.TenDayDu,
          Email: form.Email,
          SoDienThoai: form.SoDienThoai,
          VaiTroID: Number(form.VaiTroID),
          TrangThai: form.TrangThai ?? "HoatDong",
        };
        await userApi.update(form.id, payload);
      }
      setModalOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error("Lỗi lưu user:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "Lưu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(`Xác nhận xóa tài khoản: ${user.TenDayDu ?? user.Email}`)
    )
      return;
    try {
      await userApi.remove(user.id);
      await fetchUsers();
    } catch (err) {
      console.error("Lỗi xóa:", err?.response?.data || err.message);
      alert("Xóa thất bại");
    }
  };

  const handleLock = async (user) => {
    if (!window.confirm(`Khóa tài khoản: ${user.TenDayDu ?? user.Email}?`))
      return;
    try {
      await userApi.update(user.id, { TrangThai: "TamKhoa" });
      await fetchUsers();
    } catch (err) {
      console.error("Lỗi khóa tài khoản:", err?.response?.data || err.message);
      alert("Khóa thất bại");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keywordMatch =
        !keyword ||
        (user.TenDayDu || "").toLowerCase().includes(keyword.toLowerCase()) ||
        (user.Email || "").toLowerCase().includes(keyword.toLowerCase());
      const roleMatch = !roleFilter || String(user.VaiTroID) === roleFilter;
      const statusMatch =
        !statusFilter || (user.TrangThai || "").toLowerCase() === statusFilter.toLowerCase();
      return keywordMatch && roleMatch && statusMatch;
    });
  }, [users, keyword, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.TrangThai === "HoatDong").length;
    const locked = users.filter((u) => u.TrangThai === "TamKhoa").length;
    const admins = users.filter((u) => u.VaiTroID === 5).length;
    return { total, active, locked, admins };
  }, [users]);

  return (
    <div className="quan-ly-tai-khoan">
      <div className="quan-ly-tai-khoan__header">
        <div>
          <h1 className="quan-ly-tai-khoan__title">Quản lý tài khoản</h1>
          <p className="quan-ly-tai-khoan__subtitle">Theo dõi, phân quyền và khóa tài khoản nhanh chóng</p>
        </div>
        <button className="quan-ly-tai-khoan__primary-btn" onClick={openCreate}>
          + Thêm tài khoản
        </button>
      </div>

      <div className="quan-ly-tai-khoan__stats">
        <div className="quan-ly-tai-khoan__stat-card quan-ly-tai-khoan__stat-card--total">
          <span className="quan-ly-tai-khoan__stat-label">Tổng tài khoản</span>
          <span className="quan-ly-tai-khoan__stat-value">{stats.total}</span>
        </div>
        <div className="quan-ly-tai-khoan__stat-card quan-ly-tai-khoan__stat-card--active">
          <span className="quan-ly-tai-khoan__stat-label">Đang hoạt động</span>
          <span className="quan-ly-tai-khoan__stat-value">{stats.active}</span>
        </div>
        <div className="quan-ly-tai-khoan__stat-card quan-ly-tai-khoan__stat-card--locked">
          <span className="quan-ly-tai-khoan__stat-label">Bị khóa</span>
          <span className="quan-ly-tai-khoan__stat-value">{stats.locked}</span>
        </div>
        <div className="quan-ly-tai-khoan__stat-card quan-ly-tai-khoan__stat-card--admin">
          <span className="quan-ly-tai-khoan__stat-label">Quản trị viên</span>
          <span className="quan-ly-tai-khoan__stat-value">{stats.admins}</span>
        </div>
      </div>

      <div className="quan-ly-tai-khoan__filters">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="quan-ly-tai-khoan__input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="quan-ly-tai-khoan__input"
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(vaiTroMap).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="quan-ly-tai-khoan__input"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="HoatDong">Hoạt động</option>
          <option value="TamKhoa">Tạm khóa</option>
          <option value="VoHieuHoa">Vô hiệu hóa</option>
        </select>
        <button
          type="button"
          className="quan-ly-tai-khoan__secondary-btn"
          onClick={() => {
            setKeyword("");
            setRoleFilter("");
            setStatusFilter("");
          }}
        >
          ↺ Đặt lại
        </button>
      </div>

      {loading && <div className="quan-ly-tai-khoan__alert">Đang tải dữ liệu...</div>}
      {error && <div className="quan-ly-tai-khoan__alert quan-ly-tai-khoan__alert--error">{error}</div>}

      <div className="quan-ly-tai-khoan__table-wrapper">
        <table className="quan-ly-tai-khoan__table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="quan-ly-tai-khoan__table-empty">
                  Không tìm thấy tài khoản nào
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="quan-ly-tai-khoan__user-info">
                      <span className="quan-ly-tai-khoan__user-name">{user.TenDayDu ?? "-"}</span>
                      <span className="quan-ly-tai-khoan__user-id">#{user.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="quan-ly-tai-khoan__contact">
                      <span>{user.Email ?? "-"}</span>
                      <span>{user.SoDienThoai ?? "-"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="quan-ly-tai-khoan__badge">
                      {vaiTroMap[user.VaiTroID] ?? "Không xác định"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`quan-ly-tai-khoan__status quan-ly-tai-khoan__status--${(user.TrangThai || "")
                        .toLowerCase()}`}
                    >
                      {user.TrangThai ?? "-"}
                    </span>
                  </td>
                  <td>
                    <div className="quan-ly-tai-khoan__actions">
                      <button
                        className="quan-ly-tai-khoan__action-btn"
                        onClick={() => openEdit(user)}
                      >
                        Sửa
                      </button>
                      <button
                        className="quan-ly-tai-khoan__action-btn quan-ly-tai-khoan__action-btn--outline"
                        onClick={() => handleLock(user)}
                        disabled={user.TrangThai === "TamKhoa"}
                      >
                        {user.TrangThai === "TamKhoa" ? "Đã khóa" : "Khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="quan-ly-tai-khoan__modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="quan-ly-tai-khoan__modal" onClick={(e) => e.stopPropagation()}>
            <div className="quan-ly-tai-khoan__modal-header">
              <h3>{modalMode === "create" ? "Thêm tài khoản" : "Cập nhật tài khoản"}</h3>
              <button className="quan-ly-tai-khoan__modal-close" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="quan-ly-tai-khoan__form">
              <label className="quan-ly-tai-khoan__form-field">
                <span>Họ tên</span>
                <input name="TenDayDu" value={form.TenDayDu} onChange={handleChange} required />
              </label>
              <label className="quan-ly-tai-khoan__form-field">
                <span>Email</span>
                <input
                  name="Email"
                  value={form.Email}
                  onChange={handleChange}
                  type="email"
                  required
                />
              </label>
              <label className="quan-ly-tai-khoan__form-field">
                <span>Số điện thoại</span>
                <input name="SoDienThoai" value={form.SoDienThoai} onChange={handleChange} required />
              </label>
              {modalMode === "create" && (
                <label className="quan-ly-tai-khoan__form-field">
                  <span>Mật khẩu</span>
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type="password"
                    required
                  />
                </label>
              )}
              <label className="quan-ly-tai-khoan__form-field">
                <span>Vai trò</span>
                <select name="VaiTroID" value={form.VaiTroID} onChange={handleChange}>
                  {Object.entries(vaiTroMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="quan-ly-tai-khoan__form-field">
                <span>Trạng thái</span>
                <select name="TrangThai" value={form.TrangThai ?? "HoatDong"} onChange={handleChange}>
                  <option value="HoatDong">Hoạt động</option>
                  <option value="TamKhoa">Tạm khóa</option>
                  <option value="VoHieuHoa">Vô hiệu hóa</option>
                  <option value="XoaMem">Xóa mềm</option>
                </select>
              </label>
              <div className="quan-ly-tai-khoan__form-actions">
                <button
                  type="button"
                  className="quan-ly-tai-khoan__secondary-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="quan-ly-tai-khoan__primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuanLyTaiKhoan;
