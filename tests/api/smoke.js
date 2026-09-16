'use strict';

/**
 * Script smoke test:
 * - Đăng nhập lấy JWT
 * - Gọi các endpoint protected:
 *   - Mặc định: 3 endpoint cơ bản
 *   - Nếu SMOKE_DISCOVER_ALL=1: Quét toàn bộ GET endpoints từ server/routes và test tất cả
 *
 * Cách chạy:
 *   BASE_URL=http://localhost:5000 SMOKE_EMAIL="email" SMOKE_PASSWORD="password" npm run smoke
 * Hoặc:
 *   node server/scripts/smoke.js http://localhost:5000 email password
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

function getEmailByRole(role) {
	if (!role) return undefined;
	const normalized = String(role).trim().toUpperCase();
	switch (normalized) {
		case 'CHU_DU_AN':
			return process.env.CHUDUAN_EMAIL;
		case 'NV_BAN_HANG':
			return process.env.NVBANHANG_EMAIL;
		case 'NV_DIEU_HANH':
			return process.env.NVDIEUHANH_EMAIL;
		default:
			return undefined;
	}
}

function parseEmails(input) {
	if (!input) return undefined;
	if (Array.isArray(input)) return input.filter(Boolean);
	return String(input)
		.split(',')
		.map(s => s.trim())
		.filter(Boolean);
}

function getConfigFromEnvOrArgs() {
	const [,, argBaseUrl, argEmail, argPassword] = process.argv;

	const baseUrl = process.env.BASE_URL || argBaseUrl || 'http://localhost:5000';
	const password = process.env.SMOKE_PASSWORD || argPassword;

	let emails =
		parseEmails(process.env.SMOKE_EMAILS) ||
		parseEmails(process.env.SMOKE_EMAIL || argEmail);

	if (!emails || emails.length === 0) {
		const role = process.env.SMOKE_ROLE;
		const emailFromRole = getEmailByRole(role);
		if (emailFromRole) {
			emails = [emailFromRole];
		}
	}

	if (!emails || emails.length === 0 || !password) {
		console.error(
			'Thiếu thông tin đăng nhập.\n' +
			'Sử dụng biến môi trường: BASE_URL, SMOKE_EMAIL, SMOKE_PASSWORD\n' +
			'Hoặc: SMOKE_EMAILS="a@x.com,b@y.com" SMOKE_PASSWORD="..."\n' +
			'Hoặc: SMOKE_ROLE=CHU_DU_AN (kèm CHUDUAN_EMAIL|NVBANHANG_EMAIL|NVDIEUHANH_EMAIL) và SMOKE_PASSWORD\n' +
			'Hoặc truyền tham số: node server/scripts/smoke.js <BASE_URL> <EMAIL> <PASSWORD>'
		);
		process.exit(1);
	}

	return { baseUrl, emails, password };
}

async function login(baseUrl, email, password) {
	const url = `${baseUrl}/api/login`;
	const res = await axios.post(url, { email, password }, { timeout: 15000 });
	// Kỳ vọng response có field token
	if (!res?.data?.token) {
		throw new Error('Không nhận được token trong response đăng nhập');
	}
	return res.data.token;
}

async function getWithAuth(baseUrl, token, path) {
	const url = `${baseUrl}${path}`;
	const res = await axios.get(url, {
		timeout: 20000,
		headers: { Authorization: `Bearer ${token}` }
	});
	return { status: res.status, data: res.data };
}

function brief(value) {
	if (Array.isArray(value)) {
		return { type: 'array', length: value.length };
	}
	if (value && typeof value === 'object') {
		const keys = Object.keys(value);
		return { type: 'object', keys: keys.slice(0, 10), totalKeys: keys.length };
	}
	return { type: typeof value, value };
}

(function ensureCwdIsProjectRoot() {
	// Khi chạy từ IDE, CWD có thể không phải project root. Nếu không tìm thấy server/, cố gắng cd lên.
	try {
		if (!fs.existsSync(path.join(process.cwd(), 'server'))) {
			const upOne = path.join(process.cwd(), '..');
			if (fs.existsSync(path.join(upOne, 'server'))) {
				process.chdir(upOne);
			}
		}
	} catch (_) {}
})();

function discoverGetEndpoints() {
	const routesDir = path.join(process.cwd(), 'server', 'routes');
	if (!fs.existsSync(routesDir)) return [];

	// Map file -> base path như trong server/index.js
	const baseMounts = {
		'userRoutes.js': '/api/users',
		'authRoutes.js': '/api',
		'chuDuAnRoutes.js': '/api/chu-du-an',
		'chinhSachCocRoutes.js': '/api/chu-du-an/chinh-sach-coc',
		'operatorRoutes.js': '/api/operator',
		'geocodingRoutes.js': '/api/geocode',
		'chatRoutes.js': '/api/chat',
		'tinDangOperatorRoutes.js': '/api/operator/tin-dang',
		'duAnOperatorRoutes.js': '/api/operator/du-an',
		'lichLamViecOperatorRoutes.js': '/api/operator/lich-lam-viec',
		'cuocHenOperatorRoutes.js': '/api/operator/cuoc-hen',
		'hoSoNhanVienRoutes.js': '/api/operator/nhan-vien',
		'bienBanBanGiaoRoutes.js': '/api/operator/bien-ban',
		'dashboardOperatorRoutes.js': '/api/operator/dashboard',
		'nhanVienBanHangRoutes.js': '/api/nhan-vien-ban-hang',
		'tinDangRoutes.js': '/api/tindangs',
		'khuVucRoutes.js': '/api/khuvucs',
		'yeuThichRoutes.js': '/api/yeuthich',
		'sepayRoutes.js': '/api/sepay',
		'sepayCallbackRoutes.js': '/api/sepay',
		'transactionRoutes.js': '/api/transactions'
	};

	const endpoints = [];
	const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
	for (const file of files) {
		const base = baseMounts[file];
		if (!base) continue;
		const full = path.join(routesDir, file);
		let content = '';
		try {
			content = fs.readFileSync(full, 'utf8');
		} catch {
			continue;
		}
		// Tìm tất cả router.get('...') hoặc router.get("...") hoặc router.get(`/...`)
		const getRegex = /router\.get\(\s*([`'"])(\/[^`'"]*)\1/g;
		let match;
		while ((match = getRegex.exec(content)) !== null) {
			const sub = match[2];
			// Chuẩn hóa double slashes
			const url = `${base}${sub}`.replace(/\/{2,}/g, '/');
			endpoints.push({ name: `${file}:${sub}`, path: url });
		}
		// Ngoài ra: app.get('/', ...) trong index.js (root) đã có, bỏ qua
	}
	// Loại trùng
	const dedup = [];
	const seen = new Set();
	for (const ep of endpoints) {
		if (seen.has(ep.path)) continue;
		seen.add(ep.path);
		dedup.push(ep);
	}
	return dedup;
}

(async () => {
	const startedAt = Date.now();
	const { baseUrl, emails, password } = getConfigFromEnvOrArgs();

	const report = {
		baseUrl,
		emails,
		steps: []
	};

	try {
		const endpoints =
			process.env.SMOKE_DISCOVER_ALL === '1'
				? discoverGetEndpoints()
				: [
						{ name: 'chu-du-an/dashboard', path: '/api/chu-du-an/dashboard' },
						{ name: 'chu-du-an/tin-dang', path: '/api/chu-du-an/tin-dang' },
						{ name: 'chat/conversations', path: '/api/chat/conversations' }
				  ];

		report.results = [];

		for (const email of emails) {
			const perUser = { email, steps: [] };
			report.results.push(perUser);

			perUser.steps.push({ step: 'login', status: 'running' });
			let token;
			try {
				token = await login(baseUrl, email, password);
				perUser.tokenPreview = `${token.substring(0, 12)}...`;
				perUser.steps[perUser.steps.length - 1] = { step: 'login', status: 'ok' };
			} catch (e) {
				perUser.login = {
					error: true,
					message: e?.response?.data || e.message,
					status: e?.response?.status
				};
				perUser.steps[perUser.steps.length - 1] = { step: 'login', status: 'fail' };
				continue;
			}

			for (const ep of endpoints) {
				perUser.steps.push({ step: ep.name, status: 'running' });
				try {
					const { status, data } = await getWithAuth(baseUrl, token, ep.path);
					perUser[ep.name] = { status, preview: brief(data) };
					perUser.steps[perUser.steps.length - 1] = { step: ep.name, status: 'ok' };
				} catch (e) {
					perUser[ep.name] = {
						error: true,
						message: e?.response?.data || e.message,
						status: e?.response?.status
					};
					perUser.steps[perUser.steps.length - 1] = { step: ep.name, status: 'fail' };
				}
			}
		}

		report.durationMs = Date.now() - startedAt;
		console.log(JSON.stringify(report, null, 2));
		process.exit(0);
	} catch (error) {
		report.error = true;
		report.message = error?.response?.data || error.message;
		report.durationMs = Date.now() - startedAt;
		console.error(JSON.stringify(report, null, 2));
		process.exit(1);
	}
})();




