# Deploy mUSDC Token

## Cách 1: Sử dụng JavaScript (Khuyến nghị)

```bash
# Cài đặt dependencies
npm install

# Tạo file .env
cp env.example .env
# Điền:
# MONAD_RPC_URL=https://rpc.monad.testnet
# MONAD_CHAIN_ID=20143
# DEPLOY_PK=0x... (private key của bạn)

# Compile contracts
npx hardhat compile

# Deploy
npx hardhat run scripts/deploy.js --network monad
```

## Cách 2: Sử dụng TypeScript

```bash
# Cài đặt thêm TypeScript dependencies
npm install typescript ts-node

# Deploy với TypeScript
npx hardhat run scripts/deploy.ts --network monad
```

## Kết quả mong đợi

```
mUSDC deployed: 0x1234567890abcdef...
```

Ghi lại địa chỉ contract này và điền vào:
- `USDC_TEST` trong web app (.env)
- `MUSDC_ADDRESS` trong envio (.env)

## Troubleshooting

### Lỗi "Unknown file extension .ts":
- Sử dụng `deploy.js` thay vì `deploy.ts`
- Hoặc cài đặt `ts-node`: `npm install ts-node`

### Lỗi RPC:
- Kiểm tra `MONAD_RPC_URL` có hoạt động
- Đảm bảo có đủ MON để deploy

### Lỗi private key:
- Đảm bảo `DEPLOY_PK` đúng format (0x...)
- Đảm bảo ví có đủ MON để deploy

