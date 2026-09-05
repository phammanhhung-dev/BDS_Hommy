const db = require('../config/db');

exports.getProvinces = () => {
  return db.query(
    `SELECT ProvinceID, ProvinceCode, ProvinceName, ProvinceType
     FROM new_provinces
     ORDER BY ProvinceName ASC`
  );
};

exports.getProvinceById = (provinceId) => {
  return db.query(
    `SELECT ProvinceID, ProvinceCode, ProvinceName, ProvinceType
     FROM new_provinces
     WHERE ProvinceID = ?
     LIMIT 1`,
    [provinceId]
  );
};

exports.getCommunesByProvinceId = (provinceId) => {
  return db.query(
    `SELECT
       nc.CommuneID AS WardID,
       nc.CommuneCode AS WardCode,
       nc.CommuneName AS WardName,
       nc.CommuneType AS WardType,
       nc.ProvinceID AS ProvinceID,
       np.ProvinceName AS ProvinceName,
       NULL AS DistrictID,
       TRIM(
         CASE
           WHEN nc.CommuneName REGEXP '\\((.*)\\)$' THEN SUBSTRING_INDEX(SUBSTRING_INDEX(nc.CommuneName, '(', -1), ')', 1)
           ELSE NULL
         END
       ) AS DistrictName
     FROM new_communes nc
     LEFT JOIN new_provinces np ON np.ProvinceID = nc.ProvinceID
     WHERE nc.ProvinceID = ?
     ORDER BY nc.CommuneName ASC`,
    [provinceId]
  );
};
