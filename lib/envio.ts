import fetch from "cross-fetch";
import { blockchainIndexer } from "./blockchain-indexer";
import { USDC_TEST } from "./chain";
import { handleAsync, NetworkError } from "./errorHandler";
import { withCache, performanceMonitor } from "./performance";

const ENVIO_GRAPHQL = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL || process.env.ENVIO_GRAPHQL;

/**
 * Query Envio hoáº·c fallback vá» blockchain indexer
 */
export async function queryDelegations(address: string) {
  // Náº¿u cÃ³ Envio GraphQL endpoint, sá»­ dá»¥ng nÃ³
  if (ENVIO_GRAPHQL) {
    try {
      const q = /* GraphQL */ `
        query($addr: String!) {
          delegations(where: { delegator: $addr }, orderBy: createdAt, orderDirection: desc) {
            id
            delegator
            delegate
            token
            periodAmount
            periodDuration
            startDate
            totalRedeemed
            remaining
            lastRedeemedAt
          }
          redemptions(where: { delegator: $addr }, orderBy: timestamp, orderDirection: desc) {
            id
            delegator
            delegate
            token
            amount
            to
            txHash
            timestamp
          }
        }
      `;

      const res = await fetch(ENVIO_GRAPHQL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, variables: { addr: address.toLowerCase() } })
      });

      if (res.ok) {
        const json = await res.json();
        return json.data ?? { delegations: [], redemptions: [] };
      }
    } catch (error) {
      console.warn("Envio query failed, falling back to blockchain indexer:", error);
    }
  }

  // Fallback: Sá»­ dá»¥ng blockchain indexer
  try {
    const transfers = await blockchainIndexer.getTransfersForAddress(
      USDC_TEST as `0x${string}`,
      address,
      BigInt(0) // Tá»« block 0
    );

    // Chuyá»ƒn Ä‘á»•i transfers thÃ nh format tÆ°Æ¡ng tá»± Envio
    const redemptions = transfers.map(transfer => ({
      id: transfer.id,
      delegator: address,
      delegate: transfer.from, // Giáº£ Ä‘á»‹nh tá»« address lÃ  delegate
      token: transfer.token,
      amount: transfer.value.toString(),
      to: transfer.to,
      txHash: transfer.txHash,
      timestamp: transfer.timestamp.toString()
    }));

    return {
      delegations: [], // ChÆ°a cÃ³ delegation data tá»« blockchain indexer
      redemptions
    };
  } catch (error) {
    console.error("Blockchain indexer failed:", error);
    return { delegations: [], redemptions: [] };
  }
}

/**
 * Query transfers tá»« Envio hoáº·c fallback
 */
// Cached version of queryTransfers
const _queryTransfers = async (limit: number = 10) => {
  const stopTimer = performanceMonitor.startTimer('queryTransfers');
  
  try {
    // Náº¿u cÃ³ Envio GraphQL endpoint, sá»­ dá»¥ng nÃ³
    if (ENVIO_GRAPHQL) {
      const { data, error } = await handleAsync(async () => {
        const q = /* GraphQL */ `
          query($limit: Int!) {
            MUSDC_Transfer(limit: $limit, order_by: {id: desc}) {
              id
              from
              to
              value
            }
          }
        `;

        const res = await fetch(ENVIO_GRAPHQL, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: q, variables: { limit } })
        });

        if (!res.ok) {
          throw new NetworkError(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        const transfers = json.data?.MUSDC_Transfer || [];
        
        // Convert to expected format with mock timestamps
        return transfers.map((t: any) => ({
          ...t,
          blockTimestamp: Math.floor(Date.now() / 1000).toString(),
          transactionHash: t.id.split('_')[2] || '0x',
          blockNumber: t.id.split('_')[1] || '0'
        }));
      }, 'Failed to query Envio');

      if (data) {
        stopTimer();
        return data;
      }
      
      console.warn("Envio transfers query failed, falling back to blockchain indexer:", error);
    }

    // Fallback: Sá»­ dá»¥ng blockchain indexer
    const { data, error } = await handleAsync(async () => {
      const transfers = await blockchainIndexer.getTransfers(
        USDC_TEST as `0x${string}`,
        BigInt(0)
      );

      const limited = transfers.slice(0, limit);

      return limited.map(transfer => ({
        id: transfer.id,
        from: transfer.from,
        to: transfer.to,
        value: transfer.value.toString(),
        blockTimestamp: transfer.timestamp.toString(),
        transactionHash: transfer.txHash,
        blockNumber: transfer.blockNumber.toString()
      }));
    }, 'Failed to query blockchain indexer');

    stopTimer();
    return data || [];
  } catch (error) {
    stopTimer();
    console.error("All query methods failed:", error);
    return [];
  }
};

// Export cached version
export const queryTransfers = withCache(
  _queryTransfers,
  (limit: number) => `transfers_${limit}`,
  10000 // 10 second cache
);
