# Envio HyperIndex for MetaMask Delegation Platform

Real-time blockchain indexer for tracking mUSDC transfers and delegation events on Monad testnet.

## 📦 What Gets Indexed

### Contracts & Events

| Contract | Address | Events | Purpose |
|----------|---------|--------|---------|
| **MonUSDC** | `0x3A13C20987Ac0e6840d9CB6e917085F72D17E698` | `Transfer` | Track mUSDC token transfers |
| **DelegationManager** | `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3` | `EnabledDelegation`<br>`RedeemedDelegation`<br>`DisabledDelegation` | Track delegation lifecycle |

### Entities

- **Transfer**: mUSDC token transfers
- **Delegation**: Created delegations with metadata
- **Redemption**: Delegation redemption history

## 🚀 Quick Start

### 1. Install Envio CLI

```bash
npm install -g envio
```

### 2. Generate Code

```bash
cd envio
envio codegen
```

### 3. Run Locally

```bash
envio dev
# GraphQL: http://localhost:8080/v1/graphql
```

### 4. Deploy to Cloud

```bash
envio deploy
# Or connect via https://envio.dev/app
```

## 📂 Files

- `config.yaml` - Envio configuration
- `schema.graphql` - GraphQL schema definition
- `src/EventHandlers.ts` - Event processing logic
- `abis/MonUSDC.json` - mUSDC contract ABI
- `abis/DelegationManager.json` - DelegationManager contract ABI

## 📚 Documentation

- [ENVIO_SETUP.md](./ENVIO_SETUP.md) - Detailed setup guide
- [EVENTS_SUMMARY.md](./EVENTS_SUMMARY.md) - Events overview & queries

## 🔗 Resources

- **Envio Docs**: https://docs.envio.dev
- **Dashboard**: https://envio.dev/app
- **API Key**: https://envio.dev/api-key


