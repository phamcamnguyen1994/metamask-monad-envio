# 📋 Events Summary - Envio Indexer

Tổng hợp các events được index từ smart contracts trên Monad testnet.

---

## 📊 Contract Overview

### 1. MonUSDC Token
**Address:** `0x3A13C20987Ac0e6840d9CB6e917085F72D17E698`

**Events:**
- ✅ `Transfer(address indexed from, address indexed to, uint256 value)`

**Purpose:** Track all mUSDC token transfers

**Data Indexed:**
- Sender address
- Receiver address
- Transfer amount
- Block number & timestamp
- Transaction hash

---

### 2. DelegationManager
**Address:** `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`

**Events:**

#### ✅ EnabledDelegation
```solidity
event EnabledDelegation(
  bytes32 indexed delegationHash,
  address indexed delegator,
  address indexed delegate,
  tuple delegation
)
```

**Purpose:** Track when new delegations are created

**Data Indexed:**
- Delegation hash (unique ID)
- Delegator address
- Delegate address
- Creation timestamp
- Block number
- Transaction hash
- Status: "ACTIVE"

---

#### ✅ RedeemedDelegation
```solidity
event RedeemedDelegation(
  address indexed rootDelegator,
  address indexed redeemer,
  tuple delegation
)
```

**Purpose:** Track when delegations are redeemed/used

**Data Indexed:**
- Root delegator address
- Redeemer address (delegate)
- Block number & timestamp
- Transaction hash

---

#### ✅ DisabledDelegation
```solidity
event DisabledDelegation(
  bytes32 indexed delegationHash,
  address indexed delegator,
  address indexed delegate,
  tuple delegation
)
```

**Purpose:** Track when delegations are disabled/revoked

**Action:** Update delegation status to "DISABLED"

---

## 🎯 Use Cases

### For Users
1. **Track Active Delegations**: See all delegations you've created or received
2. **Monitor Redemptions**: View history of token redemptions
3. **Check Status**: Verify if delegation is ACTIVE or DISABLED

### For Dashboard
1. **Real-time Updates**: Auto-refresh delegation activity
2. **Historical Data**: Query past delegations and redemptions
3. **Analytics**: Calculate total volume, active delegations, etc.

---

## 📈 GraphQL Queries

### Get Recent Transfers
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

### Get Active Delegations for User
```graphql
query GetUserDelegations($address: String!) {
  Delegation(
    where: { 
      _or: [
        { delegator: { _eq: $address } }
        { delegate: { _eq: $address } }
      ]
      status: { _eq: "ACTIVE" }
    }
    order_by: { createdAt: desc }
  ) {
    id
    delegationHash
    delegator
    delegate
    createdAt
    status
    transactionHash
  }
}
```

### Get Redemption History
```graphql
query GetRedemptions($address: String!) {
  Redemption(
    where: {
      _or: [
        { delegator: { _eq: $address } }
        { redeemer: { _eq: $address } }
      ]
    }
    order_by: { blockTimestamp: desc }
    limit: 20
  ) {
    id
    delegator
    redeemer
    blockTimestamp
    transactionHash
  }
}
```

---

## 🚀 Deployment Checklist

- [x] mUSDC contract ABI added
- [x] DelegationManager ABI added
- [x] Contract addresses configured
- [x] Schema entities defined
- [x] Event handlers implemented
- [ ] Run `envio codegen`
- [ ] Test locally with `envio dev`
- [ ] Deploy to Envio Cloud
- [ ] Update web app with GraphQL endpoint

---

## ✅ Expected Results

After successful deployment:

1. **GraphQL Endpoint**: `https://indexer.dev.hyperindex.xyz/<YOUR_ID>/v1/graphql`
2. **Events Indexed**: 
   - mUSDC Transfers ✅
   - Delegations Created ✅
   - Delegations Redeemed ✅
   - Delegations Disabled ✅
3. **Dashboard Integration**: Real-time activity tracking

---

**All events configured and ready for indexing! 🎉**


