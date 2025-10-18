# ⚙️ Envio HyperIndex Setup Guide

Hướng dẫn chi tiết cài đặt và chạy Envio indexer cho dự án MetaMask Delegation trên Monad testnet.

---1

## 📋 Mục tiêu

Index các events từ smart contracts:
- ✅ **MonUSDC**: Transfer events
- 🔄 **DelegationManager**: EnabledDelegation, RedeemedDelegation events (future)

---

## 🧩 Bước 1: Cài Envio CLI

### Cài bằng npm (khuyến nghị)

```bash
npm install -g envio
```

**Yêu cầu:** Node.js ≥ 18

**Kiểm tra version:**
```bash
envio --version
```

**Expected output:**
```
envio 2.x.x
```

---

## 🧱 Bước 2: Khởi tạo project indexer (Đã hoàn thành ✅)

Folder `envio/` đã được setup với:
- ✅ `config.yaml` - Envio configuration
- ✅ `schema.graphql` - GraphQL schema
- ✅ `abis/MonUSDC.json` - mUSDC contract ABI
- ✅ `src/EventHandlers.ts` - Event handlers

**Nếu cần init lại:**
```bash
cd envio
envio init
```

Trả lời các prompts:
| Prompt | Trả lời |
|--------|---------|
| Folder name | `.` (current directory) |
| Language | TypeScript |
| Blockchain ecosystem | Evm |
| Initialization option | Contract Import |
| Import from | Local ABI |
| Path to ABI | `./abis/MonUSDC.json` |
| Select events | Transfer |
| Choose network | Monad Testnet (chainId 10143) |
| Add API token | Add existing → paste API token |

---

## 🧮 Bước 3: Generate indexer code

```bash
cd envio
envio codegen
```

**Kết quả:**
- Tạo folder `generated/` với TypeScript types
- Compile schema.graphql → entities
- Generate event handlers signatures

**Expected output:**
```
>>>> Finish compiling 381 mseconds
✅ Code generation complete
```

---

## 🧠 Bước 4: Kiểm tra cấu hình

### File: `config.yaml`

```yaml
name: metamask-monad-delegation
networks:
  - id: 10143
    name: monad-testnet
    start_block: 0
contracts:
  - name: MonUSDC
    address: 0x3A13C20987Ac0e6840d9CB6e917085F72D17E698
    events:
      - Transfer
```

### File: `schema.graphql`

```graphql
type Transfer @entity {
  id: ID!
  from: String!
  to: String!
  value: BigInt!
  blockTimestamp: BigInt!
  transactionHash: String!
}
```

### File: `src/EventHandlers.ts`

```typescript
MonUSDC.Transfer.handler(async ({ event, context }) => {
  const entity: MonUSDC_Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
    // ... more fields
  };
  context.Transfer.set(entity);
});
```

---

## 🧪 Bước 5: Chạy Envio local (development mode)

```bash
cd envio
envio dev
```

**Envio sẽ:**
1. Spin up local Postgres database
2. Spin up Hasura GraphQL server
3. Compile & auto-reload khi file thay đổi
4. Index events từ blockchain
5. Log output trong terminal

**Đợi đến khi thấy:**
```
✅ Listening on http://localhost:8080/v1/graphql
```

**Test local indexer:**
1. Mở browser: `http://localhost:8080/v1/graphql`
2. Chạy query:
```graphql
query {
  Transfer(limit: 5, order_by: { blockTimestamp: desc }) {
    id
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```

---

## 🌐 Bước 6: Deploy lên Envio Cloud

### 6.1. Push code lên GitHub

**Tạo branch envio:**
```bash
cd envio
git init
git add .
git commit -m "Initial commit: Envio HyperIndex for Monad Delegation"
git branch -M envio
git remote add origin https://github.com/<your-github>/metamask-monad-envio.git
git push -u origin envio
```

**Hoặc push trong repo chính:**
```bash
git add envio/
git commit -m "feat: add Envio indexer configuration"
git push origin main
```

### 6.2. Kết nối trên Envio Dashboard

1. **Đăng nhập**: https://envio.dev/app
2. **Connect GitHub** (lần đầu)
3. **Create New Indexer**
4. **Chọn repository**: `metamask-monad-envio`
5. **Cấu hình:**
   - **Indexer Directory**: `./envio` (nếu trong subfolder) hoặc `./` (nếu ở root)
   - **Config File**: `config.yaml`
   - **Git Release Branch**: `main` (hoặc `envio`)
   - **Plan**: Development (Free)
6. **Click "Deploy"**

### 6.3. Đợi deployment

Envio sẽ tự động:
- Build indexer code
- Deploy lên cloud
- Sync blockchain từ start_block
- Process events

**Thời gian sync:**
- Start từ block 0 trên Monad testnet: ~1-5 phút
- Tùy thuộc số lượng events và current block number

---

## 📡 Bước 7: Kiểm tra indexer hoạt động

### 7.1. Check Envio Dashboard

1. Vào: https://envio.dev/app
2. Chọn indexer của bạn
3. Check:
   - ✅ **Status**: "Synced" (hoặc "Syncing")
   - ✅ **Current Block**: Gần với latest block
   - ✅ **Events Indexed**: Số lượng events đã xử lý
   - ✅ **Sync Progress**: 100%

### 7.2. Test GraphQL Endpoint

**GraphQL URL:**
```
https://indexer.dev.hyperindex.xyz/<YOUR_DEPLOYMENT_ID>/v1/graphql
```

**Example Query:**
```graphql
query {
  Transfer(limit: 10, order_by: { blockTimestamp: desc }) {
    id
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```

**Expected result:**
```json
{
  "data": {
    "Transfer": [
      {
        "id": "10143_5123456_0",
        "from": "0x1bd5...",
        "to": "0xa51D...",
        "value": "10000000",
        "blockTimestamp": "1697123456",
        "transactionHash": "0xabc..."
      }
    ]
  }
}
```

### 7.3. Update Web App

**Thêm GraphQL endpoint vào `.env.local`:**
```env
NEXT_PUBLIC_ENVIO_GRAPHQL=https://indexer.dev.hyperindex.xyz/<YOUR_DEPLOYMENT_ID>/v1/graphql
```

**Hoặc update trên Vercel:**
1. Vercel Dashboard → Settings → Environment Variables
2. Add/Update: `NEXT_PUBLIC_ENVIO_GRAPHQL`
3. Redeploy

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Unknown file extension .ts"

**Giải pháp:**
```bash
npm install ts-node typescript
```

### ❌ Lỗi: RPC connection failed

**Giải pháp:**
- Kiểm tra `rpc_config.url` trong `config.yaml`
- Thử RPC khác: `https://testnet-rpc.monad.xyz`
- Check network connectivity

### ❌ Lỗi: No events found

**Nguyên nhân:**
- `start_block` quá cao
- Contract chưa có transactions
- Events không match với ABI

**Giải pháp:**
- Set `start_block: 0`
- Verify contract address
- Check ABI có events đúng không

### ❌ Sync quá chậm

**Giải pháp:**
- Tăng `start_block` lên block gần đây hơn
- Use HyperSync API token (lấy từ https://envio.dev/api-key)

---

## 🚀 Next Steps: Thêm DelegationManager Events

### Bước 1: Get DelegationManager Address

**Trong browser console:**
```javascript
import { getDeleGatorEnvironment } from '@metamask/delegation-toolkit';
const env = getDeleGatorEnvironment(10143);
console.log('DelegationManager:', env.DelegationManager);
```

### Bước 2: Get DelegationManager ABI

**From SDK:**
```typescript
import { DelegationManager } from '@metamask/delegation-abis';
console.log(DelegationManager.abi);
```

**Save to:**
```bash
envio/abis/DelegationManager.json
```

### Bước 3: Update config.yaml

```yaml
contracts:
  - name: MonUSDC
    # ... existing config

  - name: DelegationManager
    abi_file_path: ./abis/DelegationManager.json
    handler: src/EventHandlers.ts
    address:
      - <DELEGATION_MANAGER_ADDRESS>
    events:
      - event: EnabledDelegation(bytes32 indexed delegationHash, address indexed delegator, address indexed delegate, tuple delegation)
      - event: RedeemedDelegation(address indexed rootDelegator, address indexed redeemer, tuple delegation)
    network: monad-testnet
```

### Bước 4: Update schema.graphql

```graphql
type Delegation @entity {
  id: ID!
  delegator: String!
  delegate: String!
  token: String!
  periodAmount: BigInt!
  createdAt: BigInt!
  status: String!
}

type Redemption @entity {
  id: ID!
  delegator: String!
  delegate: String!
  amount: BigInt!
  timestamp: BigInt!
  txHash: String!
}
```

### Bước 5: Add Event Handlers

**In `src/EventHandlers.ts`:**
```typescript
DelegationManager.EnabledDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_EnabledDelegation = {
    id: event.params.delegationHash,
    delegator: event.params.delegator,
    delegate: event.params.delegate,
    createdAt: BigInt(event.block.timestamp),
    status: "ACTIVE",
  };
  context.Delegation.set(entity);
});

DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const entity: DelegationManager_RedeemedDelegation = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    delegator: event.params.rootDelegator,
    delegate: event.params.redeemer,
    timestamp: BigInt(event.block.timestamp),
    txHash: event.transaction.hash,
  };
  context.Redemption.set(entity);
});
```

### Bước 6: Redeploy

```bash
envio codegen
envio deploy
```

---

## 📊 Monitoring & Debugging

### View Logs

```bash
envio logs --follow
```

### Check Sync Status

```bash
envio status
```

### Reset Indexer (if needed)

```bash
envio reset
```

---

## ✅ Success Criteria

Sau khi setup thành công, bạn sẽ có:

1. ✅ **Local Development**
   - GraphQL playground: `http://localhost:8080/v1/graphql`
   - Query transfers và delegations
   - Auto-reload khi code thay đổi

2. ✅ **Cloud Deployment**
   - Public GraphQL endpoint
   - Real-time blockchain indexing
   - Dashboard monitoring

3. ✅ **Web App Integration**
   - Dashboard hiển thị Envio data
   - Real-time delegation tracking
   - Redemption history

---

## 📚 Resources

- **Envio Docs**: https://docs.envio.dev
- **Envio Dashboard**: https://envio.dev/app
- **API Key**: https://envio.dev/api-key
- **Support**: https://discord.gg/envio

---

**Happy Indexing! 🚀**


