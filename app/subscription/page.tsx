import DelegationForm from "@/components/DelegationForm";
import DelegationManager from "@/components/DelegationManager";

export default function SubscriptionPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "600" }}>Create Delegation</h2>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Create a delegation with spending limits. Share with delegate to allow token redemption.
        </p>
      </div>
      
      <DelegationManager />
      
      <DelegationForm />
    </div>
  );
}
