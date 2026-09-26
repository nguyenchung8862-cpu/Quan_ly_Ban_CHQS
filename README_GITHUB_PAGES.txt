BCHQS CHỈ HUY PWA V0.3 - TƯƠNG THÍCH FILE TẢI QUA ZALO

BCHQS CHỈ HUY PWA V0.2 - GITHUB PAGES
=====================================

MỤC ĐÍCH
- Chạy giao diện PWA trên GitHub Pages bằng HTTPS.
- GitHub chỉ lưu mã giao diện của ứng dụng.
- KHÔNG tải file .bgm, mật khẩu hoặc dữ liệu BCHQS lên repository.
- File .bgm được người dùng chọn từ iPhone và giải mã cục bộ trên thiết bị.

CÁCH ĐƯA LÊN GITHUB
1. Tạo một repository mới, ví dụ: bchqs-chi-huy.
2. Đưa TOÀN BỘ nội dung trong thư mục này lên thư mục gốc của repository:
   index.html, app.js, style.css, sw.js, manifest.webmanifest, .nojekyll, 404.html và thư mục icons.
3. Vào Settings > Pages.
4. Chọn Deploy from a branch.
5. Branch: main, Folder: /(root), rồi Save.
6. Sau khi GitHub Pages xuất bản, địa chỉ thường có dạng:
   https://TEN_TAI_KHOAN.github.io/bchqs-chi-huy/

CÀI TRÊN IPHONE
1. Mở đúng địa chỉ GitHub Pages bằng Safari.
2. Nhấn Chia sẻ (Share).
3. Chọn Thêm vào Màn hình chính (Add to Home Screen).
4. Mở biểu tượng BCHQS Chỉ huy ít nhất 1 lần khi có Internet để Service Worker cache giao diện.
5. Sau đó có thể mở app khi ngoại tuyến và nhập file .bgm từ ứng dụng Files.

BẢO MẬT
- Không đưa file .bgm thật lên GitHub.
- Không ghi mật khẩu vào source code, README hoặc repository.
- Nên dùng mật khẩu dài, khó đoán cho từng gói dữ liệu.
- Repository public chỉ làm lộ mã nguồn giao diện, không làm lộ dữ liệu nếu file .bgm và mật khẩu không được upload.

GHI CHÚ
- App khóa pinch-zoom/double-tap zoom trong giao diện như bản V0.1.
- Dữ liệu giải mã không được gửi lên GitHub Pages.


V0.3: Không bắt buộc tên file phải có đuôi .bgm. Ứng dụng kiểm tra chữ ký nội dung BCHQS_BGM_ENCRYPTED nên file tải qua Zalo bị đổi tên/đuôi vẫn có thể mở nếu nội dung không bị thay đổi.
