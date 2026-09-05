const LocationModel = require('../models/locationModel');

exports.getProvinces = async (req, res) => {
  try {
    // 63-province dataset: legacy / 3-level address mode uses this endpoint.
    const [rows] = await LocationModel.getProvinces();
    return res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[locationController.getProvinces] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Khong the lay danh sach tinh/thanh pho'
    });
  }
};

exports.getCommunesByProvinceId = async (req, res) => {
  try {
    const provinceId = Number(req.params.provinceId);

    if (!Number.isInteger(provinceId) || provinceId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'provinceId khong hop le'
      });
    }

    const [provinceRows] = await LocationModel.getProvinceById(provinceId);
    if (!provinceRows || provinceRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay tinh/thanh pho'
      });
    }

    const [communeRows] = await LocationModel.getCommunesByProvinceId(provinceId);

    const payload = communeRows.map((row) => ({
      WardID: row.CommuneID,
      WardCode: row.CommuneCode,
      WardName: row.CommuneName,
      WardType: row.CommuneType,
      ProvinceID: row.ProvinceID,
      ProvinceName: row.ProvinceName,
      DistrictID: row.DistrictID || null,
      DistrictName: row.DistrictName || null
    }));

    return res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    console.error('[locationController.getCommunesByProvinceId] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Khong the lay danh sach phuong/xa'
    });
  }
};
