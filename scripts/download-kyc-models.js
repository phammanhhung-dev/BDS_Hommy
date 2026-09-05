const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '../client/public/models');
const tessDir = path.join(__dirname, '../client/public/tessdata');

// ✅ FIX: Sử dụng models từ nguồn chính thức face-api.js (justadudewhohacks)
// Sử dụng jsdelivr CDN với format đúng cho face-api.js 0.22.2
const filesToDownload = [
  // SSD Mobilenet V1 (Expected size: ~5.4 MB)
  // Sử dụng jsdelivr với GitHub - đảm bảo tải đầy đủ
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/ssd_mobilenetv1_model-weights_manifest.json',
    dest: path.join(modelsDir, 'ssd_mobilenetv1_model-weights_manifest.json')
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/ssd_mobilenetv1_model-shard1',
    dest: path.join(modelsDir, 'ssd_mobilenetv1_model-shard1'),
    expectedSize: 5400000 // ~5.4 MB
  },
  // Face Landmark 68 (Expected size: ~350 KB)
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-weights_manifest.json',
    dest: path.join(modelsDir, 'face_landmark_68_model-weights_manifest.json')
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-shard1',
    dest: path.join(modelsDir, 'face_landmark_68_model-shard1'),
    expectedSize: 350000 // ~350 KB
  },
  // Face Recognition (Expected size: ~6.2 MB)
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-weights_manifest.json',
    dest: path.join(modelsDir, 'face_recognition_model-weights_manifest.json')
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard1',
    dest: path.join(modelsDir, 'face_recognition_model-shard1'),
    expectedSize: 6200000 // ~6.2 MB
  },
  // Tiny Face Detector (Expected size: ~190 KB)
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-weights_manifest.json',
    dest: path.join(modelsDir, 'tiny_face_detector_model-weights_manifest.json')
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/tiny_face_detector_model-shard1',
    dest: path.join(modelsDir, 'tiny_face_detector_model-shard1'),
    expectedSize: 190000 // ~190 KB
  },
  // Tesseract Data (Expected size: ~11.2 MB)
  {
    url: 'https://github.com/naptha/tessdata/raw/gh-pages/4.0.0/vie.traineddata.gz',
    dest: path.join(tessDir, 'vie.traineddata.gz'),
    expectedSize: 11200000 // ~11.2 MB
  }
];

const downloadFile = (url, dest, expectedSize) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let downloadedBytes = 0;

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    }, (response) => {
      // Follow redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlink(dest, () => { });
        downloadFile(response.headers.location, dest, expectedSize).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => { });
        reject(new Error(`Failed to download ${url}: Status Code ${response.statusCode}`));
        return;
      }

      // Track download progress
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (contentLength > 0) {
          const percent = ((downloadedBytes / contentLength) * 100).toFixed(1);
          process.stdout.write(`\r   Downloading ${path.basename(dest)}: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(2)} MB)`);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          process.stdout.write('\r'); // Clear progress line
          const stats = fs.statSync(dest);
          const fileSizeKB = (stats.size / 1024).toFixed(2);
          const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

          // Validate file size if expected size is provided
          if (expectedSize && stats.size < expectedSize * 0.9) { // Allow 10% tolerance
            console.log(`⚠️  Warning: ${path.basename(dest)} might be incomplete (${fileSizeMB} MB)`);
            console.log(`   Expected: ~${(expectedSize / 1024 / 1024).toFixed(2)} MB, Got: ${fileSizeMB} MB`);
            console.log(`   ⚠️  File may be truncated. Try downloading manually or check network connection.`);
          } else {
            console.log(`✅ Downloaded: ${path.basename(dest)} (${fileSizeMB} MB)`);
          }

          resolve();
        });
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => { });
      reject(err);
    });
  });
};

const main = async () => {
  console.log('🚀 Starting re-download of KYC model files...');
  console.log('📦 Source: face-api.js@0.22.2 (official - justadudewhohacks)');
  console.log('');

  // Tạo thư mục nếu chưa có
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log(`📁 Created directory: ${modelsDir}`);
  }
  if (!fs.existsSync(tessDir)) {
    fs.mkdirSync(tessDir, { recursive: true });
    console.log(`📁 Created directory: ${tessDir}`);
  }

  // Xóa TẤT CẢ các file models cũ để tránh conflict
  console.log('🗑️  Cleaning up old/corrupted model files...');
  const allOldFiles = [
    // Old format files
    path.join(modelsDir, 'ssd_mobilenetv1_model.bin'),
    path.join(modelsDir, 'face_landmark_68_model.bin'),
    path.join(modelsDir, 'face_recognition_model.bin'),
    path.join(modelsDir, 'tiny_face_detector_model.bin'),
    // Shard files (có thể bị corrupt)
    path.join(modelsDir, 'ssd_mobilenetv1_model-shard1'),
    path.join(modelsDir, 'face_recognition_model-shard1'),
    path.join(modelsDir, 'face_landmark_68_model-shard1'),
    path.join(modelsDir, 'tiny_face_detector_model-shard1'),
    // Manifest files
    path.join(modelsDir, 'ssd_mobilenetv1_model-weights_manifest.json'),
    path.join(modelsDir, 'face_landmark_68_model-weights_manifest.json'),
    path.join(modelsDir, 'face_recognition_model-weights_manifest.json'),
    path.join(modelsDir, 'tiny_face_detector_model-weights_manifest.json')
  ];

  let deletedCount = 0;
  for (const file of allOldFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`   ✅ Deleted: ${path.basename(file)}`);
      deletedCount++;
    }
  }
  if (deletedCount === 0) {
    console.log('   ℹ️  No old files found');
  }
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToDownload) {
    try {
      await downloadFile(file.url, file.dest, file.expectedSize);
      successCount++;
    } catch (error) {
      console.error(`❌ Error downloading ${path.basename(file.dest)}:`, error.message);
      errorCount++;
    }
  }

  console.log('');
  console.log('✨ Download Summary:');
  console.log(`   ✅ Success: ${successCount}/${filesToDownload.length}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Restart dev servers (client & server)');
  console.log('   2. Navigate to /xac-thuc-kyc');
  console.log('   3. Check browser console for model loading status');
};

main();
