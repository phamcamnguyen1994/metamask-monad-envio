"use client";

import { useEffect, useState } from "react";
import { queryDelegations } from "@/lib/envio";

export default function EnvioFeed({ address }: { address: `0x${string}` }) {
  const [data, setData] = useState<{ delegations: any[]; redemptions: any[] }>({ delegations: [], redemptions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stop = false;

    async function load() {
      try {
        setLoading(true);
        const res = await queryDelegations(address);
        if (!stop) setData(res);
      } catch (err) {
        console.error("Failed to load Envio data:", err);
      } finally {
        if (!stop) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5_000); // light polling every 5 seconds
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatAmount = (amount: string | number) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return (num / 1_000_000).toFixed(6);
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
          <div className="envio-section__count">{data.delegations.length}</div>
        </div>
        
        {loading ? (
          <div className="envio-loading">
            <div className="loading-spinner"></div>
            <span>Loading delegations...</span>
          </div>
        ) : data.delegations.length === 0 ? (
          <div className="envio-empty">
            <div className="envio-empty__icon">📋</div>
            <p className="envio-empty__text">No active delegations found</p>
          </div>
        ) : (
          <div className="envio-list">
            {data.delegations.map((delegation) => (
              <div key={delegation.id} className="envio-item">
                <div className="envio-item__header">
                  <div className="envio-badge delegation">Delegation</div>
                  <div className="envio-item__id">#{delegation.id.slice(-8)}</div>
                </div>
                
                <div className="envio-item__content">
                  <div className="envio-details">
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegate</span>
                      <span className="envio-detail__value">{formatAddress(delegation.delegate)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Token</span>
                      <span className="envio-detail__value">{formatAddress(delegation.token)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Period Amount</span>
                      <span className="envio-detail__value amount">{formatAmount(delegation.periodAmount)} mUSDC</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Remaining</span>
                      <span className="envio-detail__value amount">{formatAmount(delegation.remaining)} mUSDC</span>
                    </div>
                    {delegation.lastRedeemedAt && (
                      <div className="envio-detail">
                        <span className="envio-detail__label">Last Redeemed</span>
                        <span className="envio-detail__value">{formatTime(delegation.lastRedeemedAt)}</span>
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
          <div className="envio-section__count">{data.redemptions.length}</div>
        </div>
        
        {loading ? (
          <div className="envio-loading">
            <div className="loading-spinner"></div>
            <span>Loading redemptions...</span>
          </div>
        ) : data.redemptions.length === 0 ? (
          <div className="envio-empty">
            <div className="envio-empty__icon">💸</div>
            <p className="envio-empty__text">No redemption activity yet</p>
          </div>
        ) : (
          <div className="envio-list">
            {data.redemptions.map((redemption) => (
              <div key={redemption.id} className="envio-item">
                <div className="envio-item__header">
                  <div className="envio-badge redemption">Redemption</div>
                  <div className="envio-item__id">#{redemption.id.slice(-8)}</div>
                </div>
                
                <div className="envio-item__content">
                  <div className="envio-details">
                    <div className="envio-detail">
                      <span className="envio-detail__label">Delegate</span>
                      <span className="envio-detail__value">{formatAddress(redemption.delegate)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">To</span>
                      <span className="envio-detail__value">{formatAddress(redemption.to)}</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Amount</span>
                      <span className="envio-detail__value amount">{formatAmount(redemption.amount)} mUSDC</span>
                    </div>
                    <div className="envio-detail">
                      <span className="envio-detail__label">Time</span>
                      <span className="envio-detail__value">{formatTime(redemption.timestamp)}</span>
                    </div>
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
