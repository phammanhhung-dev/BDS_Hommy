import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

def train_model():
    print("Reading data from dataset.csv...")
    try:
        df = pd.read_csv("dataset.csv")
    except FileNotFoundError:
        print("Error: dataset.csv not found. Run generate_data.py first!")
        return

    # 1. Định nghĩa đầu vào X và đầu ra y
    X = df[['dien_tich', 'so_phong_ngu', 'so_phong_tam', 'tinh_thanh', 'quan_huyen', 'loai_bds']]
    y = df['gia_tien']

    # 2. Thiết lập tiền xử lý (One-hot encoding cho các trường phân loại)
    categorical_features = ['tinh_thanh', 'quan_huyen', 'loai_bds']
    numerical_features = ['dien_tich', 'so_phong_ngu', 'so_phong_tam']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # 3. Định nghĩa Pipeline tích hợp tiền xử lý và thuật toán Random Forest
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42))
    ])

    print("Training Random Forest Regressor model...")
    model.fit(X, y)

    # Đánh giá R2 Score sơ bộ trên chính tập train
    r2_score = model.score(X, y)
    print(f"Model R2 Score: {r2_score:.4f}")

    # 4. Lưu mô hình đã huấn luyện
    with open("model.pkl", "wb") as f:
        pickle.dump(model, f)
    
    print("Model saved successfully at: model.pkl")

if __name__ == "__main__":
    train_model()
