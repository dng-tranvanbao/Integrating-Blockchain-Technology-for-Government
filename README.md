# National Assembly Blockchain Voting System

Hệ thống biểu quyết Quốc hội ứng dụng công nghệ Blockchain giúp đảm bảo tính minh bạch, bất biến và bảo mật danh tính của đại biểu khi bỏ phiếu.

## Yêu cầu hệ thống

1. Node.js (Phiên bản 18 trở lên)
2. Tiện ích mở rộng MetaMask trên trình duyệt

## Hướng dẫn cài đặt và khởi chạy

### Bước 1: Triển khai Smart Contract
Mạng Hardhat local đang được chạy ngầm trên cổng 8545. Để deploy hợp đồng, mở terminal và chạy các lệnh sau:
```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```
Sau khi chạy xong, địa chỉ hợp đồng thông minh mới sẽ tự động được cập nhật sang thư mục frontend.

### Bước 2: Khởi chạy giao diện Frontend
Mở một terminal mới và thực hiện chạy giao diện React:
```bash
cd frontend
npm install
npm run dev
```
Sau đó truy cập đường dẫn hiển thị ở terminal (thường là http://localhost:5173).

### Bước 3: Cấu hình MetaMask kết nối mạng Local
1. Mở MetaMask, chọn thêm mạng thủ công (Add a network manually) và điền các thông tin sau:
   - Tên mạng: Hardhat Local
   - URL RPC: http://127.0.0.1:8545
   - Mã chuỗi (Chain ID): 31337
   - Ký hiệu: GOV
2. Nhấn Lưu và chọn chuyển sang mạng Hardhat Local.

### Bước 4: Nhập tài khoản thử nghiệm vào MetaMask
Để test các quyền biểu quyết hoặc quản trị, hãy nhập (Import) các tài khoản sau vào MetaMask bằng khóa bí mật (Private Key):
- Tài khoản Thư ký (Admin): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- Đại biểu Trần Văn A (Hà Nội): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- Đại biểu Nguyễn Thị B (TP. HCM): `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- Đại biểu Phạm Văn C (Đà Nẵng): `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

## Hướng dẫn trải nghiệm nhanh
1. Ban thư ký (Admin - Tài khoản #0): Mở cổng biểu quyết các dự thảo luật, cấp quyền đại biểu, hoặc tạo dự thảo luật mới.
2. Đại biểu (Delegate - Tài khoản #1, #2, #3): Biểu quyết ẩn danh (Đồng ý, Không đồng ý, Hoặc bỏ phiếu trắng) cho các dự thảo luật đang mở.
3. Người dân/Giám sát viên (Public): Theo dõi thống kê biểu quyết thời gian thực và tra cứu mã băm giao dịch (Transaction Hash) trên blockchain để kiểm toán tính minh bạch.
