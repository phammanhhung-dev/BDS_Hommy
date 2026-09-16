"""
train.py - Pipeline Huan luyen & So sanh 6 Mo hinh Machine Learning / Deep Learning
Mo hinh: 
  1. Linear Regression (Baseline)
  2. Decision Tree Regressor (CART)
  3. Random Forest Regressor (Toi uu GridSearch 5-Fold Cross Validation)
  4. XGBoost Regressor (Gradient Boosting)
  5. Multi-Layer Perceptron - MLP (Deep Neural Network)
  6. Stacking Ensemble Regressor (Mo hinh ket hop nang cao)
Danh gia: R2, MAE, RMSE, MAPE tren tap kiem thu doc lap
Tu dong dong goi mo hinh tot nhat thanh model.pkl
"""

import os
import sys
import time
import pickle
import joblib
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, StackingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error
)

from features import add_features, CATEGORICAL_FEATURES, NUMERICAL_FEATURES, ALL_FEATURES

try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("[WARN] xgboost chua duoc cai dat - XGBoost model se bi bo qua")

warnings.filterwarnings("ignore")

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH   = os.path.join(BASE_DIR, "model.pkl")
TEST_SIZE    = 0.2
RANDOM_STATE = 42


def load_and_clean(path):
    print("\n[1/6] Doc va lam sach du lieu:")
    print("      Nguon: " + path)
    df = pd.read_csv(path)
    n_orig = len(df)
    print("      Tong so ban ghi goc: {:,}".format(n_orig))

    df.dropna(inplace=True)

    # Loc ngoai lai IQR tren gia_tien
    Q1, Q3 = df["gia_tien"].quantile(0.25), df["gia_tien"].quantile(0.75)
    IQR    = Q3 - Q1
    df = df[(df["gia_tien"] >= Q1 - 1.5 * IQR) & (df["gia_tien"] <= Q3 + 1.5 * IQR)]

    # Loc ngoai lai IQR tren dien_tich
    Q1a, Q3a = df["dien_tich"].quantile(0.25), df["dien_tich"].quantile(0.75)
    IQRa = Q3a - Q1a
    df = df[(df["dien_tich"] >= Q1a - 1.5 * IQRa) & (df["dien_tich"] <= Q3a + 1.5 * IQRa)]

    n_clean = len(df)
    removed = n_orig - n_clean
    pct = removed / n_orig * 100
    print("      Sau khi loc ngoai lai (IQR): {:,} ban ghi (loai bo {} ban ghi ~ {:.1f}%)".format(
        n_clean, removed, pct
    ))
    return df


def build_preprocessor():
    """Tien xu ly: Chuan hoa Numerical features va One-Hot Encoding Categorical features"""
    num_transformer = StandardScaler()
    cat_transformer = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_transformer, NUMERICAL_FEATURES),
            ("cat", cat_transformer, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor


def evaluate(name, pipeline, X_test, y_test):
    y_pred = pipeline.predict(X_test)
    r2   = r2_score(y_test, y_pred)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    return {
        "name":     name,
        "r2":       r2,
        "mae":      mae,
        "rmse":     rmse,
        "mape":     mape,
        "pipeline": pipeline,
    }


def train():
    total_start_time = time.time()
    print("=" * 80)
    print("  HOMMY REAL ESTATE - HE THONG HUAN LUYEN HOC MAY & HOC SAU (MACHINE LEARNING)")
    print("=" * 80)

    # 1. Doc & Lam sach du lieu
    df = load_and_clean(DATA_PATH)

    # 2. Feature Engineering
    print("\n[2/6] Ky thuat tao dac trung (Feature Engineering):")
    df = add_features(df)
    print("      Dac trung su dung ({:,} dac trung):".format(len(ALL_FEATURES)))
    print("      - Dinh danh: {}".format(CATEGORICAL_FEATURES))
    print("      - So hoc   : {}".format(NUMERICAL_FEATURES))

    X = df[ALL_FEATURES]
    y = df["gia_tien"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print("      Tap Train: {:,} mau | Tap Test doc lap: {:,} mau".format(len(X_train), len(X_test)))

    results = []

    # 3. Baseline: Linear Regression & Decision Tree
    print("\n[3/6] Huan luyen cac mo hinh Co so (Baseline):")

    # Mo hinh 1: Linear Regression
    t0 = time.time()
    pipe_lr = Pipeline([
        ("pre", build_preprocessor()),
        ("reg", LinearRegression())
    ])
    pipe_lr.fit(X_train, y_train)
    lr_time = time.time() - t0
    print("      [1/6] Linear Regression: Done ({:.2f}s)".format(lr_time))
    results.append(evaluate("Linear Regression", pipe_lr, X_test, y_test))

    # Mo hinh 2: Decision Tree (CART)
    t0 = time.time()
    pipe_dt = Pipeline([
        ("pre", build_preprocessor()),
        ("reg", DecisionTreeRegressor(max_depth=15, min_samples_split=5, random_state=RANDOM_STATE))
    ])
    pipe_dt.fit(X_train, y_train)
    dt_time = time.time() - t0
    print("      [2/6] Decision Tree (CART): Done ({:.2f}s)".format(dt_time))
    results.append(evaluate("Decision Tree (CART)", pipe_dt, X_test, y_test))

    # 4. Mo hinh 3: Random Forest + GridSearchCV 5-Fold
    print("\n[4/6] Toi uu sieu tham so Random Forest (5-Fold Cross Validation):")
    param_grid = {
        "reg__n_estimators":      [100, 200],
        "reg__max_depth":         [14, 20],
        "reg__min_samples_split": [2, 5],
    }
    pipe_rf_base = Pipeline([
        ("pre", build_preprocessor()),
        ("reg", RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1))
    ])
    t0 = time.time()
    gs = GridSearchCV(
        pipe_rf_base, param_grid, cv=5, scoring="r2", n_jobs=-1, verbose=1
    )
    gs.fit(X_train, y_train)
    rf_time = time.time() - t0
    pipe_rf = gs.best_estimator_
    print("      [3/6] Random Forest (5-Fold CV): Done ({:.2f}s)".format(rf_time))
    print("            Best hyperparameters: {}".format(gs.best_params_))
    results.append(evaluate("Random Forest (GridSearchCV 5-Fold)", pipe_rf, X_test, y_test))

    # 5. Mo hinh 4 & 5: XGBoost va Deep Learning (MLP)
    print("\n[5/6] Huan luyen Gradient Boosting & Mang no-ron Hoc sau (Deep Learning):")

    # Mo hinh 4: XGBoost
    pipe_xgb = None
    if XGBOOST_AVAILABLE:
        t0 = time.time()
        pipe_xgb = Pipeline([
            ("pre", build_preprocessor()),
            ("reg", XGBRegressor(
                n_estimators=200,
                max_depth=7,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=RANDOM_STATE,
                verbosity=0,
                n_jobs=-1
            ))
        ])
        pipe_xgb.fit(X_train, y_train)
        xgb_time = time.time() - t0
        print("      [4/6] XGBoost Regressor: Done ({:.2f}s)".format(xgb_time))
        results.append(evaluate("XGBoost Regressor", pipe_xgb, X_test, y_test))
    else:
        print("      [4/6] XGBoost: [Bo qua vi chua cai dat]")

    # Mo hinh 5: Multi-Layer Perceptron (Deep Neural Network)
    t0 = time.time()
    print("      [5/6] Bat dau huan luyen Deep Neural Network (MLP: 2 Hidden Layers [128, 64])...")
    pipe_mlp = Pipeline([
        ("pre", build_preprocessor()),
        ("reg", MLPRegressor(
            hidden_layer_sizes=(128, 64),
            activation="relu",
            solver="adam",
            learning_rate_init=0.003,
            max_iter=35,
            early_stopping=True,
            n_iter_no_change=5,
            verbose=True,
            random_state=RANDOM_STATE
        ))
    ])
    pipe_mlp.fit(X_train, y_train)
    mlp_time = time.time() - t0
    print("            MLP Neural Network: Done ({:.2f}s)".format(mlp_time))
    results.append(evaluate("Deep Learning (MLP Neural Net)", pipe_mlp, X_test, y_test))

    # 6. Mo hinh 6: Stacking Ensemble Regressor
    print("\n[6/6] Huan luyen Mo hinh Xep chong Nang cao (Stacking Ensemble Regressor):")
    t0 = time.time()
    base_learners = [
        ("rf", pipe_rf.named_steps["reg"]),
        ("mlp", pipe_mlp.named_steps["reg"])
    ]
    if pipe_xgb is not None:
        base_learners.append(("xgb", pipe_xgb.named_steps["reg"]))

    stacking_reg = StackingRegressor(
        estimators=base_learners,
        final_estimator=Ridge(alpha=1.0),
        cv=3,
        n_jobs=-1
    )
    pipe_stacking = Pipeline([
        ("pre", build_preprocessor()),
        ("reg", stacking_reg)
    ])
    pipe_stacking.fit(X_train, y_train)
    stacking_time = time.time() - t0
    print("      [6/6] Stacking Ensemble (RF + XGB + MLP -> Meta Ridge): Done ({:.2f}s)".format(stacking_time))
    results.append(evaluate("Stacking Ensemble (RF + XGB + MLP)", pipe_stacking, X_test, y_test))

    # Tong ket danh gia
    print("\n" + "=" * 80)
    print("  BANG TONG KET SO SANH HIEU NANG MO HINH TREN TAP KIEM THU DOC LAP")
    print("=" * 80)
    print("  {:<38}  {:>7}  {:>10}  {:>10}  {:>8}".format(
        "Mo hinh", "R2", "MAE (ty)", "RMSE (ty)", "MAPE (%)"
    ))
    print("  " + "-" * 78)
    for r in results:
        print("  {:<38}  {:>7.4f}  {:>10.4f}  {:>10.4f}  {:>7.2f}%".format(
            r["name"], r["r2"], r["mae"], r["rmse"], r["mape"]
        ))
    print("  " + "-" * 78)

    best = max(results, key=lambda x: x["r2"])
    print("\n  ==> MO HINH TOI UU DUOC CHON TU DONG: {} (R2 = {:.4f}, MAPE = {:.2f}%)".format(
        best["name"], best["r2"], best["mape"]
    ))

    # Luu model tot nhat (nen compress=3 de file < 100MB cho phep push GitHub)
    joblib.dump(best["pipeline"], MODEL_PATH, compress=3)
    print("  ==> DA DONG GOI VA NEN MODEL THANH CONG: " + MODEL_PATH)

    total_elapsed = time.time() - total_start_time
    print("  ==> TONG THOI GIAN HUAN LUYEN: {:.1f} giay (~ {:.1f} phut)".format(
        total_elapsed, total_elapsed / 60
    ))
    print("=" * 80)
    return results


if __name__ == "__main__":
    train()
