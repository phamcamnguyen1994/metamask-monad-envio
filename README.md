# MetaMask Delegation Platform on Monad

A comprehensive smart account delegation platform that enables users to create, manage, and redeem token delegations on Monad testnet using MetaMask Smart Accounts and Pimlico bundler.

## 🚀 Features

### Core Functionality
- **Smart Account Creation**: Deploy MetaMask Smart Accounts on Monad testnet
- **Token Delegation**: Create delegations with spending limits and time periods
- **Gasless Redemption**: Redeem tokens using Pimlico bundler (gasless transactions)
- **Direct Transfer**: Alternative redemption method for larger amounts
- **Real-time Dashboard**: Monitor all delegation and redemption activity
- **Local Storage Fallback**: Dashboard works even without Envio indexer

### Technical Features
- **Account Abstraction**: Powered by MetaMask Smart Accounts
- **EIP-712 Signatures**: Secure delegation signing
- **Gasless Transactions**: Pimlico bundler integration
- **Real-time Indexing**: Envio HyperIndex integration (with localStorage fallback)
- **Multi-network Support**: Monad testnet integration
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Blockchain** | Monad Testnet |
| **Smart Accounts** | MetaMask (Hybrid) |
| **SDK** | Delegation Toolkit |
| **Bundler** | Pimlico |
| **Indexer** | Envio HyperIndex |
| **Token** | mUSDC (ERC-20) |
| **Frontend** | Next.js 14, React, TypeScript |
| **Styling** | CSS Modules, Tailwind-inspired |
| **Wallet** | MetaMask |

## 📖 Usage Guide

### 🚀 Getting Started

1. **Connect Wallet**
   - Connect your MetaMask wallet to Monad Testnet
   - Get testnet mUSDC tokens from the faucet
   - Deploy your Smart Account (one-time setup)
   - Fund your Smart Account with mUSDC tokens

2. **Create Delegation**
   - Navigate to "Create Delegation" page
   - Specify delegate address (who can redeem tokens)
   - Set spending limit (amount per period)
   - Choose period duration (daily/weekly/monthly)
   - Sign delegation with EIP-712 signature
   - Share delegation URL with delegate

3. **Redeem Delegation**
   - Access delegation via shared URL
   - Choose gasless redemption (Pimlico) or direct transfer
   - Specify amount to redeem (within limits)
   - Approve transaction and receive tokens
   - Monitor redemption history in dashboard

4. **Monitor Activity**
   - View all active delegations and redemptions
   - Track spending limits and remaining allowances
   - Monitor transaction history and gas usage
   - Real-time activity feed (localStorage fallback)
   - Account balance and token information

### 💡 Pro Tips

- **Gasless vs Direct Transfer**: Use gasless redemption for small amounts to save on gas fees. For larger amounts, direct transfer is more cost-effective.
- **Spending Limits**: Set appropriate spending limits based on your trust level with the delegate.
- **Period Management**: Choose period durations that match your delegation needs (daily for frequent use, weekly/monthly for occasional use).

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask wallet
- Monad testnet mUSDC tokens

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Pimlico API Key (required for gasless transactions)
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key

# Monad RPC URL (optional, defaults to Ankr)
MONAD_RPC_URL=your_monad_rpc_url

# Envio GraphQL Endpoint (optional, for indexing)
NEXT_PUBLIC_ENVIO_GRAPHQL=your_envio_graphql_url

# Contract Addresses (pre-configured)
# mUSDC Token: 0x3A13C20987Ac0e6840d9CB6e917085F72D17E698
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd metamask-monad-envio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
metamask-monad-envio/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── subscription/      # Create delegation page
│   ├── withdraw-delegation/ # Redeem delegation page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── DelegationForm.tsx    # Create delegation form
│   ├── DelegationWithdraw.tsx # Redeem delegation form
│   ├── LocalStorageFeed.tsx   # Dashboard activity feed
│   ├── HeaderNav.tsx         # Navigation component
│   └── MetaMaskProvider.tsx  # MetaMask context
├── lib/                   # Utility libraries
│   ├── delegation-simple.ts  # Core delegation logic
│   ├── smartAccount.ts       # Smart account management
│   ├── clients.ts            # RPC client configuration
│   └── network.ts            # Network utilities
├── contracts/             # Smart contracts
│   └── DelegationStorage.sol # Delegation storage contract
└── scripts/               # Utility scripts
    ├── deploy.js          # Contract deployment
    └── check-balance.js   # Balance checking utilities
```

## 🔑 Key Components

### DelegationForm
Creates new delegations with spending limits and time periods.

### DelegationWithdraw
Handles token redemption with gasless and direct transfer options.

### LocalStorageFeed
Displays delegation and redemption activity with localStorage fallback.

### Smart Account Management
- Automatic smart account deployment
- Balance checking and funding
- Transaction signing and submission

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Import project from GitHub
   - Configure environment variables in Vercel dashboard

2. **Required Environment Variables**
   ```
   NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_api_key
   MONAD_RPC_URL=your_monad_rpc_url
   NEXT_PUBLIC_ENVIO_GRAPHQL=your_envio_graphql_url
   ```

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Monitor deployment logs for any issues

### Manual Deployment

```bash
npm run build
npm run start
```

## 🧪 Testing

### Manual Testing

1. **Connect MetaMask** to Monad testnet
2. **Get testnet mUSDC** from faucet
3. **Deploy Smart Account** (one-time)
4. **Create delegation** with test parameters
5. **Redeem delegation** using both gasless and direct methods
6. **Check dashboard** for activity tracking

### Automated Testing

```bash
npm test
```

## 📊 Dashboard Features

### Delegation Activity
- View all active delegations
- Track spending limits and remaining allowances
- Monitor delegation status and creation time
- Filter by delegator/delegate

### Recent Activity
- Real-time redemption history
- Transaction details and gas usage
- Success/failure status tracking
- Local storage fallback when Envio is unavailable

### Account Overview
- Smart account balance
- Token information
- Network status
- Connection details

## 🔒 Security Features

- **EIP-712 Signatures**: Secure delegation signing
- **Spending Limits**: Configurable delegation limits
- **Time Periods**: Delegation expiration management
- **Smart Account Isolation**: Separate accounts for delegation
- **Gasless Transactions**: Secure gasless redemption via Pimlico

## 🌐 Network Support

### Monad Testnet
- **Chain ID**: 10143
- **RPC URL**: https://rpc.ankr.com/monad_testnet
- **Token**: mUSDC (ERC-20)
- **mUSDC Contract**: `0x3A13C20987Ac0e6840d9CB6e917085F72D17E698`
- **Block Explorer**: https://testnet.monad.xyz

## 📈 Performance

- **Local Storage Fallback**: Dashboard works offline
- **Optimized RPC Calls**: Efficient blockchain interactions
- **Cached Data**: Reduced API calls
- **Responsive Design**: Fast loading on all devices

## 🐛 Troubleshooting

### Common Issues

1. **Gasless Transaction Failed**
   - Check Pimlico API key
   - Verify smart account has sufficient balance
   - Try direct transfer as fallback

2. **RPC Connection Issues**
   - Check MONAD_RPC_URL environment variable
   - Verify network connectivity
   - Try different RPC endpoint

3. **Dashboard Not Loading**
   - Check browser console for errors
   - Verify localStorage permissions
   - Clear browser cache

4. **Smart Account Deployment Failed**
   - Ensure MetaMask is connected
   - Check account has sufficient ETH for gas
   - Verify network is Monad testnet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **MetaMask Team** for Smart Account implementation
- **Pimlico** for gasless transaction bundling
- **Envio** for blockchain indexing
- **Monad** for testnet infrastructure

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ for the Monad ecosystem**
