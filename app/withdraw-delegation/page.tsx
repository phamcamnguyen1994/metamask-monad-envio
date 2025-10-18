import DelegationWithdraw from "@/components/DelegationWithdraw";
import DelegationManager from "@/components/DelegationManager";

export default function WithdrawDelegationPage() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "600" }}>Redeem Delegation</h2>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Use your delegation permission to redeem tokens from the delegator's Smart Account.
        </p>
      </div>
      
      <DelegationManager />
      
      <div style={{ 
        padding: "16px", 
        backgroundColor: "#e3f2fd", 
        borderRadius: "8px",
        marginBottom: "24px",
        border: "1px solid #2196f3"
      }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#0d47a1" }}>
          <strong>💡 Cross-Device:</strong> If delegate is on another device, export delegation from delegator and import here.
        </p>
      </div>
      
      <DelegationWithdraw />
    </div>
  );
}
