/**
 * Script export delegations từ localStorage
 * Chạy trong browser console
 */

function exportDelegations() {
  try {
    console.log("📤 Exporting delegations from localStorage...");
    
    // Get delegations from localStorage
    const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
    
    if (delegations.length === 0) {
      console.log("❌ No delegations found in localStorage");
      return;
    }

    console.log(`📋 Found ${delegations.length} delegations`);

    // Show delegations
    delegations.forEach((d, i) => {
      console.log(`\n📄 Delegation ${i + 1}:`);
      console.log(`   Delegator: ${d.delegator}`);
      console.log(`   Delegate: ${d.delegate}`);
      console.log(`   Status: ${d.status}`);
      console.log(`   Created: ${d.createdAt}`);
    });

    // Export as JSON
    const exportData = {
      exportedAt: new Date().toISOString(),
      delegations: delegations,
      count: delegations.length
    };

    // Copy to clipboard
    const jsonString = JSON.stringify(exportData, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonString).then(() => {
        console.log("✅ Delegations copied to clipboard!");
        console.log("💡 Paste into a file to save permanently");
      });
    } else {
      console.log("📋 Copy this JSON data:");
      console.log(jsonString);
    }

    // Also save to file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delegations-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("💾 File downloaded: delegations-[timestamp].json");

  } catch (error) {
    console.error("❌ Export failed:", error);
  }
}

function importDelegations(jsonData) {
  try {
    console.log("📥 Importing delegations...");
    
    let data;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }

    if (!data.delegations || !Array.isArray(data.delegations)) {
      throw new Error("Invalid delegation data format");
    }

    // Clear existing delegations
    localStorage.removeItem('delegations');
    
    // Import new delegations
    localStorage.setItem('delegations', JSON.stringify(data.delegations));
    
    console.log(`✅ Imported ${data.delegations.length} delegations`);
    console.log("🔄 Refresh page to use imported delegations");

  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

// Auto-run export
exportDelegations();

// Export functions for manual use
window.exportDelegations = exportDelegations;
window.importDelegations = importDelegations;
