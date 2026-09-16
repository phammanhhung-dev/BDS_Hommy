const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs');
const axios = require('axios');
const LichSuViModel = require('../models/lichSuViModel');

// -------------------------------------------------------------
// Cấu hình VNPAY Sandbox (Dummy credentials)
// -------------------------------------------------------------
const vnp_TmnCode = process.env.VNP_TMNCODE || 'DUMMY_TMN';
const vnp_HashSecret = process.env.VNP_HASHSECRET || 'DUMMY_SECRET_XYZ123';
const vnp_Url = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const vnp_ReturnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5173/thanh-toan/ket-qua';

// -------------------------------------------------------------
// Cấu hình MoMo Sandbox (Dummy credentials)
// -------------------------------------------------------------
const momo_partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMOBKUN20180529';
const momo_accessKey = process.env.MOMO_ACCESS_KEY || 'klm05TvNBzhg7h7j';
const momo_secretKey = process.env.MOMO_SECRET_KEY || 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa';
const momo_env = process.env.MOMO_ENV || 'https://test-payment.momo.vn/v2/gateway/api/create';
const momo_returnUrl = process.env.MOMO_RETURN_URL || 'http://localhost:5173/thanh-toan/ket-qua';
const momo_ipnUrl = process.env.MOMO_IPN_URL || 'https://477e-2402-800-6101-2a6c-482f-870a-fc34-ecdf.ngrok-free.app/api/payment/momo/ipn'; // Cần domain HTTPS thực tế hoặc ngrok để nhận IPN

class PaymentController {
  
  // ==========================================
  // VNPAY INTEGRATION
  // ==========================================
  
  static async createVnPay(req, res) {
    try {
      const { amount, orderId, orderInfo } = req.body;
      
      let date = new Date();
      let createDate = moment(date).format('YYYYMMDDHHmmss');
      
      // Default info
      let ipAddr = req.headers['x-forwarded-for'] || 
          req.connection.remoteAddress || 
          req.socket.remoteAddress || 
          req.connection.socket.remoteAddress || '127.0.0.1';

      let vnp_Params = {};
      vnp_Params['vnp_Version'] = '2.1.0';
      vnp_Params['vnp_Command'] = 'pay';
      vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
      vnp_Params['vnp_Locale'] = 'vn';
      vnp_Params['vnp_CurrCode'] = 'VND';
      vnp_Params['vnp_TxnRef'] = orderId; // Mã giao dịch của LichSuVi
      vnp_Params['vnp_OrderInfo'] = orderInfo || 'Thanh toan don hang ' + orderId;
      vnp_Params['vnp_OrderType'] = 'other';
      vnp_Params['vnp_Amount'] = amount * 100; // VNPAY nhận số tiền nhân 100
      vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
      vnp_Params['vnp_IpAddr'] = ipAddr;
      vnp_Params['vnp_CreateDate'] = createDate;

      vnp_Params = sortObject(vnp_Params);

      let signData = qs.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac("sha512", vnp_HashSecret);
      let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
      vnp_Params['vnp_SecureHash'] = signed;
      
      let vnpUrl = vnp_Url;
      vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });
      
      res.status(200).json({ success: true, payUrl: vnpUrl });
    } catch (error) {
      console.error('[PaymentController] createVnPay error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tạo URL VNPAY' });
    }
  }

  static async vnpayIpn(req, res) {
    try {
      let vnp_Params = req.query;
      let secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      vnp_Params = sortObject(vnp_Params);
      let signData = qs.stringify(vnp_Params, { encode: false });
      let hmac = crypto.createHmac("sha512", vnp_HashSecret);
      let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

      if (secureHash === signed) {
        let orderId = vnp_Params['vnp_TxnRef'];
        let rspCode = vnp_Params['vnp_ResponseCode'];
        
        // Kiểm tra xem giao dịch có thành công không
        if (rspCode === '00') {
          if (orderId.startsWith('TINDANG_')) {
            const tinDangId = orderId.replace('TINDANG_', '');
            const db = require('../config/db');
            await db.execute('UPDATE tindang SET TrangThaiThanhToan = ? WHERE TinDangID = ?', ['DaThanhToan', tinDangId]);
          } else {
            await LichSuViModel.suaLichSuVi(orderId, { trang_thai: 'THANH_CONG' });
          }
          res.status(200).json({RspCode: '00', Message: 'Success'})
        } else {
          // Thanh toán thất bại
          if (!orderId.startsWith('TINDANG_')) {
            await LichSuViModel.suaLichSuVi(orderId, { trang_thai: 'THAT_BAI' });
          }
          res.status(200).json({RspCode: '00', Message: 'Success'})
        }
      } else {
        res.status(200).json({RspCode: '97', Message: 'Fail checksum'})
      }
    } catch (error) {
      console.error('[PaymentController] vnpayIpn error:', error);
      res.status(200).json({RspCode: '99', Message: 'Unknown error'})
    }
  }


  // ==========================================
  // MOMO INTEGRATION
  // ==========================================

  static async createMomo(req, res) {
    try {
      const { amount, orderId, orderInfo } = req.body;
      
      const partnerCode = momo_partnerCode;
      const accessKey = momo_accessKey;
      const secretkey = momo_secretKey;
      let requestId = partnerCode + new Date().getTime();
      let requestType = "captureWallet";
      let extraData = ""; // pass empty value if your merchant does not have stores
      
      const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + momo_ipnUrl + "&orderId=" + orderId + "&orderInfo=" + (orderInfo || "Thanh toan don hang") + "&partnerCode=" + partnerCode + "&redirectUrl=" + momo_returnUrl + "&requestId=" + requestId + "&requestType=" + requestType;
      
      const crypto = require('crypto');
      const signature = crypto.createHmac('sha256', secretkey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo || "Thanh toan don hang",
        redirectUrl: momo_returnUrl,
        ipnUrl: momo_ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'vi'
      });
      
      const options = {
        method: 'POST',
        url: momo_env,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        data: requestBody
      };

      const result = await axios(options);
      
      if (result.data && result.data.payUrl) {
        return res.status(200).json({ success: true, payUrl: result.data.payUrl });
      } else {
        throw new Error('MoMo API did not return payUrl: ' + JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('[PaymentController] createMomo error:', error.message || error);
      res.status(500).json({ success: false, message: 'Lỗi tạo URL MoMo' });
    }
  }

  static async momoIpn(req, res) {
    try {
      // MoMo sẽ POST dữ liệu qua IPN khi giao dịch thành công
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = req.body;
      
      const secretkey = momo_secretKey;
      const accessKey = momo_accessKey;
      
      // Tạo lại chữ ký để verify
      const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&message=" + message + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&orderType=" + orderType + "&partnerCode=" + partnerCode + "&payType=" + payType + "&requestId=" + requestId + "&responseTime=" + responseTime + "&resultCode=" + resultCode + "&transId=" + transId;
      
      const verifySignature = crypto.createHmac('sha256', secretkey)
        .update(rawSignature)
        .digest('hex');

      if (verifySignature === signature) {
        // Chữ ký hợp lệ
        if (resultCode === 0) {
          // Thanh toán thành công
          if (orderId.startsWith('TINDANG_')) {
            const tinDangId = orderId.replace('TINDANG_', '');
            const db = require('../config/db');
            await db.execute('UPDATE tindang SET TrangThaiThanhToan = ? WHERE TinDangID = ?', ['DaThanhToan', tinDangId]);
          } else {
            await LichSuViModel.suaLichSuVi(orderId, { trang_thai: 'THANH_CONG' });
          }
        } else {
          // Thanh toán thất bại
          if (!orderId.startsWith('TINDANG_')) {
            await LichSuViModel.suaLichSuVi(orderId, { trang_thai: 'THAT_BAI' });
          }
        }
        res.status(204).send(); // MoMo yêu cầu trả về 204 No Content
      } else {
        // Chữ ký không khớp
        console.error('[PaymentController] momoIpn invalid signature');
        res.status(400).json({ message: 'Invalid signature' });
      }
    } catch (error) {
      console.error('[PaymentController] momoIpn error:', error);
      res.status(500).json({ message: 'Lỗi hệ thống' });
    }
  }

}

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = PaymentController;
