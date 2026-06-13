require('dotenv').config();
const { callGroq } = require('./server/utils/groq-rotator');

async function testClassifier() {
  const history = [
    { role: 'user', content: 'hoàng sa trường sa là của nước nào' },
    { role: 'assistant', content: 'Hoàng Sa và Trường Sa là hai quần đảo thuộc chủ quyền của Việt Nam. Tuy nhiên, hiện tại có một số quốc gia khác cũng đang tranh chấp chủ quyền đối với hai quần đảo này. Nếu bạn muốn biết thêm thông tin về lịch sử, địa lý và tình hình hiện tại của Hoàng Sa và Trường Sa, mình có thể giúp bạn!' }
  ];

  const message = 'có';

  const systemContent = `Bạn là bộ não phân tích ý định người dùng của hệ thống WanderViet AI - nền tảng du lịch Việt Nam.
Hãy phân tích NGỮ CẢNH TOÀN VẸN, không đọc từng từ riêng lẻ. Dựa trên lịch sử hội thoại (nếu có) để hiểu rõ ngữ cảnh của tin nhắn mới nhất.

QUY TẮC QUAN TRỌNG NHẤT (BẮT BUỘC):
- Nếu tin nhắn chứa TÊN ĐỊA DANH (tỉnh, thành, di tích, địa điểm), hoặc các từ liên quan LỊCH TRÌNH/DU LỊCH (lịch, ngày, tour, biển, núi, rừng, khách sạn, ăn uống, tham quan...) → isOffTopic PHẢI là false.
- Nếu tin nhắn mới nhất là câu trả lời hoặc phản hồi nối tiếp cho câu hỏi trước đó của trợ lý (ví dụ: trợ lý hỏi "bạn có muốn...", "mình có thể giúp gì...", người dùng trả lời "có", "đồng ý", "muốn", "ok", v.v.) thì đây là câu trả lời hợp lệ liên quan đến chủ đề đang thảo luận → isOffTopic PHẢI là false.
- Nếu isItineraryRequest là true HOẶC destination không phải null → isOffTopic PHẢI là false. Không được có mâu thuẫn.
- "lập lịch", "tạo lịch", "lên kế hoạch", "đi chơi", "đi du lịch", "đi biển", "đi núi" → isItineraryRequest: true, isOffTopic: false.
- Chỉ đặt isOffTopic: true khi câu hỏi HOÀN TOÀN không liên quan du lịch: toán học, lập trình code, y tế bệnh viện, chính trị, chứng khoán..."
| PHÂN BIỆT "ĐI" (động từ thường) vs "ĐI" (chỉ địa điểm du lịch): Câu hỏi có động từ như "học", "làm", "kiếm tiền", "chữa bệnh", "thi", "ôn bài" KẾT HỢP với "đi" → KHÔNG phải du lịch → isOffTopic: true.

Trả về duy nhất định dạng JSON:
{
  "isSensitive": boolean,
  "isOffTopic": boolean,
  "isItineraryRequest": boolean,
  "destination": string | null,
  "days": number | null,
  "budget": number | null
}`;

  const messages = [
    { role: 'system', content: systemContent },
    ...history,
    { role: 'user', content: `Tin nhắn: "${message}"` }
  ];

  console.log("Calling Groq LLaMA-3.1-8B...");
  const completion = await callGroq('user_chatbot', {
    messages,
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });

  console.log("Result:", completion.choices[0].message.content);
}

testClassifier().catch(console.error);
