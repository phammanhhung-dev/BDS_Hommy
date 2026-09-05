const User = require("../models/userModel");
const crypto = require("crypto");

const mapUser = (row) => {
  if (!row) return null;
  return {
    NguoiDungID: row.NguoiDungID,
    TenDayDu: row.TenDayDu,
    Email: row.Email,
    SoDienThoai: row.SoDienThoai,
    TrangThai: row.TrangThai === undefined ? null : row.TrangThai,
    TaoLuc: row.TaoLuc,
    CapNhatLuc: row.CapNhatLuc,
    VaiTroID: row.VaiTroHoatDongID,
  };
};

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await User.getAll();
    res.json(rows.map(mapUser));
  } catch (err) {
    console.error('[UserController] getUsers error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.createUser = async (req, res) => {
  // Accept Vietnamese fields (preferred) or English
  const {
    TenDayDu,
    name,
    Email,
    email,
    SoDienThoai,
    phone,
    MatKhauHash,
    password,
    VaiTroID,
    roleId,
  } = req.body;

  const finalName = TenDayDu || name;
  const finalEmail = Email || email;
  const finalPhone = SoDienThoai || phone;
  const finalRole = VaiTroID != null ? VaiTroID : roleId;

  if (!finalName || !finalEmail || !finalPhone) {
    return res
      .status(400)
      .json({ error: "TenDayDu, Email, SoDienThoai là bắt buộc" });
  }

  const hash =
    MatKhauHash ||
    (password
      ? crypto.createHash("md5").update(String(password)).digest("hex")
      : null);

  try {
    // expects models/userModel.js to expose createNguoiDung(tenDayDu, email, soDienThoai, matKhauHash, vaiTroID)
    const [result] = await User.createNguoiDung(
      finalName,
      finalEmail,
      finalPhone,
      hash,
      finalRole || null
    );
    const created = {
      NguoiDungID: result.insertId,
      TenDayDu: finalName,
      Email: finalEmail,
      SoDienThoai: finalPhone,
      TrangThai: null,
      TaoLuc: new Date().toISOString(),
      CapNhatLuc: new Date().toISOString(),
      VaiTroID: finalRole || null,
    };
    res.status(201).json(created);
  } catch (err) {
    console.error('[UserController] createUser error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.getUserById = async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await User.getById(id);
    if (!rows || rows.length === 0)
      return res.status(404).json({ error: "Not found" });
    res.json(mapUser(rows[0]));
  } catch (err) {
    console.error('[UserController] getUserById error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.updateUser = async (req, res) => {
  const id = req.params.id;
  const {
    TenDayDu,
    Email,
    SoDienThoai,
    MatKhauHash,
    VaiTroID,
    TrangThai,
    name,
    email,
    phone,
    password,
    roleId,
    trangThai,
  } = req.body;

  const updates = {};
  const finalName = TenDayDu || name;
  const finalEmail = Email || email;
  const finalPhone = SoDienThoai || phone;
  const finalRole =
    VaiTroID != null ? VaiTroID : roleId != null ? roleId : undefined;
  const finalTrangThai =
    TrangThai != null ? TrangThai : trangThai != null ? trangThai : undefined;

  if (finalName) updates.TenDayDu = finalName;
  if (finalEmail) updates.Email = finalEmail;
  if (finalPhone) updates.SoDienThoai = finalPhone;
  if (finalRole != null) updates.VaiTroHoatDongID = finalRole;
  if (finalTrangThai != null) updates.TrangThai = finalTrangThai;

  if (MatKhauHash) {
    updates.MatKhauHash = MatKhauHash;
  } else if (password) {
    updates.MatKhauHash = crypto
      .createHash("md5")
      .update(String(password))
      .digest("hex");
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "Không có trường nào để cập nhật" });
  }

  try {
    await User.updateNguoiDung(id, updates);
    const [rows] = await User.getById(id);
    if (!rows || rows.length === 0)
      return res.status(404).json({ error: "Not found after update" });
    res.json(mapUser(rows[0]));
  } catch (err) {
    console.error('[UserController] updateUser error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

exports.deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    await User.deleteNguoiDung(id);
    res.status(204).send();
  } catch (err) {
    console.error('[UserController] deleteUser error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
};

/**
 * Nâng cấp role của user - chỉ cho phép user tự đổi role mình từ Khách hàng (1) → Chủ dự án (3)
 * PUT /api/users/:id/upgrade-role
 */
exports.upgradeRole = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { targetRole } = req.body;

  // Validate targetRole
  if (targetRole !== 3 && targetRole !== 'ChuDuAn' && targetRole !== 'Chủ dự án') {
    return res.status(400).json({ 
      success: false, 
      message: 'Chỉ cho phép nâng cấp lên vai trò Chủ dự án (role 3)' 
    });
  }

  // Kiểm tra user được phép đổi chính mình
  const authUserId = req.user?.id;
  if (!authUserId) {
    return res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
  }

  if (authUserId !== id) {
    return res.status(403).json({ 
      success: false, 
      message: 'Bạn chỉ có thể nâng cấp vai trò của chính mình' 
    });
  }

  try {
    // Lấy thông tin user hiện tại
    const [rows] = await User.getById(id);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const currentUser = rows[0];
    const currentRoleId = currentUser.VaiTroHoatDongID || currentUser.VaiTroID;

    // Chỉ cho phép từ role 1 (Khách hàng) → role 3 (Chủ dự án)
    if (currentRoleId !== 1) {
      return res.status(400).json({ 
        success: false, 
        message: `Bạn hiện tại có vai trò ID ${currentRoleId}. Chỉ Khách hàng (role 1) mới có thể nâng cấp lên Chủ dự án.` 
      });
    }

    // Cập nhật role lên 3 (Chủ dự án)
    await User.updateNguoiDung(id, { VaiTroHoatDongID: 3 });

    // Lấy lại user sau khi update
    const [updatedRows] = await User.getById(id);
    const updatedUser = updatedRows[0];

    res.json({
      success: true,
      message: 'Đã nâng cấp thành Chủ dự án',
      data: {
        NguoiDungID: updatedUser.NguoiDungID,
        TenDayDu: updatedUser.TenDayDu,
        Email: updatedUser.Email,
        SoDienThoai: updatedUser.SoDienThoai,
        VaiTroHoatDongID: updatedUser.VaiTroHoatDongID,
        TrangThai: updatedUser.TrangThai
      }
    });
  } catch (err) {
    console.error('[UserController] upgradeRole error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};
