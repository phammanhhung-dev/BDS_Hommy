'use strict';

/**
 * XÓA 3 TÀI KHOẢN MẪU ĐÃ LỠ TẠO (nếu tồn tại)
 * - chuduan@example.com
 * - nvbanhang@example.com
 * - nvdieuhanh@example.com
 *
 * Cách chạy:
 *   node server/scripts/cleanup-seeded-accounts.js
 */

const db = require('../config/db');

(async () => {
	try {
		const emails = [
			'chuduan@example.com',
			'nvbanhang@example.com',
			'nvdieuhanh@example.com'
		];

		// Lấy các userId tương ứng
		const [rows] = await db.query(
			`SELECT NguoiDungID, Email FROM nguoidung WHERE Email IN (?, ?, ?)`,
			emails
		);
		if (!rows.length) {
			console.log('✅ Không có tài khoản mẫu nào để xóa.');
			process.exit(0);
		}

		const userIds = rows.map(r => r.NguoiDungID);

		// Xóa mapping vai trò trước
		await db.query(
			`DELETE FROM nguoidung_vaitro WHERE NguoiDungID IN (${userIds.map(() => '?').join(',')})`,
			userIds
		);

		// Xóa người dùng
		await db.query(
			`DELETE FROM nguoidung WHERE NguoiDungID IN (${userIds.map(() => '?').join(',')})`,
			userIds
		);

		console.log('🧹 Đã xóa các tài khoản:');
		rows.forEach(r => console.log(` - ${r.Email} (ID: ${r.NguoiDungID})`));
		process.exit(0);
	} catch (err) {
		console.error('❌ Lỗi cleanup:', err.message);
		process.exit(1);
	}
})();






























