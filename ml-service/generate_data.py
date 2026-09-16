"""
generate_data.py - Sinh bo du lieu bat dong san mo rong 35.000 ban ghi
Pham vi: 20 Quan/Huyen TP. Ho Chi Minh, giai doan 2024 - 2026
Dac trung goc: dien_tich, so_phong_ngu, so_phong_tam, quan_huyen, loai_bds, gia_tien (ty VND)
"""

import os
import csv
import random

random.seed(42)

# Don gia co ban (trieu VND/m2) theo quan va loai hinh (cap nhat thi truong 2024 - 2026)
DISTRICT_PRICES = {
    "Quan 1":          {"NhaO": 250, "CanHo": 110},
    "Quan 3":          {"NhaO": 195, "CanHo":  85},
    "Quan 4":          {"NhaO": 145, "CanHo":  65},
    "Quan 5":          {"NhaO": 165, "CanHo":  72},
    "Quan 6":          {"NhaO": 120, "CanHo":  55},
    "Quan 7":          {"NhaO": 110, "CanHo":  62},
    "Quan 8":          {"NhaO":  95, "CanHo":  48},
    "Quan 10":         {"NhaO": 155, "CanHo":  68},
    "Quan 11":         {"NhaO": 130, "CanHo":  58},
    "Quan 12":         {"NhaO":  55, "CanHo":  30},
    "Binh Thanh":      {"NhaO": 125, "CanHo":  70},
    "Go Vap":          {"NhaO":  78, "CanHo":  42},
    "Phu Nhuan":       {"NhaO": 175, "CanHo":  80},
    "Tan Binh":        {"NhaO": 110, "CanHo":  55},
    "Tan Phu":         {"NhaO":  75, "CanHo":  40},
    "Binh Tan":        {"NhaO":  58, "CanHo":  32},
    "Thu Duc":         {"NhaO":  72, "CanHo":  45},
    "Nha Be":          {"NhaO":  52, "CanHo":  28},
    "Binh Chanh":      {"NhaO":  42, "CanHo":  22},
    "Hoc Mon":         {"NhaO":  38, "CanHo":  20},
}

DISTRICTS = list(DISTRICT_PRICES.keys())


def generate_record():
    loai_bds = random.choice(["NhaO", "CanHo"])
    quan_huyen = random.choice(DISTRICTS)
    base_price = DISTRICT_PRICES[quan_huyen][loai_bds]

    if loai_bds == "CanHo":
        dien_tich    = round(random.uniform(32.0, 140.0), 1)
        so_phong_ngu = random.choice([1, 1, 2, 2, 2, 3, 3, 4])
        so_phong_tam = max(1, so_phong_ngu - random.choice([0, 1]))
    else:
        dien_tich    = round(random.uniform(30.0, 300.0), 1)
        so_phong_ngu = random.choice([2, 3, 3, 4, 4, 5, 6])
        so_phong_tam = max(1, so_phong_ngu - random.choice([0, 1, 2]))

    # He so tuong tac phong va he so dien tich quy mo (economies of scale)
    room_factor = 1.0 + (so_phong_ngu * 0.045) + (so_phong_tam * 0.025)
    # Nhieu bien dong thi truong thuc te (88% -> 114%)
    noise       = random.uniform(0.88, 1.14)
    total_mil   = base_price * dien_tich * room_factor * noise
    gia_tien    = round(total_mil / 1000.0, 3)   # ty VND

    return [dien_tich, so_phong_ngu, so_phong_tam, quan_huyen, loai_bds, gia_tien]


def generate_dataset(file_path="dataset.csv", num_records=35_000):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(base_dir, file_path) if not os.path.isabs(file_path) else file_path

    header = ["dien_tich", "so_phong_ngu", "so_phong_tam", "quan_huyen", "loai_bds", "gia_tien"]
    with open(full_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for _ in range(num_records):
            writer.writerow(generate_record())
    print(f"[OK] Da sinh thanh cong tap du lieu: {full_path} ({num_records:,} ban ghi)")


if __name__ == "__main__":
    generate_dataset("dataset.csv", num_records=35_000)
