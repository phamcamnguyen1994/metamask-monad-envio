# 🔍 Debug: Tại sao không đọc được events?

## ✅ Đã fix:
1s11
1. **Thêm DelegationManager.json vào `envio/abis/`** ← Đây là vấn đề chính!
2. Config đã có đủ 2 contracts với handler
3. EventHandlers đã có đúng naming convention

## 🚀 Các bước deploy lại:

### Bước 1: Verify files

```bash
# Check ABIs
ls envio/abis/
# Phải có:
# - MonUSDC.json ✓
# - DelegationManager.json ✓

# Check handlers
cat envio/src/EventHandlers.ts
# Phải có:
# - MonUSDC_Transfer_handler ✓
# - DelegationManager_RedeemedDelegation_handler ✓
# - DelegationManager_EnabledDelegation_handler ✓
```

### Bước 2: Clean và codegen

```bash
cd envio

# Clean cache cũ
rm -rf .envio generated 2>$null

# Generate types mới
envio codegen
```

### Bước 3: Deploy

```bash
# Deploy lên Envio cloud
envio deploy
```

Sau deploy, lưu lại GraphQL endpoint!

### Bước 4: Update env vars

**Vercel:**
1. Dashboard → Settings → Environment Variables
2. Update `NEXT_PUBLIC_ENVIO_GRAPHQL` = endpoint mới
3. Redeploy

**Local:**
```bash
# .env.local
NEXT_PUBLIC_ENVIO_GRAPHQL=https://indexer.dev.hyperindex.xyz/YOUR_NEW_ID/v1/graphql
```

## 🔍 Verify Envio đang hoạt động

### Option 1: GraphQL Playground

Vào: `https://indexer.dev.hyperindex.xyz/YOUR_ID/v1/graphql`

Test query Transfer (nên có data vì đã index từ trước):
```graphql
query {
  Transfer(limit: 5, order_by: { blockTimestamp: desc }) {
    id
    from
    to
    value
    blockTimestamp
  }
}
```

Test query Redemption (sẽ có data sau khi rút delegate):
```graphql
query {
  Redemption(limit: 10, order_by: { timestamp: desc }) {
    id
    delegator
    delegate
    to
    timestamp
  }
}
```

Test query Delegation (sẽ có data sau khi tạo delegation):
```graphql
query {
  Delegation(limit: 10, order_by: { createdAt: desc }) {
    id
    delegator
    delegate
    createdAt
  }
}
```

### Option 2: Check Envio Dashboard

1. Vào https://envio.dev/app
2. Chọn project của bạn
3. Check:
   - **Indexing status**: Phải là "Syncing" hoặc "Synced"
   - **Current block**: Phải tăng dần
   - **Events indexed**: Số lượng events đã xử lý

## 🐛 Nếu vẫn không có dữ liệu:

### Kiểm tra 1: Transactions có emit events không?

Lấy transaction hash của lần rút delegate, search trên block explorer:
- https://explorer.testnet.monad.xyz/

Vào transaction → Logs tab → Tìm:
- Event `RedeemedDelegation` từ contract `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`

Nếu **KHÔNG CÓ** event này → Có vấn đề ở logic rút delegate, không phải Envio!

### Kiểm tra 2: Start block

Config đang set `start_block: 0` → Envio phải index từ block 0.

Để nhanh hơn, tìm block number của delegation đầu tiên:
```yaml
networks:
  - id: 10143
    start_block: 5000000  # Thay số này bằng block của delegation đầu tiên - 1000
```

### Kiểm tra 3: Event signatures

Verify event signatures trong logs có match với config không:

**Config:**
```yaml
- event: RedeemedDelegation(address indexed rootDelegator, address indexed redeemer, tuple delegation)
```

**ABI:**
```json
{
  "name": "RedeemedDelegation",
  "type": "event",
  "inputs": [
    {"name": "rootDelegator", "type": "address", "indexed": true},
    {"name": "redeemer", "type": "address", "indexed": true},
    {"name": "delegation", "type": "tuple", ...}
  ]
}
```

Phải khớp chính xác!

## 💡 Tips

### Nếu cần force re-index:

1. Xóa deployment cũ trên Envio dashboard
2. Deploy lại với config mới
3. Envio sẽ index lại từ đầu

### Nếu cần test local trước:

```bash
cd envio
envio dev
```

Envio sẽ chạy local GraphQL server. Test queries trước khi deploy production.

### Nếu muốn xem logs real-time:

```bash
cd envio
envio logs --follow
```

Sẽ thấy mỗi event được process.

## 📊 Expected timeline

- **Nếu start từ block 0 trên Monad testnet:**
  - Current block: ~5M+
  - Indexing speed: ~10K-50K blocks/phút
  - Thời gian: 1-5 phút để sync xong

- **Nếu start từ block gần đây (vd: 5M):**
  - Thời gian: vài giây đến 1 phút

## ✅ Success criteria

Sau khi deploy thành công, bạn nên thấy:

1. **GraphQL query trả về data:**
   - `Transfer` entities: ✓
   - `Redemption` entities: ✓ (sau khi rút delegate)
   - `Delegation` entities: ✓ (sau khi tạo delegation)

2. **Dashboard hiển thị:**
   - Danh sách delegations
   - Lịch sử redemptions
   - Real-time updates khi có transaction mới

3. **Envio dashboard:**
   - Status: "Synced"
   - Latest block: gần với block hiện tại của chain
   - No errors trong logs

