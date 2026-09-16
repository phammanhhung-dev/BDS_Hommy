import sys
sys.stdout.reconfigure(encoding='utf-8')
import pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='', database='realestate', charset='utf8mb4')
cursor = conn.cursor(pymysql.cursors.DictCursor)

cursor.execute("""
    SELECT nd.NguoiDungID, nd.TenDayDu, nd.Email, nd.VaiTroHoatDongID, vt.TenVaiTro 
    FROM nguoidung nd 
    LEFT JOIN vaitro vt ON nd.VaiTroHoatDongID = vt.VaiTroID 
    WHERE nd.VaiTroHoatDongID IN (4, 5)
    ORDER BY nd.VaiTroHoatDongID
""")
for r in cursor.fetchall():
    uid = r.get('NguoiDungID', '')
    email = r.get('Email', '')
    name = r.get('TenDayDu', '')
    role_id = r.get('VaiTroHoatDongID', '')
    role_name = r.get('TenVaiTro', '')
    print(f"{uid} | {email} | {name} | {role_id} | {role_name}")
conn.close()
