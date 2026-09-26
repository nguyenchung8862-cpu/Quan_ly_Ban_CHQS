BCHQS CHỈ HUY PWA V0.7 - GITHUB ONLY
====================================

MÔ HÌNH
Máy BCHQS OFFLINE -> xuất JSON mã hóa -> 1 điện thoại MÁY ĐỒNG BỘ -> GitHub -> các điện thoại Chỉ huy tự nhận.

KHÔNG CẦN CLOUDFLARE. KHÔNG CẦN SERVER INTERNET RIÊNG.

CÀI ĐẶT
1. Chép TOÀN BỘ các file trong gói này lên repository GitHub Pages đang chạy app Chỉ huy.
2. Repository nên để PUBLIC. File data/latest.json chỉ chứa gói BCHQS đã mã hóa.
3. Trên iPhone mở lại GitHub Pages rồi Add to Home Screen.

MÁY ĐỒNG BỘ - CHỈ 1 ĐIỆN THOẠI
1. Tạo GitHub Fine-grained Personal Access Token.
2. Chỉ cấp quyền repository đang dùng cho PWA và quyền Contents: Read and write.
3. Trong app bấm nút đám mây.
4. Tích "Đây là Máy đồng bộ".
5. Nhập token và Lưu.
6. Nhập file JSON từ máy BCHQS và mở khóa. App tự đưa nguyên file JSON mã hóa lên data/latest.json.

CÁC MÁY CHỈ HUY KHÁC
- Nếu app chạy bằng đường dẫn chuẩn username.github.io/repository/ thì GitHub user + repository được nhận tự động.
- Không cần token.
- Bật "Ghi nhớ mật khẩu dữ liệu" trên máy tin cậy và mở khóa một lần.
- Từ đó chỉ cần mở app. App tự kiểm tra GitHub và tự hiển thị bản mới.

LƯU Ý BẢO MẬT
- Máy tính BCHQS không kết nối Internet.
- Không upload Word/PDF/Excel hoặc file đính kèm.
- GitHub chỉ nhận JSON đã mã hóa AES-256-GCM.
- Token GitHub chỉ nhập trên Máy đồng bộ.
- Vì repository là Public, file mã hóa có thể bị tải về; phải dùng mật khẩu dữ liệu mạnh và không chia sẻ mật khẩu công khai.

4 Ô TỔNG QUAN BẤM ĐƯỢC
- Đang xử lý -> danh sách chưa hoàn thành
- Sắp đến hạn -> lọc sắp hạn
- Quá hạn -> lọc quá hạn
- Cảnh báo -> mở trang cảnh báo
