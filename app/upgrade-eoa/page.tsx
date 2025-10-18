import EIP7702Upgrade from "@/components/EIP7702Upgrade";
import SimpleSmartAccount from "@/components/SimpleSmartAccount";
import TransferUSDC from "@/components/TransferUSDC";

export default function UpgradeEOAPage() {
  return (
    <div>
      <h2>Smart Account Setup</h2>
      <p>Select how you want to prepare a smart account before using delegation features.</p>

      <div style={{ marginBottom: 20, padding: 16, backgroundColor: "#e3f2fd", borderRadius: 8 }}>
        <h4>Recommended: Create a new smart account</h4>
        <p>Instead of upgrading the EOA, create a dedicated smart account and transfer mUSDC into it.</p>
      </div>

      <SimpleSmartAccount />

      <TransferUSDC />

      <div style={{ marginTop: 20, padding: 16, backgroundColor: "#fff3cd", borderRadius: 8 }}>
        <h4>Advanced: Upgrade the existing EOA (EIP-7702)</h4>
        <p>Only use this path if you must keep the same address. MetaMask may still have issues with the flow.</p>
      </div>

      <EIP7702Upgrade />

      <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
        <h4>Step-by-step instructions</h4>
        <ol>
          <li>
            <strong>Connect MetaMask</strong> with the EOA that deployed the token.
          </li>
          <li>
            <strong>Click "Upgrade EOA to Smart Account"</strong> inside the advanced section.
          </li>
          <li>
            <strong>Sign the authorization</strong> in the MetaMask popup.
          </li>
          <li>
            <strong>Confirm the transaction</strong> to submit the EIP-7702 upgrade.
          </li>
          <li>
            <strong>The EOA becomes a smart account</strong> while keeping the same address.
          </li>
          <li>
            <strong>Return to the Subscription page</strong> to create a delegation.
          </li>
        </ol>

        <h4>Important notes</h4>
        <ul>
          <li>
            The EOA and smart account share the <strong>same address</strong> after upgrading.
          </li>
          <li>
            The mUSDC balance is <strong>preserved</strong>.
          </li>
          <li>
            Once upgraded, you can create new <strong>delegations</strong> immediately.
          </li>
          <li>
            The upgrade only needs to happen <strong>once</strong> per account.
          </li>
        </ul>
      </div>
    </div>
  );
}
