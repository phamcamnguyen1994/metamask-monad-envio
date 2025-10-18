"use client";

import { useState } from "react";

export default function DelegationManager() {
  const [imported, setImported] = useState(false);

  const handleExport = () => {
    const delegations = localStorage.getItem('delegations') || '[]';
    const blob = new Blob([delegations], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delegations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        const parsed = JSON.parse(data);
        localStorage.setItem('delegations', JSON.stringify(parsed));
        setImported(true);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        alert('Invalid delegation file');
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (confirm('Clear all delegations?')) {
      localStorage.removeItem('delegations');
      window.location.reload();
    }
  };

  return (
    <div style={{
      padding: "16px",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      border: "1px solid #e9ecef",
      marginBottom: "20px"
    }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>
        Delegation Management
      </h4>
      
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleExport}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          📥 Export Delegations
        </button>

        <label style={{
          padding: "8px 16px",
          backgroundColor: "#28a745",
          color: "white",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "14px"
        }}>
          📤 Import Delegations
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
          />
        </label>

        <button
          onClick={handleClear}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          🗑️ Clear All
        </button>
      </div>

      {imported && (
        <div style={{
          marginTop: "12px",
          padding: "12px",
          backgroundColor: "#d4edda",
          color: "#155724",
          borderRadius: "6px",
          fontSize: "14px"
        }}>
          ✅ Delegations imported! Refreshing page...
        </div>
      )}

      <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#666" }}>
        Export delegations to share with delegate on another device, or import delegations received from delegator.
      </p>
    </div>
  );
}

