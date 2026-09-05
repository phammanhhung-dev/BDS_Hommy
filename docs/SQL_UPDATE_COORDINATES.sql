-- ==========================================
-- SQL SCRIPT: THÊM TỌA ĐỘ CHO TIN ĐĂNG TEST
-- ==========================================
-- Ngày: 03/10/2025
-- Mục đích: Cập nhật ViDo (Latitude) và KinhDo (Longitude) cho tin đăng test
-- Tool: https://www.google.com/maps (Click chuột phải -> Copy coordinates)

-- ==========================================
-- 1. TIN ĐĂNG ID=6 - TP.HCM (Quận 1)
-- ==========================================
-- Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM
-- Gần: Đường sách Nguyễn Huệ, Bến Nhà Rồng
UPDATE tindang 
SET 
  ViDo = 10.7769,    -- Latitude
  KinhDo = 106.7009  -- Longitude
WHERE TinDangID = 6;

-- ==========================================
-- 2. TIN ĐĂNG ID=1 - HÀ NỘI (Hoàn Kiếm)
-- ==========================================
-- Địa chỉ gần: Hồ Gươm, Phố cổ Hà Nội
UPDATE tindang
SET
  ViDo = 21.0285,    -- Latitude
  KinhDo = 105.8542  -- Longitude
WHERE TinDangID = 1;

-- ==========================================
-- 3. TIN ĐĂNG ID=2 - TP.HCM (Quận Bình Thạnh)
-- ==========================================
-- Địa chỉ gần: Vincom Landmark 81, Vạn Phúc City
UPDATE tindang
SET
  ViDo = 10.8044,    -- Latitude
  KinhDo = 106.7188  -- Longitude
WHERE TinDangID = 2;

-- ==========================================
-- 4. TIN ĐĂNG ID=3 - TP.HCM (Quận 7)
-- ==========================================
-- Địa chỉ gần: Phú Mỹ Hưng, Crescent Mall
UPDATE tindang
SET
  ViDo = 10.7412,    -- Latitude
  KinhDo = 106.6973  -- Longitude
WHERE TinDangID = 3;

-- ==========================================
-- 5. TIN ĐĂNG ID=4 - HÀ NỘI (Cầu Giấy)
-- ==========================================
-- Địa chỉ gần: ĐH Quốc Gia, BigC Thăng Long
UPDATE tindang
SET
  ViDo = 21.0373,    -- Latitude
  KinhDo = 105.7829  -- Longitude
WHERE TinDangID = 4;

-- ==========================================
-- 6. TIN ĐĂNG ID=5 - ĐÀ NẴNG (Hải Châu)
-- ==========================================
-- Địa chỉ gần: Cầu Rồng, Sông Hàn
UPDATE tindang
SET
  ViDo = 16.0544,    -- Latitude
  KinhDo = 108.2022  -- Longitude
WHERE TinDangID = 5;

-- ==========================================
-- VERIFY: Kiểm tra tọa độ đã cập nhật
-- ==========================================
SELECT 
  TinDangID,
  TieuDe,
  ViDo,
  KinhDo,
  CONCAT('https://www.google.com/maps/search/?api=1&query=', ViDo, ',', KinhDo) AS GoogleMapsLink
FROM tindang
WHERE TinDangID IN (1, 2, 3, 4, 5, 6)
ORDER BY TinDangID;

-- ==========================================
-- LƯU Ý QUAN TRỌNG
-- ==========================================
-- 1. Tọa độ format: DECIMAL(10, 7)
--    - ViDo (Latitude): -90 đến +90
--    - KinhDo (Longitude): -180 đến +180
--
-- 2. Việt Nam ranges:
--    - Latitude: 8.18 đến 23.39
--    - Longitude: 102.14 đến 109.46
--
-- 3. Tool lấy tọa độ:
--    - Google Maps: Click chuột phải -> Copy coordinates
--    - Format: "10.7769, 106.7009" -> Split thành 2 giá trị
--
-- 4. Sử dụng trong component:
--    <MapViTriPhong 
--      lat={parseFloat(tinDang.ViDo)} 
--      lng={parseFloat(tinDang.KinhDo)} 
--    />
--
-- 5. Kiểm tra trên Google Maps:
--    https://www.google.com/maps/search/?api=1&query={ViDo},{KinhDo}
-- ==========================================
