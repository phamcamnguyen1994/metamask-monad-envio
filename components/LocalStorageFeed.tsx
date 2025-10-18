"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http } from "viem";
import { monadTestnet } from "@/lib/chain";

type Delegation = {
  id: string;
  delegator: string;
  delegate: string;
  token: string;
  allowance: string;
  createdAt: string;
  status: string;
  signature?: string;
};

type RedemptionLog = {
  id: string;
  delegator: string;
  delegate: string;
  amount: string;
  txHash: string;
  timestamp: string;
  blockNumber: string;
};

export default function LocalStorageFeed({ address }: { address: `0x${string}` }) {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;

    async function load() {
      try {
        setLoading(true);

        // 1. Load delegations from localStorage
        const storedDelegations = JSON.parse(localStorage.getItem("delegations") || "[]");
        const userDelegations = storedDelegations.filter(
          (d: any) =>
            d.delegator?.toLowerCase() === address.toLowerCase() ||
            d.delegate?.toLowerCase() === address.toLowerCase()
        );
        
        // Debug log to see delegation structure
        console.log("Raw delegation data:", storedDelegations);
        console.log("Filtered user delegations:", userDelegations);
        if (userDelegations.length > 0) {
          console.log("First delegation structure:", userDelegations[0]);
          console.log("Caveats array:", userDelegations[0].caveats);
          if (userDelegations[0].caveats && userDelegations[0].caveats.length > 0) {
            console.log("First caveat:", userDelegations[0].caveats[0]);
          }
        }

        if (!stop) setDelegations(userDelegations);

        // 2. Load redemption logs from localStorage
        const storedRedemptions = JSON.parse(localStorage.getItem("redemptionHistory") || "[]");
        const userRedemptions = storedRedemptions
          .filter(
            (r: any) =>
              r.delegator?.toLowerCase() === address.toLowerCase() ||
              r.delegate?.toLowerCase() === address.toLowerCase()
          )
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10); // Limit to 10 most recent

        if (!stop) setRedemptions(userRedemptions);

      } catch (err) {
        console.error("Failed to load local storage data:", err);
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5_000); // Refresh every 5 seconds
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [address]);

  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (amount: string | number) => {
    // Debug log to see what we're getting
    console.log("formatAmount input:", amount, "type:", typeof amount);
    
    if (amount === null || amount === undefined || amount === "") {
      console.log("formatAmount: empty value, returning 0");
      return "0";
    }
    
    const num = Number(amount);
    if (isNaN(num)) {
      console.log("formatAmount: NaN, returning 0");
      return "0";
    }
    
    // mUSDC has 6 decimals, so convert from smallest unit to mUSDC
    // 1,000,000 = 1.00 mUSDC
    if (num >= 1_000_000) {
      const converted = (num / 1_000_000).toFixed(2);
      console.log("formatAmount: converted from smallest unit:", num, "to:", converted, "mUSDC");
      return converted;
    }
    
    // For smaller amounts, show as-is
    const result = num.toFixed(2);
    console.log("formatAmount: result:", result);
    return result;
  };

  return (
    <div className="envio-feed">
      {/* Delegations Section */}
      <div className="envio-section">
        <div className="envio-section__header">
          <h4 className="envio-section__title">
            <span className="envio-section__icon">🔄</span>
            Active Delegations
          </h4>
          <div className="envio-section__count">{delegations.length}</div>
        </div>

        {loading ? (
          <div className="envio-loading">
            <div className="loading-spinner"></div>
            <span>Loading delegations...</span>
          </div>
        ) : delegations.length === 0 ? (
          <div className="envio-empty">
            <div className="envio-empty__icon">📋</div>
            <p className="envio-empty__text">No active delegations found</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Create a delegation to get started!
            </p>
          </div>
        ) : (
          <div className="envio-list">
            {delegations.map((delegation) => (
              <div key={delegation.id} className="envio-item">
                <div className="envio-item__header">
                  <div className={`envio-badge ${delegation.status?.toLowerCase()}`}>
                    {delegation.status || "ACTIVE"}
                  </div>
                  <div className="envio-item__id">#{delegation.id.slice(-8)}</div>
                </div>

                <div className="envio-item__content">
                  <div className="envio-details">
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegator</span>
                      <span className="envio-detail__value">{formatAddress(delegation.delegator)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegate</span>
                      <span className="envio-detail__value">{formatAddress(delegation.delegate)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Token</span>
                      <span className="envio-detail__value">mUSDC</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Allowance</span>
                      <span className="envio-detail__value amount">{(() => {
                        // For new delegations, use saved amount
                        if ((delegation as any).amount) {
                          return formatAmount((delegation as any).amount) + " mUSDC";
                        }
                        
                        // For old delegations, try to decode from hex (fallback)
                        const caveats = (delegation as any).caveats;
                        if (caveats && caveats.length > 1) {
                          const hexTerms = caveats[1].terms;
                          if (hexTerms && hexTerms.startsWith('0x')) {
                            const hexWithoutPrefix = hexTerms.slice(2);
                            console.log("Checking hex for delegation:", hexWithoutPrefix);
                            
                            // Look for various amount patterns
                            const patterns = [
                              { hex: '05f5e100', amount: 100000000 }, // 100 mUSDC
                              { hex: '02540be400', amount: 10000000000 }, // 10,000 mUSDC  
                              { hex: '0de0b6b3a7640000', amount: 1000000000000 }, // 1,000,000 mUSDC
                            ];
                            
                            for (const pattern of patterns) {
                              if (hexWithoutPrefix.includes(pattern.hex)) {
                                console.log("Found pattern:", pattern.hex, "amount:", pattern.amount);
                                return formatAmount(pattern.amount) + " mUSDC";
                              }
                            }
                          }
                        }
                        
                        return "Unknown";
                      })()}</span>
                    </div>
                    {delegation.createdAt && (
                      <div className="envio-detail">
                        <span className="envio-detail__label">Created</span>
                        <span className="envio-detail__value">{formatTime(delegation.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redemptions Section */}
      <div className="envio-section">
        <div className="envio-section__header">
          <h4 className="envio-section__title">
            <span className="envio-section__icon">💰</span>
            Recent Redemptions
          </h4>
          <div className="envio-section__count">{redemptions.length}</div>
        </div>

        {loading ? (
          <div className="envio-loading">
            <div className="loading-spinner"></div>
            <span>Loading redemptions...</span>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="envio-empty">
            <div className="envio-empty__icon">💸</div>
            <p className="envio-empty__text">No redemption activity yet</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Withdraw from a delegation to see history here
            </p>
          </div>
        ) : (
          <div className="envio-list">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="envio-item">
                <div className="envio-item__header">
                  <div className="envio-badge redemption">Redemption</div>
                  <div className="envio-item__id">#{redemption.id.slice(-8)}</div>
                </div>

                <div className="envio-item__content">
                  <div className="envio-details">
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegator</span>
                      <span className="envio-detail__value">{formatAddress(redemption.delegator)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegate</span>
                      <span className="envio-detail__value">{formatAddress(redemption.delegate)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Amount</span>
                      <span className="envio-detail__value amount">{formatAmount(redemption.amount)} mUSDC</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Time</span>
                      <span className="envio-detail__value">{formatTime(redemption.timestamp)}</span>
                    </div>
                    {redemption.blockNumber && (
                      <div className="envio-detail">
                        <span className="envio-detail__label">Block</span>
                        <span className="envio-detail__value">#{redemption.blockNumber}</span>
                      </div>
                    )}
                  </div>

                  {redemption.txHash && (
                    <div className="envio-item__footer">
                      <a
                        href={`https://testnet.monadexplorer.com/tx/${redemption.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-link"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V10M10 1H14M14 1V5M14 1L6 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        View Transaction
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

