const KycService = require('../services/KycService');
const path = require('path');

// Helper: Chuyển absolute path thành relative path để lưu vào DB
const toRelativePath = (absolutePath) => {
  if (!absolutePath) return null;
  // Chuẩn hóa path separator thành forward slash cho URL
  const relativePath = path.relative(path.join(__dirname, '..'), absolutePath);
  return relativePath.replace(/\\/g, '/');
};

class KycController {
  static async xacThucKYC(req, res) {
    try {
      console.log('📝 [KYC] Request body:', req.body);
      console.log('📁 [KYC] Files:', req.files);
      
      const { 
        soCCCD, tenDayDu, ngaySinh, diaChi, ngayCapCCCD, 
        faceSimilarity, trangThaiKYC 
      } = req.body;
      
      const userId = req.user.id; // Assuming auth middleware adds user to req
      console.log('👤 [KYC] User ID:', userId);
      
      // Validation: Kiểm tra các trường bắt buộc
      if (!soCCCD || !tenDayDu || !faceSimilarity) {
        return res.status(400).json({ 
          message: 'Thiếu thông tin bắt buộc: Số CCCD, Họ tên, Độ tương đồng' 
        });
      }
      
      // Get file paths (absolute từ multer)
      const cccdFrontAbs = req.files['cccdFront'] ? req.files['cccdFront'][0].path : null;
      const cccdBackAbs = req.files['cccdBack'] ? req.files['cccdBack'][0].path : null;
      const selfieAbs = req.files['selfie'] ? req.files['selfie'][0].path : null;

      if (!cccdFrontAbs || !cccdBackAbs || !selfieAbs) {
        return res.status(400).json({ message: 'Thiếu ảnh xác thực' });
      }
      
      // Chuyển sang relative path để lưu vào DB
      const cccdFront = toRelativePath(cccdFrontAbs);
      const cccdBack = toRelativePath(cccdBackAbs);
      const selfie = toRelativePath(selfieAbs);
      
      console.log('🖼️ [KYC] Image paths (relative):', { cccdFront, cccdBack, selfie });

      // Sử dụng trạng thái KYC từ frontend (đã tính toán dựa trên logic mới)
      // Logic frontend:
      // - ThanhCong: soCCCD = 100% VÀ tenDayDu = 100% VÀ faceSim > 50%
      // - ThatBai: soCCCD < 100% VÀ tenDayDu < 100% VÀ faceSim <= 50%
      // - CanXemLai: (soCCCD = 100% VÀ tenDayDu = 100%) HOẶC faceSim > 50%
      const trangThai = trangThaiKYC || 'CanXemLai';
      const similarity = parseFloat(faceSimilarity);
      
      // Xác định lý do nếu thất bại
      let lyDo = null;
      if (trangThai === 'ThatBai') {
        lyDo = 'Độ khớp thông tin và khuôn mặt không đạt yêu cầu';
      }

      console.log('📊 [KYC] Trạng thái từ frontend:', trangThaiKYC, '-> Sử dụng:', trangThai);

      const kycData = {
        NguoiDungID: userId,
        SoCCCD: soCCCD || null,
        TenDayDu: tenDayDu || null,
        NgaySinh: ngaySinh || null,
        DiaChi: diaChi || null,
        NgayCapCCCD: ngayCapCCCD || null,
        FaceSimilarity: similarity || null,
        TrangThai: trangThai,
        LyDoThatBai: lyDo,
        AnhCCCDMatTruoc: cccdFront,
        AnhCCCDMatSau: cccdBack,
        AnhSelfie: selfie
      };

      console.log('💾 [KYC] Data to save:', kycData);
      const kycId = await KycService.createVerification(kycData);
      console.log('✅ [KYC] Saved with ID:', kycId);

      res.status(200).json({ 
        message: 'Gửi yêu cầu xác thực thành công', 
        kycId,
        trangThai 
      });

    } catch (error) {
      console.error('KYC Error:', error);
      res.status(500).json({ message: 'Lỗi server khi xử lý KYC' });
    }
  }

  static async getLichSu(req, res) {
    try {
      const userId = req.user.id;
      const history = await KycService.getHistory(userId);
      res.status(200).json(history);
    } catch (error) {
      console.error('KYC History Error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy lịch sử KYC' });
    }
  }
}

module.exports = KycController;
