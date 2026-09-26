BCHQS CHỈ HUY PWA V0.5 - GIAO DIỆN DỄ NHÌN
============================================

Bản V0.5 giữ nguyên cơ chế mở file .json mã hóa của V0.4 và làm lại giao diện điện thoại.

NÂNG CẤP GIAO DIỆN
- Chữ, nút và thẻ công việc lớn hơn, dễ bấm trên iPhone.
- Tổng quan 4 ô rõ: Đang xử lý / Sắp đến hạn / Quá hạn / Cảnh báo.
- Văn bản đến và nhiệm vụ có nhãn riêng.
- Hạn xử lý tự nhấn mạnh: còn bao lâu / quá bao lâu.
- Thêm lọc nhanh: Tất cả / VB đến / Quá hạn / Sắp hạn / Đã xong.
- Danh sách tự ưu tiên Quá hạn -> Sắp hạn -> Đang xử lý -> Đã xong.
- Thanh điều hướng dưới lớn và dễ nhận biết hơn.
- Popup chi tiết dạng bottom-sheet gọn hơn.
- Vẫn khóa pinch zoom/double tap zoom như các bản trước.

CẬP NHẬT GITHUB PAGES
1. Xóa/chép đè toàn bộ file của bản PWA cũ bằng nội dung gói V0.5.
2. Giữ nguyên cấu trúc thư mục icons.
3. Commit/push lên branch đang dùng cho GitHub Pages.
4. Mở URL GitHub Pages bằng Safari một lần khi có mạng.
5. Đóng app đã cài ở Màn hình chính rồi mở lại. Service Worker V0.5 sẽ thay cache cũ.

BẢO MẬT
- Không tải file dữ liệu thật lên GitHub.
- Không đưa mật khẩu vào source code.
- File .json vẫn là gói BCHQS mã hóa AES-256-GCM; giao diện V0.5 không làm thay đổi định dạng mã hóa.
