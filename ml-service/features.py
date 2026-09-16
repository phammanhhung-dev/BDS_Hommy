"""
features.py - Module ky thuat tao dac trung (Feature Engineering)
Dung chung giua qua trinh huan luyen (train.py) va API suy luan (app.py)
"""

import pandas as pd
import numpy as np

CATEGORICAL_FEATURES = ["quan_huyen", "loai_bds"]
NUMERICAL_FEATURES = [
    "dien_tich",
    "so_phong_ngu",
    "so_phong_tam",
    "dien_tich_moi_phong",
    "ti_le_ve_sinh",
    "tong_so_phong"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Trich xuat cac dac trung phai sinh tu du lieu tho:
    1. dien_tich_moi_phong: Dien tich su dung trung binh cho moi phong ngu
    2. ti_le_ve_sinh: Ti le so phong tam tren so phong ngu (danh gia tien nghi)
    3. tong_so_phong: Tong so phong sinh hoat trong bat dong san
    """
    df = df.copy()

    # 1. Dien tich trung binh cho moi phong
    df["dien_tich_moi_phong"] = (df["dien_tich"] / (df["so_phong_ngu"] + 1)).round(2)

    # 2. Ti le tien nghi phong ve sinh / phong ngu
    df["ti_le_ve_sinh"] = (df["so_phong_tam"] / df["so_phong_ngu"].clip(lower=1)).round(2)

    # 3. Tong so phong
    df["tong_so_phong"] = df["so_phong_ngu"] + df["so_phong_tam"]

    return df
