
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Lấy tư vấn từ trợ lý quân nhu ảo
 * @param query Câu hỏi của người dùng
 * @param context Dữ liệu ngữ cảnh (tồn kho, quân số, v.v.) để AI trả lời chính xác thực tế đơn vị
 */
export const getLogisticsAdvice = async (query: string, context?: string) => {
  try {
    const prompt = context 
      ? `Dữ liệu thực tế đơn vị hiện tại:\n${context}\n\nCâu hỏi của quân nhân: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `Bạn là "Trợ lý ảo Quân nhu" của Quân đội Nhân dân Việt Nam. 
        Nhiệm vụ: 
        1. Giải đáp quy định về tiêu chuẩn quân trang (Thông tư 148, Thông tư 32...).
        2. Phân tích dữ liệu kho (nếu được cung cấp) để cảnh báo hàng sắp hết hoặc cần cấp phát.
        3. Hướng dẫn nghiệp vụ lập phiếu C31-HD, quyết toán quân nhu.
        
        Phong cách: Nghiêm túc, chính xác, ngắn gọn, sử dụng đúng thuật ngữ quân sự (VD: đồng chí, báo cáo, cấp phát, niên hạn).
        Nếu không có dữ liệu thực tế, hãy trả lời dựa trên quy định chung của Bộ Quốc phòng.`,
        temperature: 0.2, // Giảm temperature để câu trả lời chính xác, tránh sáng tạo quá mức
        topP: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Xử lý lỗi cụ thể nếu liên quan đến API Key
    if (error instanceof Error && error.message.includes("API_KEY")) {
      return "Lỗi hệ thống: API Key chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên kỹ thuật.";
    }
    return "Báo cáo: Hệ thống kết nối trợ lý ảo đang gián đoạn. Vui lòng thử lại sau.";
  }
};
