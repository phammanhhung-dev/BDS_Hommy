/**
 * Email Service - Gửi email cho các tác vụ hệ thống
 * Sử dụng nodemailer để gửi email
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Cấu hình transporter từ env
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection (optional)
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email Service: Không thể kết nối SMTP server:', error);
      } else {
        console.log('✅ Email Service: Sẵn sàng gửi email');
      }
    });
  }

  /**
   * Gửi email thiết lập mật khẩu cho nhân viên mới
   * @param {number} userId - ID người dùng
   * @param {string} email - Email người nhận
   * @param {string} setupToken - Token thiết lập (base64 encoded)
   * @returns {Promise<Object>}
   */
  async guiEmailThietLapMatKhau(userId, email, setupToken) {
    try {
      const setupUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/setup-password?token=${encodeURIComponent(setupToken)}`;

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Hommy BĐS'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Thiết lập mật khẩu tài khoản Nhân viên Bán hàng',
        html: this._generatePasswordSetupTemplate(setupUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('[EmailService] Email thiết lập mật khẩu đã gửi:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        email
      };
    } catch (error) {
      console.error('[EmailService] Lỗi gửi email thiết lập mật khẩu:', error);
      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }

  /**
   * Template email thiết lập mật khẩu
   * @private
   */
  _generatePasswordSetupTemplate(setupUrl) {
    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thiết lập mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #667eea;
            margin-top: 0;
            font-size: 22px;
          }
          .content p {
            margin: 16px 0;
            font-size: 16px;
          }
          .btn-container {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Chào mừng đến với Hommy BĐS</h1>
          </div>
          <div class="content">
            <h2>Thiết lập mật khẩu cho tài khoản của bạn</h2>
            <p>Xin chào,</p>
            <p>Tài khoản <strong>Nhân viên Bán hàng</strong> của bạn đã được tạo thành công. Vui lòng thiết lập mật khẩu để kích hoạt tài khoản.</p>
            
            <div class="info-box">
              <strong>⏰ Lưu ý:</strong> Link thiết lập này có hiệu lực trong <strong>24 giờ</strong>. Sau thời gian đó, bạn cần liên hệ quản trị viên để được hỗ trợ.
            </div>

            <div class="btn-container">
              <a href="${setupUrl}" class="btn">Thiết lập mật khẩu ngay</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Nếu nút bên trên không hoạt động, vui lòng sao chép và dán link sau vào trình duyệt:
            </p>
            <p style="word-break: break-all; font-size: 13px; color: #999;">
              ${setupUrl}
            </p>

            <div class="info-box" style="border-left-color: #ff9800; margin-top: 30px;">
              <strong>🔐 Bảo mật:</strong> Nếu bạn không yêu cầu email này, vui lòng bỏ qua và liên hệ ngay với quản trị viên.
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Hommy BĐS - Nền tảng bất động sản uy tín. All rights reserved.</p>
            <p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">Truy cập hệ thống</a> | 
              <a href="mailto:support@hommy.vn">Liên hệ hỗ trợ</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gửi email thông báo chung
   * @param {string} to - Email người nhận
   * @param {string} subject - Tiêu đề email
   * @param {string} htmlContent - Nội dung HTML
   * @returns {Promise<Object>}
   */
  async guiEmailThongBao(to, subject, htmlContent) {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Hommy BĐS'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('[EmailService] Email thông báo đã gửi:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        email: to
      };
    } catch (error) {
      console.error('[EmailService] Lỗi gửi email thông báo:', error);
      throw new Error(`Không thể gửi email: ${error.message}`);
    }
  }

  /**
   * Gửi email thông báo tin đăng bị từ chối
   * @param {string} email - Email chủ dự án
   * @param {string} tenChuDuAn - Tên chủ dự án
   * @param {string} tieuDe - Tiêu đề tin đăng
   * @param {string} lyDoTuChoi - Lý do từ chối
   * @returns {Promise<Object>}
   */
  async guiEmailTinDangBiTuChoi(email, tenChuDuAn, tieuDe, lyDoTuChoi) {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .reason { background: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Tin đăng không được duyệt</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${tenChuDuAn}</strong>,</p>
            <p>Tin đăng của bạn "<strong>${tieuDe}</strong>" đã không được duyệt bởi hệ thống.</p>
            <div class="reason">
              <strong>Lý do từ chối:</strong><br>
              ${lyDoTuChoi}
            </div>
            <p>Vui lòng chỉnh sửa tin đăng theo hướng dẫn và gửi duyệt lại.</p>
            <p>Nếu có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.guiEmailThongBao(email, 'Tin đăng không được duyệt', htmlContent);
  }
}

// Export singleton instance
module.exports = new EmailService();






