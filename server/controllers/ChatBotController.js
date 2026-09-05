const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Bộ tri thức dự phòng cục bộ thông minh của Hommy (Smart Fallback Engine)
function getSmartFallbackReply(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return "Xin chào! Tôi là Trợ lý ảo của nền tảng Bất động sản Hommy. Bạn cần hỗ trợ thông tin gì hôm nay?";
    }

    const text = rawText.toLowerCase().trim();

    // 1. Lời chào hỏi & giới thiệu
    if (/^(chào|chao|hi|hello|alo|xin chào|xin chao|hey|bạn là ai|ban la ai|bạn tên gì|bot là ai)/i.test(text)) {
        return "Xin chào! Tôi là Trợ lý ảo thông minh của hệ thống Hommy BĐS 🏡\n\nTôi có thể hỗ trợ bạn:\n• 🔍 Tìm kiếm nhà đất bán & cho thuê theo khu vực, ngân sách\n• 🤖 Hướng dẫn tính năng Định giá BĐS bằng AI\n• 📑 Tư vấn quy trình đặt cọc, hợp đồng và pháp lý BĐS\n• 🏢 Cung cấp thông tin các dự án BĐS nổi bật\n• 📞 Kết nối trực tiếp với đội ngũ hỗ trợ\n\nBạn đang quan tâm đến loại hình BĐS hoặc khu vực nào?";
    }

    // 2. Thông tin liên hệ, hotline, hỗ trợ
    if (/liên hệ|lien he|hotline|số điện thoại|so dien thoai|sđt|sdt|email|hỗ trợ|ho tro|tư vấn|tu van|gặp nhân viên|cskh/i.test(text)) {
        return "Bạn có thể liên hệ trực tiếp với đội ngũ Hommy qua các kênh chính thức:\n📞 **Hotline**: 0356960304 (Hỗ trợ 24/7)\n📧 **Email**: batdongsanhommy@gmail.com\n🏢 **Hệ thống**: Nền tảng Quản lý & Giao dịch Bất động sản Hommy\n\nChúng tôi luôn sẵn lòng tư vấn và giải đáp mọi câu hỏi của bạn!";
    }

    // 3. Định giá AI
    if (/định giá|dinh gia|giá nhà|gia nha|đoán giá|ước tính|dự đoán giá|valuation/i.test(text)) {
        return "Công cụ **Định giá AI 🤖** của Hommy ứng dụng mô hình Machine Learning tiên tiến để phân tích dữ liệu thị trường, vị trí, diện tích và tiện ích xung quanh, giúp ước tính mức giá BĐS chuẩn xác nhất.\n\n👉 Bạn hãy nhấp vào mục **'Định giá AI 🤖'** trên thanh menu chính hoặc truy cập trang chi tiết bất động sản bất kỳ để trải nghiệm tính năng này ngay nhé!";
    }

    // 4. Hướng dẫn đăng tin
    if (/đăng tin|dang tin|đăng bài|dang bai|cách đăng|cach dang|tạo tin/i.test(text)) {
        return "Để đăng tin bất động sản trên Hommy, bạn chỉ cần thực hiện 3 bước đơn giản:\n1. Bấm nút **'Đăng tin'** màu xanh ở góc phải trên cùng màn hình.\n2. Điền đầy đủ thông tin: Tiêu đề, địa chỉ cụ thể, loại BĐS, diện tích, mức giá và hình ảnh thực tế.\n3. Nhấn lưu và đăng bài để tin đăng tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày!";
    }

    // 5. Quy trình, đặt cọc, pháp lý
    if (/đặt cọc|dat coc|pháp lý|phap ly|sổ đỏ|so do|sổ hồng|so hong|hợp đồng|hop dong|thủ tục|thu tuc|công chứng|cong chung|tranh chấp|sang tên/i.test(text)) {
        return "Về thủ tục pháp lý và đặt cọc BĐS, Hommy khuyến nghị các bước an toàn sau:\n1. 📑 **Kiểm tra pháp lý**: Xem trực tiếp bản gốc Sổ đỏ/Sổ hồng, kiểm tra thông tin quy hoạch tại địa phương và đảm bảo tài sản không bị kê biên, tranh chấp.\n2. ✍️ **Hợp đồng đặt cọc**: Lập bằng văn bản, có chữ ký người đứng tên trên sổ, quy định rõ số tiền cọc, thời hạn thanh toán và điều khoản phạt cọc nếu vi phạm.\n3. 🏛️ **Công chứng & Sang tên**: Tiến hành công chứng hợp đồng chuyển nhượng tại Văn phòng công chứng và nộp hồ sơ tại Văn phòng Đăng ký đất đai.\n\n📚 Xem thêm các cẩm nang bổ ích tại mục **'Wiki BĐS'** trên Hommy!";
    }

    // 6. Dự án BĐS
    if (/dự án|du an|chủ đầu tư|chu dau tu|tiến độ|tien do/i.test(text)) {
        return "Mục **'Dự án'** trên Hommy liên tục cập nhật thông tin các dự án căn hộ, khu đô thị mới nhất, đi kèm thông tin chủ đầu tư uy tín, tiến độ thi công thực tế và chính sách mở bán ưu đãi.\n\nBạn hãy truy cập mục 'Dự án' trên thanh điều hướng để xem danh sách chi tiết nhé!";
    }

    // 7. Cho thuê nhà đất
    if (/thuê|thue|cho thuê|cho thue|nhà trọ|nha tro|phòng trọ|phong tro|mặt bằng|mat bang/i.test(text)) {
        return "Bạn đang tìm kiếm bất động sản cho thuê? Mục **'Nhà đất cho thuê'** trên Hommy cung cấp đầy đủ thông tin từ phòng trọ, chung cư mini, căn hộ cao cấp đến mặt bằng kinh doanh.\n\n💡 Bạn có thể dễ dàng lọc theo mức giá thuê theo tháng và vị trí thuận tiện di chuyển nhất.";
    }

    // 8. Mua bán nhà đất
    if (/nhà đất bán|nha dat ban|mua nhà|mua nha|bán nhà|ban nha|mua đất|mua dat|căn hộ|can ho|biệt thự|biet thu|đất nền|dat nen|nhà phố|nha pho/i.test(text)) {
        return "Hommy có hơn 50.000 tin đăng bất động sản bán tại các khu vực nóng như TP.HCM, Hà Nội, Đà Nẵng và toàn quốc.\n\n🔍 Bạn có thể bấm vào mục **'Nhà đất bán'** trên thanh điều hướng để lọc chi tiết theo:\n• Loại hình: Căn hộ chung cư, nhà riêng, đất nền, biệt thự, văn phòng...\n• Khu vực: Tỉnh/Thành phố, Quận/Huyện, Phường/Xã\n• Khoảng giá và diện tích mong muốn.\n\nNếu bạn cần tìm nhà ở khu vực cụ thể, hãy nhắn cho tôi biết nhé!";
    }

    // 9. Phản hồi mặc định thông minh
    return "Cảm ơn bạn đã trò chuyện cùng Trợ lý ảo Hommy! 🏡\n\nTôi luôn sẵn lòng hỗ trợ bạn về:\n• Tra cứu & tìm kiếm tin đăng BĐS bán hoặc cho thuê\n• Sử dụng công cụ **Định giá AI 🤖**\n• Tư vấn quy trình đặt cọc, hợp đồng và pháp lý BĐS\n\nBạn có thể thử đặt câu hỏi chi tiết hơn hoặc liên hệ Hotline **0356960304** để được nhân viên tư vấn trực tiếp nhé!";
}

class ChatBotController {
    static async chat(req, res) {
        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Dữ liệu tin nhắn không hợp lệ'
                });
            }

            // Lấy tin nhắn mới nhất của người dùng
            const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

            // Kiểm tra xem có cấu hình GROQ_API_KEY hợp lệ hay không
            const rawApiKey = process.env.GROQ_API_KEY;
            const hasValidGroqKey = rawApiKey && 
                                    typeof rawApiKey === 'string' && 
                                    rawApiKey.trim() !== '' && 
                                    !rawApiKey.includes('your_groq_api_key');

            if (hasValidGroqKey) {
                try {
                    // System prompt định hình tính cách AI
                    const systemMessage = {
                        role: "system",
                        content: `Bạn là trợ lý ảo thông minh của hệ thống "Hommy BĐS" - Nền tảng quản lý và giao dịch bất động sản hàng đầu Việt Nam.
                        
Nhiệm vụ của bạn:
1. Hỗ trợ người dùng tìm kiếm thông tin về các loại bất động sản (căn hộ, nhà riêng, đất nền, biệt thự, văn phòng...).
2. Giải đáp thắc mắc về quy trình mua bán, cho thuê, đặt cọc, hợp đồng và thanh toán bất động sản.
3. Tư vấn về giá cả, vị trí và pháp lý bất động sản phù hợp với nhu cầu người dùng.
4. Cung cấp thông tin về các dự án bất động sản đang mở bán hoặc cho thuê.
5. Hướng dẫn sử dụng tính năng "Định giá AI" trên website Hommy.
6. Luôn trả lời ngắn gọn, thân thiện, dùng tiếng Việt có dấu.
7. Hotline hỗ trợ: 0356960304 - Email: batdongsanhommy@gmail.com.

Đừng bịa đặt thông tin nếu không chắc chắn.`
                    };

                    const conversation = [systemMessage, ...messages];

                    const response = await axios.post(
                        'https://api.groq.com/openai/v1/chat/completions',
                        {
                            messages: conversation,
                            model: "llama-3.3-70b-versatile",
                            temperature: 0.7,
                            max_tokens: 1024,
                            stream: false
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${rawApiKey.trim()}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 10000 // Giới hạn 10s timeout
                        }
                    );

                    const reply = response.data.choices[0]?.message?.content;
                    if (reply) {
                        return res.status(200).json({
                            success: true,
                            data: reply,
                            source: 'groq'
                        });
                    }
                } catch (groqError) {
                    console.warn('⚠️ Groq API không khả dụng hoặc key lỗi, tự động chuyển sang Fallback Engine:', groqError.response?.data || groqError.message);
                    // Rơi xuống bộ Fallback phía dưới thay vì báo lỗi 500
                }
            }

            // Chế độ dự phòng thông minh cục bộ (Offline / No Key Fallback)
            const fallbackReply = getSmartFallbackReply(latestUserMessage);
            return res.status(200).json({
                success: true,
                data: fallbackReply,
                source: 'fallback'
            });

        } catch (error) {
            console.error('Lỗi ChatBot Full:', error);
            
            // Luôn đảm bảo phản hồi thân thiện thay vì làm gián đoạn người dùng
            return res.status(200).json({
                success: true,
                data: getSmartFallbackReply(''),
                source: 'fallback_recovery'
            });
        }
    }
}

module.exports = ChatBotController;
