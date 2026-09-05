'use strict';

/**
 * GÁN VAI TRÒ CHO NGƯỜI DÙNG ĐÃ TỒN TẠI (KHÔNG TẠO MỚI)
 * - Yêu cầu: trong bảng nguoidung đã có sẵn các tài khoản từ thue_tro.sql
 * - Cấu hình qua biến môi trường hoặc chỉnh trực tiếp dưới đây:
 *     CHUDUAN_EMAIL, NVBANHANG_EMAIL, NVDIEUHANH_EMAIL
 *
 * Cách chạy:
 *   node server/scripts/seed-min-accounts.js
 *   npm run seed:accounts
 */

const db = require('../config/db'); // pool.promise()

async function ensureRole(tenVaiTro) {
	const [rows] = await db.query('SELECT VaiTroID FROM vaitro WHERE TenVaiTro = ? LIMIT 1', [tenVaiTro]);
	if (rows.length) return rows[0].VaiTroID;

	// Lấy danh sách cột bảng vaitro để chèn linh hoạt
	const [cols] = await db.query('SHOW COLUMNS FROM vaitro');
	const colNames = cols.map(c => c.Field);

	const fields = ['TenVaiTro'];
	const values = [tenVaiTro];

	if (colNames.includes('MoTa')) {
		fields.push('MoTa');
		values.push(`Role auto-created by seed for ${tenVaiTro}`);
	}
	if (colNames.includes('TaoLuc')) {
		fields.push('TaoLuc');
		values.push(new Date());
	}
	if (colNames.includes('CapNhatLuc')) {
		fields.push('CapNhatLuc');
		values.push(new Date());
	}

	const placeholders = fields.map(() => '?').join(', ');
	const [res] = await db.query(
		`INSERT INTO vaitro (${fields.join(', ')}) VALUES (${placeholders})`,
		values
	);
	return res.insertId;
}

async function ensureExistingUserRole({ email, roleId }) {
	const [exist] = await db.query('SELECT NguoiDungID FROM nguoidung WHERE Email = ? LIMIT 1', [email]);
	if (!exist.length) {
		throw new Error(`Không tìm thấy nguoidung với Email: ${email}. Vui lòng dùng email có sẵn trong thue_tro.sql.`);
	}
	// Gán vai trò hoạt động và mapping
	const userId = exist[0].NguoiDungID;
	await db.query(`UPDATE nguoidung SET VaiTroHoatDongID = IFNULL(VaiTroHoatDongID, ?) WHERE NguoiDungID = ?`, [
		roleId,
		userId
	]);
	await db.query(
		`INSERT IGNORE INTO nguoidung_vaitro (NguoiDungID, VaiTroID) VALUES (?, ?)`,
		[userId, roleId]
	);
	return userId;
}

(async () => {
	try {
		console.log('🔧 Đang đảm bảo các vai trò tồn tại...');
		const chuDuAnId = await ensureRole('ChuDuAn');
		const nvBanHangId = await ensureRole('NhanVienBanHang');
		const nvDieuHanhId = await ensureRole('NhanVienDieuHanh');

		console.log('👤 Đang gán vai trò cho người dùng đã tồn tại...');

		// Cho phép cấu hình qua ENV, nếu không có thì dùng các giá trị placeholder để buộc lỗi nếu không tồn tại
		const emailChuDuAn = process.env.CHUDUAN_EMAIL || 'chuduan@example.com';
		const emailNVBH = process.env.NVBANHANG_EMAIL || 'nvbanhang@example.com';
		const emailNVDH = process.env.NVDIEUHANH_EMAIL || 'nvdieuhanh@example.com';

		const u1 = await ensureExistingUserRole({ email: emailChuDuAn, roleId: chuDuAnId });
		const u2 = await ensureExistingUserRole({ email: emailNVBH, roleId: nvBanHangId });
		const u3 = await ensureExistingUserRole({ email: emailNVDH, roleId: nvDieuHanhId });

		console.log('\n✅ Hoàn tất seed!');
		console.log(`   ChuDuAn          -> ${emailChuDuAn} (ID: ${u1})`);
		console.log(`   NhanVienBanHang  -> ${emailNVBH} (ID: ${u2})`);
		console.log(`   NhanVienDieuHanh -> ${emailNVDH} (ID: ${u3})`);
		process.exit(0);
	} catch (err) {
		console.error('❌ Lỗi seed:', err.message);
		process.exit(1);
	}
})();


