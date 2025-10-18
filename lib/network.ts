import { monadTestnet } from "./chain";

export async function switchToMonadNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask không được cài đặt");
  }

  try {
    // Kiểm tra chain hiện tại
    const currentChainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    const monadChainId = `0x${monadTestnet.id.toString(16)}`;

    if (currentChainId !== monadChainId) {
      console.log(`Current chain: ${currentChainId}, Target chain: ${monadChainId}`);
      
      try {
        // Thử chuyển network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: monadChainId }],
        });
      } catch (switchError: any) {
        // Nếu network chưa được thêm, thêm network
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: monadChainId,
                chainName: "Monad Testnet",
                nativeCurrency: {
                  name: "MON",
                  symbol: "MON",
                  decimals: 18,
                },
                rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
                blockExplorerUrls: ["https://testnet-explorer.monad.xyz/"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch (error: any) {
    console.error("Error switching to Monad network:", error);
    throw new Error(`Không thể chuyển sang Monad Testnet: ${error.message}`);
  }
}

export async function getCurrentNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  try {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    
    return {
      chainId: parseInt(chainId, 16),
      isMonad: parseInt(chainId, 16) === monadTestnet.id
    };
  } catch (error) {
    console.error("Error getting current network:", error);
    return null;
  }
}
