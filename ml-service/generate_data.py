import csv
import random

# Danh sách Tỉnh/Thành, quận huyện và đơn giá cơ bản (triệu VND / m2) cho nhà ở
PROVINCE_DATA = {
    'TP. Hồ Chí Minh': {
        'Quận 1': {'NhaO': 200, 'CanHo': 90},
        'Quận 3': {'NhaO': 160, 'CanHo': 80},
        'Quận 7': {'NhaO': 95, 'CanHo': 55},
        'Bình Thạnh': {'NhaO': 105, 'CanHo': 60},
        'Gò Vấp': {'NhaO': 65, 'CanHo': 35},
        'Quận 12': {'NhaO': 45, 'CanHo': 26},
        'Bình Chánh': {'NhaO': 35, 'CanHo': 22}
    },
    'Hà Nội': {
        'Quận Hoàn Kiếm': {'NhaO': 220, 'CanHo': 95},
        'Quận Đống Đa': {'NhaO': 150, 'CanHo': 70},
        'Quận Cầu Giấy': {'NhaO': 140, 'CanHo': 65},
        'Quận Hai Bà Trưng': {'NhaO': 145, 'CanHo': 68},
        'Quận Thanh Xuân': {'NhaO': 110, 'CanHo': 50},
        'Quận Hà Đông': {'NhaO': 75, 'CanHo': 35},
        'Quận Long Biên': {'NhaO': 85, 'CanHo': 40}
    },
    'Đà Nẵng': {
        'Quận Hải Châu': {'NhaO': 110, 'CanHo': 50},
        'Quận Sơn Trà': {'NhaO': 95, 'CanHo': 45},
        'Quận Ngũ Hành Sơn': {'NhaO': 80, 'CanHo': 40},
        'Quận Thanh Khê': {'NhaO': 75, 'CanHo': 35},
        'Quận Liên Chiểu': {'NhaO': 55, 'CanHo': 25}
    },
    'Bình Dương': {
        'Thành phố Thủ Dầu Một': {'NhaO': 65, 'CanHo': 35},
        'Thành phố Dĩ An': {'NhaO': 60, 'CanHo': 32},
        'Thành phố Thuận An': {'NhaO': 58, 'CanHo': 30},
        'Thị xã Bến Cát': {'NhaO': 35, 'CanHo': 20},
        'Thị xã Tân Uyên': {'NhaO': 40, 'CanHo': 22}
    },
    'Đồng Nai': {
        'Thành phố Biên Hòa': {'NhaO': 70, 'CanHo': 35},
        'Thành phố Long Khánh': {'NhaO': 45, 'CanHo': 25},
        'Huyện Long Thành': {'NhaO': 55, 'CanHo': 28},
        'Huyện Trảng Bom': {'NhaO': 35, 'CanHo': 18},
        'Huyện Nhơn Trạch': {'NhaO': 40, 'CanHo': 22}
    }
}

def generate_dataset(file_path, num_records=3000):
    header = ['dien_tich', 'so_phong_ngu', 'so_phong_tam', 'tinh_thanh', 'quan_huyen', 'loai_bds', 'gia_tien']
    
    with open(file_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        
        provinces = list(PROVINCE_DATA.keys())
        
        for _ in range(num_records):
            loai_bds = random.choice(['NhaO', 'CanHo'])
            tinh_thanh = random.choice(provinces)
            districts = list(PROVINCE_DATA[tinh_thanh].keys())
            quan_huyen = random.choice(districts)
            
            # Chọn diện tích dựa trên loại tài sản
            if loai_bds == 'CanHo':
                dien_tich = round(random.uniform(40.0, 120.0), 1)
                so_phong_ngu = random.choice([1, 2, 3])
                so_phong_tam = max(1, so_phong_ngu - random.choice([0, 1]))
            else: # NhaO
                dien_tich = round(random.uniform(35.0, 250.0), 1)
                so_phong_ngu = random.choice([2, 3, 4, 5])
                so_phong_tam = max(1, so_phong_ngu - random.choice([0, 1, 2]))
                
            # Đơn giá cơ bản theo quận và loại hình
            base_price = PROVINCE_DATA[tinh_thanh][quan_huyen][loai_bds]
            
            # Hệ số tăng/giảm theo số phòng ngủ/tắm (nhiều phòng hơn thì giá trị sử dụng cao hơn)
            room_factor = 1.0 + (so_phong_ngu * 0.05) + (so_phong_tam * 0.03)
            
            # Nhiễu ngẫu nhiên (-10% đến +10%)
            noise = random.uniform(0.9, 1.1)
            
            # Tính tổng giá trị bất động sản (triệu VND)
            total_price = base_price * dien_tich * room_factor * noise
            
            # Làm tròn giá trị tổng (triệu VND)
            total_price = round(total_price, 0)
            
            writer.writerow([dien_tich, so_phong_ngu, so_phong_tam, tinh_thanh, quan_huyen, loai_bds, total_price])

    print(f"Dataset created successfully at: {file_path}")

if __name__ == "__main__":
    generate_dataset("dataset.csv")
