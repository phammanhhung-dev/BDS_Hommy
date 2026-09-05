<?php
// Cho phép CORS (nếu cần test từ Postman hay frontend)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Đọc dữ liệu JSON Sepay gửi đến
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

// Nếu không có dữ liệu -> trả lỗi
if (!$data) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No JSON payload received"
    ]);
    exit;
}

// Ghi log (tùy chọn để debug)
file_put_contents("callback_log.txt", date("Y-m-d H:i:s") . " - " . json_encode($data) . PHP_EOL, FILE_APPEND);

// Trả kết quả JSON về cho Sepay
echo json_encode([
    "success" => true,
    "message" => "Callback received successfully",
    "received" => $data
]);
