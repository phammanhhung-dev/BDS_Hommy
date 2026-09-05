#!/usr/bin/env node

const { syncFromDvhcvn } = require('../services/khuVucSyncService');

async function run() {
  try {
    const stats = await syncFromDvhcvn({ replace: true, verbose: false });
    console.log('✅ Đồng bộ khu vực hoàn tất.');
    console.log(`📊 Tỉnh/Thành: ${stats.provinceCount}, Quận/Huyện: ${stats.districtCount}, Xã/Phường: ${stats.wardCount}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Đồng bộ khu vực thất bại:', error.message);
    process.exit(1);
  }
}

run();
