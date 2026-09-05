const db = require('./config/db');

async function executeMigrationStep2a() {
  try {
    console.log('=== BƯỚC 2A - XỬ LÝ DỮ LIỆU MỒ CÔI VÀ MIGRATION FK ===\n');

    // BƯỚC 1: KIỂM TRA VÀ XÓA DỮ LIỆU MỒ CÔI
    console.log('--- BƯỚC 1: KIỂM TRA VÀ XÓA DỮ LIỆU MỒ CÔI ---\n');

    // 1.1. Kiểm tra coc liên kết đến hopdong sắp bị xóa
    console.log('1.1. Kiểm tra coc liên kết đến hopdong với TinDangID trong (4, 5, 6, 8, 9)');
    const [cocToCheck] = await db.execute(`
      SELECT c.CocID, c.HopDongID, c.Loai, c.TrangThai
      FROM coc c
      INNER JOIN hopdong hd ON c.HopDongID = hd.HopDongID
      WHERE hd.TinDangID IN (4, 5, 6, 8, 9)
    `);
    console.log(`   Số bản ghi coc liên quan: ${cocToCheck.length}`);
    if (cocToCheck.length > 0) {
      console.log('   Chi tiết:', cocToCheck);
      
      // Xóa coc trước nếu có
      console.log('   Đang xóa các bản ghi coc liên quan...');
      const [deleteCocResult] = await db.execute(`
        DELETE c FROM coc c
        INNER JOIN hopdong hd ON c.HopDongID = hd.HopDongID
        WHERE hd.TinDangID IN (4, 5, 6, 8, 9)
      `);
      console.log(`   Đã xóa ${deleteCocResult.affectedRows} bản ghi coc`);
    } else {
      console.log('   Không có bản ghi coc nào liên quan');
    }

    // 1.2. Xóa cuochen mồ côi
    console.log('\n1.2. Xóa cuochen mồ côi (TinDangID IN (4, 5, 6, 8, 9))');
    const [deleteCuocHenResult] = await db.execute(`
      DELETE FROM cuochen WHERE TinDangID IN (4, 5, 6, 8, 9)
    `);
    console.log(`   Đã xóa ${deleteCuocHenResult.affectedRows} bản ghi cuochen`);

    // 1.3. Xóa yeuthich mồ côi
    console.log('\n1.3. Xóa yeuthich mồ côi (TinDangID IN (4, 5, 6, 8, 9))');
    const [deleteYeuThichResult] = await db.execute(`
      DELETE FROM yeuthich WHERE TinDangID IN (4, 5, 6, 8, 9)
    `);
    console.log(`   Đã xóa ${deleteYeuThichResult.affectedRows} bản ghi yeuthich`);

    // 1.4. Xóa hopdong mồ côi
    console.log('\n1.4. Xóa hopdong mồ côi (TinDangID IN (4, 5, 6, 8, 9))');
    const [deleteHopDongResult] = await db.execute(`
      DELETE FROM hopdong WHERE TinDangID IN (4, 5, 6, 8, 9)
    `);
    console.log(`   Đã xóa ${deleteHopDongResult.affectedRows} bản ghi hopdong`);

    console.log('\n--- BƯỚC 1 HOÀN TẤT ---\n');

    // BƯỚC 2: CHẠY MIGRATION SQL BỔ SUNG FK
    console.log('--- BƯỚC 2: CHẠY MIGRATION SQL BỔ SUNG FK ---\n');

    const migrations = [
      {
        name: 'FK phong.DuAnID → duan.DuAnID',
        sql: `ALTER TABLE phong 
              ADD CONSTRAINT fk_phong_duan 
              FOREIGN KEY (DuAnID) REFERENCES duan(DuAnID) 
              ON DELETE RESTRICT ON UPDATE CASCADE`
      },
      {
        name: 'FK tindang.DuAnID → duan.DuAnID',
        sql: `ALTER TABLE tindang
              ADD CONSTRAINT fk_tindang_duan
              FOREIGN KEY (DuAnID) REFERENCES duan(DuAnID)
              ON DELETE SET NULL ON UPDATE CASCADE`
      },
      {
        name: 'FK cuochen.TinDangID → tindang.TinDangID',
        sql: `ALTER TABLE cuochen
              ADD CONSTRAINT fk_cuochen_tindang
              FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID)
              ON DELETE CASCADE ON UPDATE CASCADE`
      },
      {
        name: 'FK hopdong.TinDangID → tindang.TinDangID',
        sql: `ALTER TABLE hopdong
              ADD CONSTRAINT fk_hopdong_tindang
              FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID)
              ON DELETE SET NULL ON UPDATE CASCADE`
      },
      {
        name: 'FK coc.HopDongID → hopdong.HopDongID',
        sql: `ALTER TABLE coc
              ADD CONSTRAINT fk_coc_hopdong
              FOREIGN KEY (HopDongID) REFERENCES hopdong(HopDongID)
              ON DELETE SET NULL ON UPDATE CASCADE`
      },
      {
        name: 'FK yeuthich.TinDangID → tindang.TinDangID',
        sql: `ALTER TABLE yeuthich
              ADD CONSTRAINT fk_yeuthich_tindang
              FOREIGN KEY (TinDangID) REFERENCES tindang(TinDangID)
              ON DELETE CASCADE ON UPDATE CASCADE`
      },
      {
        name: 'FK giaodich.TinDangLienQuanID → tindang.TinDangID',
        sql: `ALTER TABLE giaodich
              ADD CONSTRAINT fk_giaodich_tindang
              FOREIGN KEY (TinDangLienQuanID) REFERENCES tindang(TinDangID)
              ON DELETE SET NULL ON UPDATE CASCADE`
      }
    ];

    for (const migration of migrations) {
      try {
        console.log(`Đang chạy: ${migration.name}`);
        await db.execute(migration.sql);
        console.log(`✅ Thành công: ${migration.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_CANNOT_ADD_FOREIGN' || error.code === 'ER_CANT_CREATE_TABLE') {
          console.log(`⚠️  Bỏ qua (có thể đã tồn tại): ${migration.name} - ${error.message}`);
        } else {
          console.log(`❌ Lỗi: ${migration.name} - ${error.message}`);
          throw error;
        }
      }
    }

    console.log('\n--- BƯỚC 2 HOÀN TẤT ---\n');

    // BƯỚC 3: VERIFY MIGRATION
    console.log('--- BƯỚC 3: VERIFY MIGRATION ---\n');

    const tablesToCheck = ['phong', 'tindang', 'cuochen', 'hopdong', 'coc', 'yeuthich', 'giaodich'];
    
    for (const tableName of tablesToCheck) {
      console.log(`3.${tablesToCheck.indexOf(tableName) + 1}. SHOW CREATE TABLE ${tableName}`);
      const [createTableResult] = await db.execute(`SHOW CREATE TABLE ${tableName}`);
      console.log(`   Kết quả:\n${createTableResult[0]['Create Table']}\n`);
    }

    console.log('--- KIỂM TRA LẠI DỮ LIỆU MỒ CÔI SAU MIGRATION ---\n');

    // 3.1. Kiểm tra phong.DuAnID
    console.log('3.1. Kiểm tra phong.DuAnID → duan.DuAnID');
    const [checkPhong] = await db.execute(`
      SELECT COUNT(*) as count
      FROM phong p
      LEFT JOIN duan d ON p.DuAnID = d.DuAnID
      WHERE d.DuAnID IS NULL AND p.DuAnID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkPhong[0].count}`);

    // 3.2. Kiểm tra tindang.DuAnID
    console.log('\n3.2. Kiểm tra tindang.DuAnID → duan.DuAnID');
    const [checkTinDang] = await db.execute(`
      SELECT COUNT(*) as count
      FROM tindang td
      LEFT JOIN duan d ON td.DuAnID = d.DuAnID
      WHERE d.DuAnID IS NULL AND td.DuAnID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkTinDang[0].count}`);

    // 3.3. Kiểm tra cuochen.TinDangID
    console.log('\n3.3. Kiểm tra cuochen.TinDangID → tindang.TinDangID');
    const [checkCuocHen] = await db.execute(`
      SELECT COUNT(*) as count
      FROM cuochen ch
      LEFT JOIN tindang td ON ch.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkCuocHen[0].count}`);

    // 3.4. Kiểm tra hopdong.TinDangID
    console.log('\n3.4. Kiểm tra hopdong.TinDangID → tindang.TinDangID');
    const [checkHopDong] = await db.execute(`
      SELECT COUNT(*) as count
      FROM hopdong hd
      LEFT JOIN tindang td ON hd.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL AND hd.TinDangID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkHopDong[0].count}`);

    // 3.5. Kiểm tra coc.HopDongID
    console.log('\n3.5. Kiểm tra coc.HopDongID → hopdong.HopDongID');
    const [checkCoc] = await db.execute(`
      SELECT COUNT(*) as count
      FROM coc c
      LEFT JOIN hopdong hd ON c.HopDongID = hd.HopDongID
      WHERE hd.HopDongID IS NULL AND c.HopDongID IS NOT NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkCoc[0].count}`);

    // 3.6. Kiểm tra yeuthich.TinDangID
    console.log('\n3.6. Kiểm tra yeuthich.TinDangID → tindang.TinDangID');
    const [checkYeuThich] = await db.execute(`
      SELECT COUNT(*) as count
      FROM yeuthich yt
      LEFT JOIN tindang td ON yt.TinDangID = td.TinDangID
      WHERE td.TinDangID IS NULL
    `);
    console.log(`   Số bản ghi mồ côi: ${checkYeuThich[0].count}`);

    console.log('\n--- BƯỚC 3 HOÀN TẤT ---\n');

    // BƯỚC 4: TẠO DỮ LIỆU MẪU TINDANG
    console.log('--- BƯỚC 4: TẠO DỮ LIỆU MẪU TINDANG ---\n');

    // 4.1. Lấy 1 dự án có sẵn CÓ PHÒNG để gán tin đăng
    console.log('4.1. Lấy dự án có sẵn có phòng để gán tin đăng');
    let duAnID;
    let phongSample;

    const [duAnWithPhong] = await db.execute(`
      SELECT d.DuAnID, d.TenDuAn, COUNT(p.PhongID) as SoPhong
      FROM duan d
      INNER JOIN phong p ON d.DuAnID = p.DuAnID
      WHERE d.TrangThai = 'HoatDong'
      GROUP BY d.DuAnID, d.TenDuAn
      HAVING SoPhong > 0
      LIMIT 1
    `);

    if (duAnWithPhong.length > 0) {
      duAnID = duAnWithPhong[0].DuAnID;
      console.log(`   Sử dụng dự án: ${duAnWithPhong[0].TenDuAn} (ID: ${duAnID}) với ${duAnWithPhong[0].SoPhong} phòng`);
      
      const [phongs] = await db.execute(`
        SELECT PhongID, TenPhong FROM phong WHERE DuAnID = ? LIMIT 3
      `, [duAnID]);
      phongSample = phongs;
    } else {
      console.log('   ❌ Không tìm thấy dự án nào đang hoạt động có phòng');
      console.log('   Đang lấy dự án bất kỳ có phòng...');
      
      const [anyDuAn] = await db.execute(`
        SELECT d.DuAnID, d.TenDuAn, COUNT(p.PhongID) as SoPhong
        FROM duan d
        INNER JOIN phong p ON d.DuAnID = p.DuAnID
        GROUP BY d.DuAnID, d.TenDuAn
        HAVING SoPhong > 0
        LIMIT 1
      `);
      
      if (anyDuAn.length > 0) {
        duAnID = anyDuAn[0].DuAnID;
        console.log(`   Sử dụng dự án: ${anyDuAn[0].TenDuAn} (ID: ${duAnID})`);
        
        const [phongs] = await db.execute(`
          SELECT PhongID, TenPhong FROM phong WHERE DuAnID = ? LIMIT 3
        `, [duAnID]);
        phongSample = phongs;
      } else {
        console.log('   ❌ Không tìm thấy dự án nào có phòng. Sẽ tạo phòng mẫu...');
        
        // Lấy dự án đầu tiên để tạo phòng
        const [firstDuAn] = await db.execute(`
          SELECT DuAnID, TenDuAn FROM duan LIMIT 1
        `);
        
        if (firstDuAn.length === 0) {
          console.log('   ❌ Không tìm thấy dự án nào cả');
          process.exit(1);
        }
        
        duAnID = firstDuAn[0].DuAnID;
        console.log(`   Đang tạo 3 phòng mẫu cho dự án ${duAnID} (${firstDuAn[0].TenDuAn})...`);
        
        const samplePhongs = [
          { TenPhong: '101', GiaChuan: 3000000, DienTichChuan: 25, TrangThai: 'Trong' },
          { TenPhong: '102', GiaChuan: 3500000, DienTichChuan: 30, TrangThai: 'Trong' },
          { TenPhong: '103', GiaChuan: 4000000, DienTichChuan: 35, TrangThai: 'Trong' }
        ];
        
        phongSample = [];
        for (const phong of samplePhongs) {
          const [insertPhong] = await db.execute(`
            INSERT INTO phong (DuAnID, TenPhong, TrangThai, GiaChuan, DienTichChuan, TaoLuc, CapNhatLuc)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `, [duAnID, phong.TenPhong, phong.TrangThai, phong.GiaChuan, phong.DienTichChuan]);
          phongSample.push({ PhongID: insertPhong.insertId, TenPhong: phong.TenPhong });
          console.log(`   ✅ Đã tạo phòng ${phong.TenPhong} (ID: ${insertPhong.insertId})`);
        }
      }
    }

    console.log('   Phòng sẽ sử dụng:', phongSample);

    // 4.3. Tạo tin đăng mẫu
    console.log('\n4.3. Tạo tin đăng mẫu');
    const sampleTinDangs = [
      {
        TieuDe: 'Phòng trọ giá rẻ cho sinh viên, gần trường đại học',
        MoTa: 'Phòng trọ mới, sạch sẽ, đầy đủ nội thất. Gần trường đại học, chợ, siêu thị. An ninh tốt.',
        TrangThai: 'DaDang',
        GiaDien: 3500,
        GiaNuoc: 20000,
        GiaDichVu: 150000
      },
      {
        TieuDe: 'Phòng trọ cao cấp, đầy đủ tiện nghi',
        MoTa: 'Phòng trọ cao cấp với đầy đủ tiện nghi: điều hòa, nóng lạnh, wifi miễn phí. View đẹp, yên tĩnh.',
        TrangThai: 'DaDang',
        GiaDien: 4000,
        GiaNuoc: 25000,
        GiaDichVu: 200000
      },
      {
        TieuDe: 'Phòng trọ cho nữ thuê, an ninh tuyệt đối',
        MoTa: 'Khu trọ dành riêng cho nữ, an ninh 24/7. Sạch sẽ, rộng rãi, gần trung tâm thương mại.',
        TrangThai: 'ChoDuyet',
        GiaDien: 3500,
        GiaNuoc: 20000,
        GiaDichVu: 150000
      }
    ];

    const createdTinDangIDs = [];

    for (const tinDang of sampleTinDangs) {
      const [insertResult] = await db.execute(`
        INSERT INTO tindang (TieuDe, MoTa, TrangThai, GiaDien, GiaNuoc, GiaDichVu, DuAnID, TaoLuc, CapNhatLuc)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [tinDang.TieuDe, tinDang.MoTa, tinDang.TrangThai, tinDang.GiaDien, tinDang.GiaNuoc, tinDang.GiaDichVu, duAnID]);
      
      console.log(`   ✅ Đã tạo tin đăng ID: ${insertResult.insertId} - ${tinDang.TieuDe}`);
      createdTinDangIDs.push(insertResult.insertId);

      // 4.4. Gán phòng vào tin đăng (phong_tindang)
      if (phongSample.length > 0) {
        const phongID = phongSample[Math.floor(Math.random() * phongSample.length)].PhongID;
        await db.execute(`
          INSERT INTO phong_tindang (PhongID, TinDangID, ThuTuHienThi, TaoLuc)
          VALUES (?, ?, 0, NOW())
        `, [phongID, insertResult.insertId]);
        console.log(`   ✅ Đã gán phòng ${phongID} vào tin đăng ${insertResult.insertId}`);
      }
    }

    console.log('\n--- BƯỚC 4 HOÀN TẤT ---\n');

    // 4.5. Kiểm tra lại tin đăng sau khi tạo
    console.log('--- KIỂM TRA TIN ĐĂNG SAU KHI TẠO ---\n');
    const [checkTinDangAfter] = await db.execute(`
      SELECT TinDangID, TieuDe, TrangThai, DuAnID 
      FROM tindang 
      ORDER BY TinDangID DESC LIMIT 5
    `);
    console.log('   Tin đăng mới nhất:', checkTinDangAfter);

    console.log('\n=== BƯỚC 2A HOÀN TẤT THÀNH CÔNG ===');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình migration:', error);
    process.exit(1);
  }
}

executeMigrationStep2a();