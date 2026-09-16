"""
Bổ sung các loại hình còn thiếu:
- Căn hộ chung cư (CanHo - Ban)
- Căn hộ & Nhà cho thuê (CanHo / NhaPho - Thue)
- Đất ở / Đất nền (DatO - Ban)
- Bất động sản tại Đồng Nai
"""

import sys
import re
import json
import html
import time
import random
import urllib.request
import pymysql

# Import các helper từ crawl_thuviennhadat
from crawl_thuviennhadat import parse_detail_page, fetch_url

sys.stdout.reconfigure(encoding='utf-8')

EXTRA_CATEGORIES = [
    # Căn hộ chung cư bán (TP.HCM & Hà Nội & Bình Dương)
    ("https://thuviennhadat.vn/ban-can-ho-chung-cu-thanh-pho-ho-chi-minh", "CanHo-HCM", 6),
    ("https://thuviennhadat.vn/ban-can-ho-chung-cu-thanh-pho-ha-noi", "CanHo-HN", 6),
    ("https://thuviennhadat.vn/ban-can-ho-chung-cu-tinh-binh-duong", "CanHo-BD", 4),

    # Cho thuê (TP.HCM & Hà Nội)
    ("https://thuviennhadat.vn/cho-thue-can-ho-chung-cu-thanh-pho-ho-chi-minh", "Thue-HCM", 6),
    ("https://thuviennhadat.vn/cho-thue-can-ho-chung-cu-thanh-pho-ha-noi", "Thue-HN", 6),

    # Đất ở (Đà Nẵng, TP.HCM, Hà Nội)
    ("https://thuviennhadat.vn/ban-dat-o-thanh-pho-da-nang", "DatO-DN", 6),
    ("https://thuviennhadat.vn/ban-dat-o-thanh-pho-ho-chi-minh", "DatO-HCM", 4),

    # Đồng Nai (Đất và Nhà)
    ("https://thuviennhadat.vn/ban-dat-o-tinh-dong-nai", "DongNai-Dat", 6),
    ("https://thuviennhadat.vn/ban-nha-rieng-tinh-dong-nai", "DongNai-Nha", 6),
]

def main():
    print("=" * 70)
    print("BỔ SUNG ĐẦY ĐỦ CÁC LOẠI HÌNH BĐS: CĂN HỘ, CHO THUÊ, ĐẤT NỀN, ĐỒNG NAI")
    print("=" * 70)

    conn = pymysql.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='',
        database='realestate',
        charset='utf8mb4',
        autocommit=True
    )

    with conn.cursor() as cur:
        cur.execute("SELECT TieuDe FROM tindang")
        existing_titles = set(r[0] for r in cur.fetchall())

    total_added = 0

    with conn.cursor() as cur:
        for cat_url, cat_name, quota in EXTRA_CATEGORIES:
            print(f"\n>>> Đang quét chuyên mục: {cat_name} ({cat_url}) - Chỉ tiêu: {quota} tin")
            added_in_cat = 0
            
            for page in range(1, 3):
                p_url = cat_url if page == 1 else f"{cat_url}?trang={page}"
                html_data = fetch_url(p_url)
                if not html_data:
                    continue

                matches = re.findall(r'href=["\']([^"\']*-pst\d+\.html)["\']', html_data)
                for m in matches:
                    if added_in_cat >= quota:
                        break
                    full_url = m if m.startswith('http') else 'https://thuviennhadat.vn' + m
                    data = parse_detail_page(full_url, cat_name)
                    if not data or data['title'] in existing_titles:
                        continue

                    # Tinh chỉnh LoaiBDS và LoaiGiaoDich theo chuyên mục
                    if 'CanHo' in cat_name:
                        data['loai_bds'] = 'CanHo'
                        data['loai_giao_dich'] = 'Ban'
                    elif 'Thue' in cat_name:
                        data['loai_giao_dich'] = 'Thue'
                        if 'chung-cu' in full_url or 'can-ho' in full_url:
                            data['loai_bds'] = 'CanHo'
                    elif 'DatO' in cat_name or 'DongNai-Dat' in cat_name:
                        data['loai_bds'] = 'DatO'
                        data['loai_giao_dich'] = 'Ban'
                        data['so_phong_ngu'] = None
                        data['so_phong_tam'] = None
                        data['so_tang'] = None

                    try:
                        # 1. Thêm duan
                        cur.execute("""
                            INSERT INTO duan (
                                TenDuAn, DiaChi, ViDo, KinhDo, ChuDuAnID, ChinhSachCocID, BangHoaHong,
                                SoThangCocToiThieu, YeuCauPheDuyetChu, TrangThai, TaoLuc, CapNhatLuc
                            ) VALUES (%s, %s, %s, %s, 1, 1, '[]', 1, 0, 'HoatDong', NOW(), NOW())
                        """, (data['ten_du_an'], data['address'], data['vido'], data['kinhdo']))
                        du_an_id = cur.lastrowid

                        # 2. Thêm tindang
                        img_json = json.dumps(data['images'], ensure_ascii=False)
                        cur.execute("""
                            INSERT INTO tindang (
                                DuAnID, ChinhSachCocID, TieuDe, URL, MoTa, TienIch,
                                LoaiGiaoDich, LoaiBDS, GiaTien, DienTichDat, DienTichSuDung,
                                SoTang, SoPhongNgu, SoPhongTam, Huong, PhapLy, NoiThat,
                                TrangThai, ChuDuAnID, GoiTin, TrangThaiThanhToan, TaoLuc, CapNhatLuc, DuyetLuc
                            ) VALUES (
                                %s, 1, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s,
                                %s, %s, %s, %s, %s, %s,
                                'DaDuyet', 1, 'premium', 'DaThanhToan', NOW(), NOW(), NOW()
                            )
                        """, (
                            du_an_id, data['title'], img_json, data['mota'], data['tien_ich'],
                            data['loai_giao_dich'], data['loai_bds'], data['price'], data['area'], data['area'],
                            data['so_tang'], data['so_phong_ngu'], data['so_phong_tam'], data['huong'], data['phap_ly'], data['noi_that']
                        ))
                        tindang_id = cur.lastrowid
                        existing_titles.add(data['title'])

                        added_in_cat += 1
                        total_added += 1
                        print(f"  [+] #{tindang_id} | {data['loai_bds']} ({data['loai_giao_dich']}) | {data['title'][:45]}... | {data['price']:,.0f} đ | {data['address']}")
                    except Exception as e:
                        print(f"  [!] Lỗi DB: {e}")

                    time.sleep(0.2)

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM tindang")
        grand_total = cur.fetchone()[0]

    conn.close()
    print("\n" + "=" * 70)
    print(f"ĐÃ BỔ SUNG THÀNH CÔNG {total_added} TIN ĐĂNG ĐA DẠNG.")
    print(f"TỔNG SỐ TIN ĐĂNG TOÀN HỆ THỐNG: {grand_total} TIN.")
    print("=" * 70)

if __name__ == '__main__':
    main()
