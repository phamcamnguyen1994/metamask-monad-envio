import { createPublicClient, http, parseAbi } from "viem";
import { monadTestnet } from "./chain";

// Fallback indexer khi Envio chưa sẵn sàng
export class BlockchainIndexer {
  private client = createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0])
  });

  private erc20Abi = parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]);

  async getTransfers(
    tokenAddress: `0x${string}`,
    fromBlock: bigint = BigInt(0),
    toBlock: bigint | "latest" = "latest"
  ) {
    try {
      const logs = await this.client.getLogs({
        address: tokenAddress,
        event: this.erc20Abi[0], // Transfer event
        fromBlock,
        toBlock: toBlock === "latest" ? "latest" : toBlock
      });

      return logs.map(log => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        from: log.args.from as string,
        to: log.args.to as string,
        value: log.args.value as bigint,
        token: tokenAddress,
        timestamp: BigInt(log.blockNumber), // Approximate timestamp
        txHash: log.transactionHash,
        blockNumber: log.blockNumber
      }));
    } catch (error) {
      console.error("Error fetching transfers:", error);
      return [];
    }
  }

  async getTransfersForAddress(
    tokenAddress: `0x${string}`,
    address: string,
    fromBlock: bigint = BigInt(0)
  ) {
    const allTransfers = await this.getTransfers(tokenAddress, fromBlock);
    return allTransfers.filter(
      transfer => 
        transfer.from.toLowerCase() === address.toLowerCase() ||
        transfer.to.toLowerCase() === address.toLowerCase()
    );
  }
}

// Singleton instance
export const blockchainIndexer = new BlockchainIndexer();

