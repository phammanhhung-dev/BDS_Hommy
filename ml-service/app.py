import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Hỗ trợ gọi CORS trực tiếp từ React nếu cần thiết
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, "rb") as f:
                model = pickle.load(f)
            print("Model loaded successfully from model.pkl!")
        except Exception as e:
            print(f"Error loading model.pkl: {e}")
    else:
        print("Warning: model.pkl does not exist. Run train.py first!")

# Tải mô hình khi khởi động server
load_model()

@app.route("/api/predict", methods=["POST"])
def predict():
    global model
    # Reload model nếu trước đó chưa tải được (để tránh phải khởi động lại server sau khi train)
    if model is None:
        load_model()
        
    if model is None:
        return jsonify({
            "success": False,
            "message": "Mô hình định giá AI chưa được huấn luyện hoặc tải thành công."
        }), 500

    try:
        data = request.get_json(force=True, silent=True) or {}
        dien_tich = float(data.get("dien_tich", 0))
        so_phong_ngu = int(data.get("so_phong_ngu", 0))
        so_phong_tam = int(data.get("so_phong_tam", 0))
        tinh_thanh = data.get("tinh_thanh", "").strip()
        quan_huyen = data.get("quan_huyen", "").strip()
        loai_bds = data.get("loai_bds", "CanHo").strip()

        if dien_tich <= 0:
            return jsonify({
                "success": False,
                "message": "Diện tích sử dụng phải lớn hơn 0"
            }), 400

        # Làm sạch tên quận huyện khớp định dạng dataset
        # Chuyển đổi các quận viết tắt (vd: "Q. Bình Thạnh" -> "Bình Thạnh")
        clean_quan = quan_huyen
        if clean_quan.lower().startswith("q."):
            clean_quan = clean_quan[2:].strip()
        elif clean_quan.lower().startswith("quận"):
            # Giữ nguyên "Quận 1", "Quận 3", "Quận 12" nhưng chuyển "Quận Bình Thạnh" -> "Bình Thạnh"
            words = clean_quan.split()
            if len(words) > 1 and not words[1].isdigit():
                clean_quan = " ".join(words[1:])

        # Chuẩn bị DataFrame đầu vào khớp định dạng train
        input_data = pd.DataFrame([{
            'dien_tich': dien_tich,
            'so_phong_ngu': so_phong_ngu,
            'so_phong_tam': so_phong_tam,
            'tinh_thanh': tinh_thanh,
            'quan_huyen': clean_quan,
            'loai_bds': loai_bds
        }])

        # Dự đoán giá (kết quả trả về đơn vị: triệu VND)
        prediction = model.predict(input_data)[0]
        
        # Làm tròn kết quả dự đoán
        predicted_price = round(prediction, 0)
        
        # Khoảng giá dao động gợi ý (+/- 5%)
        price_range_min = round(prediction * 0.95, -1) # Làm tròn chục
        price_range_max = round(prediction * 1.05, -1)

        return jsonify({
            "success": True,
            "data": {
                "predicted_price": predicted_price,
                "price_range_min": price_range_min,
                "price_range_max": price_range_max
            }
        })

    except Exception as e:
        print(f"Error predicting price: {e}")
        return jsonify({
            "success": False,
            "message": f"Lỗi xử lý dự đoán: {str(e)}"
        }), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    })

if __name__ == "__main__":
    # Railway inject PORT qua biến môi trường
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
