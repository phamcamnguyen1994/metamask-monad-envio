/**
 * IPFS Storage for Delegations
 * Lưu delegation trên IPFS (decentralized storage)
 */

export async function storeDelegationOnIPFS(delegation: any) {
  try {
    console.log("💾 Storing delegation on IPFS...");
    
    // Upload delegation to IPFS
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
        'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '',
      },
      body: JSON.stringify({
        pinataContent: delegation,
        pinataMetadata: {
          name: `delegation-${delegation.id}`,
        },
      }),
    });

    const result = await response.json();
    const ipfsHash = result.IpfsHash;

    console.log(`✅ Delegation stored on IPFS: ${ipfsHash}`);
    return ipfsHash;

  } catch (error: any) {
    console.error("❌ Failed to store delegation on IPFS:", error);
    throw error;
  }
}

export async function getDelegationFromIPFS(ipfsHash: string) {
  try {
    console.log("📖 Reading delegation from IPFS...");
    
    // Fetch delegation from IPFS
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    const delegation = await response.json();

    console.log("✅ Delegation loaded from IPFS");
    return delegation;

  } catch (error: any) {
    console.error("❌ Failed to read delegation from IPFS:", error);
    return null;
  }
}

/**
 * Simple IPFS alternative using public gateway
 */
export async function storeDelegationOnIPFSSimple(delegation: any) {
  try {
    console.log("💾 Storing delegation on IPFS (simple)...");
    
    // Use public IPFS gateway
    const response = await fetch('https://ipfs.io/api/v0/add', {
      method: 'POST',
      body: JSON.stringify(delegation),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    const ipfsHash = result.Hash;

    console.log(`✅ Delegation stored on IPFS: ${ipfsHash}`);
    return ipfsHash;

  } catch (error: any) {
    console.error("❌ Failed to store delegation on IPFS:", error);
    throw error;
  }
}


