# Splitly Infrastructure

## Region

Triển khai stack ở `ap-southeast-1` cho Singapore.

## Tạo stack

1. Mở AWS CloudFormation.
2. Chọn `Create stack` > `With new resources (standard)`.
3. Upload file `infrastructure/template.yaml`.
4. Điền các parameter cần thiết.
5. Ở phần capabilities, phải tick:
   - `I acknowledge that AWS CloudFormation might create IAM resources`
6. Tạo stack và chờ trạng thái `CREATE_COMPLETE`.

## Cập nhật stack

1. Chọn stack hiện có.
2. Chọn `Update`.
3. Upload template mới nếu có thay đổi.
4. Rà lại parameter, đặc biệt `AlarmEmail`, `SecretArn`, `InstanceType`, và `AllowBackendPortIngress`.
5. Tiếp tục update và theo dõi trạng thái đến khi `UPDATE_COMPLETE`.

## Parameters cần nhập

- `EnvironmentName`
- `InstanceType`
- `LatestAmiId`
- `ReceiptBucketName`
- `ReceiptPrefix`
- `BackendPort`
- `AlarmEmail`
- `SecretArn`
- `AllowBackendPortIngress`

## Kiểm tra stack

- Vào tab `Events` để xem tiến trình.
- Xác nhận trạng thái cuối là `CREATE_COMPLETE`.
- Nếu có lỗi, kiểm tra mục `Status reason`.

## Kết nối EC2 bằng Session Manager

1. Mở EC2 instance từ stack output.
2. Dùng Systems Manager Session Manager để mở shell.
3. Hoặc chạy lệnh output `SessionManagerCommand`.

## Deploy backend thủ công

1. Kết nối vào instance bằng Session Manager.
2. Clone backend vào `/opt/splitly/backend`.
3. Chạy `npm ci`.
4. Chạy `npm run build`.
5. Khởi động app bằng PM2.
6. Backend nên lắng nghe trên `127.0.0.1` hoặc `0.0.0.0` tại port `5000`.
7. Chạy `pm2 startup` và `pm2 save`.
8. Không lưu AWS access key trong `.env`.

## Xem Elastic IP

- Kiểm tra output `ElasticIp` hoặc `BackendHttpUrl`.

## Xác nhận SNS email subscription

- Nếu nhập `AlarmEmail`, AWS sẽ tạo subscription email.
- Bạn cần bấm link xác nhận trong email từ SNS.

## Kiểm tra CloudWatch Logs

- Log group: `/splitly/{EnvironmentName}/backend`
- Kiểm tra các stream cho:
  - `/var/log/splitly-user-data.log`
  - `/var/log/nginx/access.log`
  - `/var/log/nginx/error.log`
  - `/var/log/splitly/backend.log`

## Xóa stack

1. Chọn stack.
2. Chọn `Delete`.
3. Chờ xóa hoàn tất.

Lưu ý: xóa stack sẽ xóa EC2, VPC, Elastic IP, Security Group và các tài nguyên mạng do stack tạo, nhưng không xóa bucket `splitly-s3`.

## Lỗi thường gặp

### Template format error

- Kiểm tra YAML indentation.
- Đảm bảo không có tab.
- Đảm bảo các logical ID và `!Ref` hợp lệ.

### UPDATE_ROLLBACK_COMPLETE

- Xem `Events` để tìm resource lỗi.
- Sửa template hoặc parameter rồi update lại.

### Session Manager not connected

- Kiểm tra instance profile có `AmazonSSMManagedInstanceCore`.
- Kiểm tra EC2 có outbound internet.
- Đợi vài phút cho agent đăng ký.

### Nginx 502 Bad Gateway

- Kiểm tra backend đã chạy trên đúng port `5000`.
- Xác nhận PM2 đang giữ process sống.
- Xem log `/var/log/splitly/backend.log`.

### CloudWatch Agent không có log

- Kiểm tra file config agent.
- Xác nhận agent đã được enable và start.
- Đảm bảo file log tồn tại và có dữ liệu.

### EC2 không kết nối MongoDB Atlas

- Kiểm tra IP public của EC2 đã được whitelist trên Atlas.
- Kiểm tra security group outbound.
- Kiểm tra secret `SecretArn` và biến môi trường backend.
