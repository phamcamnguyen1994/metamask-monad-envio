"use client";

import { useState, useEffect } from "react";
import EnvioFeed from "@/components/EnvioFeed";
import LocalStorageFeed from "@/components/LocalStorageFeed";
import { queryTransfers } from "@/lib/envio";
import { useMetaMask } from "@/components/MetaMaskProvider";

type Tab = "all" | "delegations";

type Transfer = {
  id: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  blockTimestamp: string | number;
  transactionHash: string;
};

export default function Dashboard() {
  const { account, smartAccount } = useMetaMask();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  // Use connected account or fallback to demo address
  const userAddress = smartAccount?.address || account || "0x1bd5aCb8069DA1051911eB80A37723aA1ce5919C" as `0x${string}`;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load transfers from Envio first
        try {
          const data = await queryTransfers(20);
          setTransfers(data);
        } catch (envioError) {
          console.warn("Envio not available, using localStorage data:", envioError);
          setTransfers([]);
        }

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [userAddress, transfers.length]);

  const filteredTransfers = transfers.filter((transfer) => {
    switch (activeTab) {
      case "delegations":
        return transfer.from.toLowerCase() !== userAddress.toLowerCase();
      default:
        return true;
    }
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string | number) => {
    const date = new Date(Number(timestamp) * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="page-content">
      {/* Header Section */}
      <div className="page-section">
        <div className="hero-heading">
          <h1 className="section-title">📊 Activity Dashboard</h1>
          <p className="section-subtitle">
            Real-time monitoring of mUSDC token transfers on Monad Testnet, powered by Envio HyperIndex
          </p>
        </div>
      </div>


      {/* Delegation & Redemption Feed Section */}
      <div className="page-section">
        <div className="card">
          <div className="envio-header">
            <h3 className="section-title">📋 Delegation Activity</h3>
            <p className="section-subtitle">
              Your active delegations and redemption history (stored locally)
            </p>
          </div>
          <LocalStorageFeed address={userAddress} />
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="page-section">
        <div className="card">
          <div className="activity-header">
            <h3 className="section-title">Recent Activity</h3>
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All Activity
              </button>
              <button
                className={`tab-button ${activeTab === "delegations" ? "active" : ""}`}
                onClick={() => setActiveTab("delegations")}
              >
                Delegations
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading transfers from Envio indexer...</p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                🔧
              </div>
              <h4 className="empty-state__title">
                Envio Integration in Development
              </h4>
              <p className="empty-state__description">
                This feature is currently under development. We're working on integrating Envio indexer to display real-time activity data.
              </p>
            </div>
          ) : (
            <div className="activity-list">
              {filteredTransfers.map((transfer) => {
                const isIncoming = transfer.to.toLowerCase() === userAddress.toLowerCase();
                const amount = Number(transfer.value) / 1_000_000;

                return (
                  <div key={transfer.id} className="activity-item">
                    <div className="activity-item__header">
                      <div className={`activity-badge ${isIncoming ? "incoming" : "outgoing"}`}>
                        {isIncoming ? "📥 Received" : "📤 Sent"}
                      </div>
                      <div className="activity-time">{formatTime(transfer.blockTimestamp)}</div>
                    </div>
                    
                    <div className="activity-item__content">
                      <div className="activity-details">
                        <div className="activity-detail">
                          <span className="activity-detail__label">From</span>
                          <span className="activity-detail__value">{formatAddress(transfer.from)}</span>
                        </div>
                        <div className="activity-detail">
                          <span className="activity-detail__label">To</span>
                          <span className="activity-detail__value">{formatAddress(transfer.to)}</span>
                        </div>
                        <div className="activity-detail">
                          <span className="activity-detail__label">Amount</span>
                          <span className="activity-detail__value amount">{amount.toFixed(6)} mUSDC</span>
                        </div>
                        <div className="activity-detail">
                          <span className="activity-detail__label">Block</span>
                          <span className="activity-detail__value">{transfer.blockNumber.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="activity-item__footer">
                        <a
                          href={`https://testnet.monadexplorer.com/tx/${transfer.transactionHash}`}
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
