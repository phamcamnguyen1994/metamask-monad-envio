export default function Home() {
  return (
    <div>
      <div
        style={{
          padding: 24,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 12,
          color: "white",
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: "0 0 12px 0", fontSize: "28px" }}>MetaMask Smart Account Demo</h2>
        <p style={{ margin: 0, fontSize: "16px", opacity: 0.95 }}>
          Create Smart Accounts, sign delegations with spending limits, and transfer tokens on Monad testnet. Powered by Envio indexer.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: 24,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            border: "2px solid #667eea",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#495057", fontSize: "20px" }}>1. Create Delegation</h3>
          <p style={{ margin: "0 0 16px 0", color: "#6c757d", lineHeight: "1.6" }}>
            Deploy a Smart Account, fund it with mUSDC, and create a delegation with spending limits for a trusted delegate.
          </p>
          <a
            href="/subscription"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#667eea",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Start Here →
          </a>
        </div>

        <div
          style={{
            padding: 24,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            border: "2px solid #28a745",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#495057", fontSize: "20px" }}>2. Redeem Delegation</h3>
          <p style={{ margin: "0 0 16px 0", color: "#6c757d", lineHeight: "1.6" }}>
            As a delegate, use your delegation permission to redeem tokens from the delegator's Smart Account.
          </p>
          <a
            href="/withdraw-delegation"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Redeem →
          </a>
        </div>

        <div
          style={{
            padding: 24,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            border: "2px solid #007bff",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#495057", fontSize: "20px" }}>3. Monitor Activity</h3>
          <p style={{ margin: "0 0 16px 0", color: "#6c757d", lineHeight: "1.6" }}>
            View real-time delegation and redemption activity powered by Envio indexer on Monad testnet.
          </p>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            Dashboard →
          </a>
        </div>
      </div>

      <div
        style={{
          padding: 24,
          backgroundColor: "#e8f5e8",
          borderRadius: 12,
          marginBottom: 32,
          border: "2px solid #28a745",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", color: "#2f855a", fontSize: "20px" }}>How It Works</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            { title: "Setup", desc: "Connect MetaMask and create a Smart Account on Monad testnet" },
            { title: "Delegate", desc: "Sign a delegation with spending limits using EIP-712 signatures" },
            { title: "Redeem", desc: "Delegate can redeem tokens from delegator's Smart Account" },
            { title: "Monitor", desc: "Track all delegation activity in real-time with Envio indexer" },
          ].map((step, index) => (
            <div key={step.title} style={{ display: "flex", alignItems: "start", gap: 12 }}>
              <span
                style={{
                  display: "inline-block",
                  minWidth: 28,
                  height: 28,
                  backgroundColor: "#28a745",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "28px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <div>
                <strong style={{ color: "#2f855a" }}>{step.title}:</strong> {step.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 24,
          backgroundColor: "#f0f8ff",
          borderRadius: 12,
          marginBottom: 32,
          border: "2px solid #007bff",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "#0066cc", fontSize: "22px" }}>📖 Usage Guide</h3>
        <div style={{ display: "grid", gap: 20 }}>
          <div
            style={{
              padding: 20,
              backgroundColor: "white",
              borderRadius: 8,
              border: "1px solid #e3f2fd",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "18px" }}>🚀 Getting Started</h4>
            <ol style={{ margin: 0, paddingLeft: 20, color: "#424242", lineHeight: "1.6" }}>
              <li>Connect your MetaMask wallet to Monad Testnet</li>
              <li>Get testnet mUSDC tokens from the faucet</li>
              <li>Deploy your Smart Account (one-time setup)</li>
              <li>Fund your Smart Account with mUSDC tokens</li>
            </ol>
          </div>

          <div
            style={{
              padding: 20,
              backgroundColor: "white",
              borderRadius: 8,
              border: "1px solid #e3f2fd",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "18px" }}>💼 Creating Delegations</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#424242", lineHeight: "1.6" }}>
              <li>Specify delegate address (who can redeem tokens)</li>
              <li>Set spending limit (amount per period)</li>
              <li>Choose period duration (daily/weekly/monthly)</li>
              <li>Sign delegation with EIP-712 signature</li>
              <li>Share delegation URL with delegate</li>
            </ul>
          </div>

          <div
            style={{
              padding: 20,
              backgroundColor: "white",
              borderRadius: 8,
              border: "1px solid #e3f2fd",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "18px" }}>💰 Redeeming Delegations</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#424242", lineHeight: "1.6" }}>
              <li>Access delegation via shared URL</li>
              <li>Choose gasless redemption (Pimlico) or direct transfer</li>
              <li>Specify amount to redeem (within limits)</li>
              <li>Approve transaction and receive tokens</li>
              <li>Monitor redemption history in dashboard</li>
            </ul>
          </div>

          <div
            style={{
              padding: 20,
              backgroundColor: "white",
              borderRadius: 8,
              border: "1px solid #e3f2fd",
            }}
          >
            <h4 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "18px" }}>📊 Dashboard Features</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#424242", lineHeight: "1.6" }}>
              <li>View all active delegations and redemptions</li>
              <li>Track spending limits and remaining allowances</li>
              <li>Monitor transaction history and gas usage</li>
              <li>Real-time activity feed (localStorage fallback)</li>
              <li>Account balance and token information</li>
            </ul>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: "#fff3cd",
              borderRadius: 8,
              border: "1px solid #ffeaa7",
            }}
          >
            <p style={{ margin: 0, color: "#856404", fontSize: "14px", fontWeight: "500" }}>
              💡 <strong>Pro Tip:</strong> Use gasless redemption for small amounts to save on gas fees. For larger amounts, direct transfer is more cost-effective.
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 20,
          backgroundColor: "#f8f9fa",
          borderRadius: 12,
          border: "1px solid #dee2e6",
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#495057" }}>Tech Stack</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            fontSize: "14px",
            color: "#495057",
          }}
        >
          <div>
            <strong>Blockchain:</strong> Monad Testnet
          </div>
          <div>
            <strong>Smart Accounts:</strong> MetaMask (Hybrid)
          </div>
          <div>
            <strong>SDK:</strong> Delegation Toolkit
          </div>
          <div>
            <strong>Bundler:</strong> Pimlico
          </div>
          <div>
            <strong>Indexer:</strong> Envio HyperIndex
          </div>
          <div>
            <strong>Token:</strong> mUSDC (ERC-20)
          </div>
        </div>
      </div>
    </div>
  );
}
