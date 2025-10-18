import BalanceChecker from "@/components/BalanceChecker";

export default function BalanceCheckerPage() {
  return (
    <div>
      <h2>Balance Checker</h2>
      <p>Inspect the mUSDC balance for any address on the Monad testnet.</p>

      <BalanceChecker />

      <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <h4>Usage tips</h4>
        <ul>
          <li>
            <strong>Deployer address:</strong> The token deployer holds 1,000,000 mUSDC and is useful for testing.
          </li>
          <li>
            <strong>Other addresses:</strong> Expect a balance of 0 unless tokens have been minted or transferred.
          </li>
          <li>
            <strong>Token address:</strong> 0x3A13C20987Ac0e6840d9CB6e917085F72D17E698
          </li>
        </ul>
      </div>
    </div>
  );
}
