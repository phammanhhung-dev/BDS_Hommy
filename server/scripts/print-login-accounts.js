'use strict';

/**
 * In danh sách tài khoản đăng nhập theo vai trò từ database.
 * Vai trò lấy: ChuDuAn, NhanVienBanHang, NhanVienDieuHanh
 *
 * Cách chạy:
 *   node server/scripts/print-login-accounts.js
 *   npm run accounts
 */

const db = require('../config/db'); // pool.promise()

async function fetchAccounts() {
	const roles = ['ChuDuAn', 'NhanVienBanHang', 'NhanVienDieuHanh'];

	const sql = `
		SELECT 
			n.NguoiDungID,
			n.TenDayDu,
			n.Email,
			v.TenVaiTro
		FROM nguoidung n
		LEFT JOIN vaitro v ON n.VaiTroHoatDongID = v.VaiTroID
		WHERE v.TenVaiTro IN (?, ?, ?)
		ORDER BY FIELD(v.TenVaiTro, 'ChuDuAn','NhanVienBanHang','NhanVienDieuHanh'), n.NguoiDungID
	`;

	const [rows] = await db.query(sql, roles);

	// Gom theo vai trò
	const grouped = roles.reduce((acc, r) => {
		acc[r] = [];
		return acc;
	}, {});

	for (const row of rows) {
		if (grouped[row.TenVaiTro]) {
			grouped[row.TenVaiTro].push({
				NguoiDungID: row.NguoiDungID,
				TenDayDu: row.TenDayDu,
				Email: row.Email
			});
		}
	}

	return grouped;
}

(async () => {
	try {
		const grouped = await fetchAccounts();

		console.log('=== Danh sách tài khoản đăng nhập (mật khẩu mặc định: 123456) ===\n');

		const printGroup = (title, list) => {
			console.log(`• ${title}:`);
			if (!list || list.length === 0) {
				console.log('   (Không tìm thấy)');
			} else {
				list.forEach((u, idx) => {
					console.log(`   ${idx + 1}. ${u.TenDayDu || '(Không tên)'} — ${u.Email} (ID: ${u.NguoiDungID})`);
				});
			}
			console.log('');
		};

		printGroup('Chủ dự án (ChuDuAn)', grouped.ChuDuAn);
		printGroup('Nhân viên bán hàng (NhanVienBanHang)', grouped.NhanVienBanHang);
		printGroup('Nhân viên điều hành (NhanVienDieuHanh)', grouped.NhanVienDieuHanh);

		// Gợi ý lệnh login nhanh qua curl
		console.log('Gợi ý kiểm tra nhanh:');
		console.log('  curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \\');
		console.log('       -d "{\\"email\\": \\"<email_trong_danh_sach>\\", \\"password\\": \\"123456\\"}"\n');

		process.exit(0);
	} catch (error) {
		console.error('Lỗi khi đọc tài khoản từ DB:', error.message);
		console.error('Kiểm tra kết nối DB trong `server/config/db.js` và dữ liệu bảng `nguoidung`, `vaitro`.');
		process.exit(1);
	}
})();






























