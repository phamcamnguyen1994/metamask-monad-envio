"use client";

import React, { useState } from "react";
import { useMetaMask } from "./MetaMaskProvider";
import { SUPPORTED_CHAINS, type SupportedChainKey } from "@/lib/chain";

export function NetworkSelector() {
  const { chainId, switchNetwork } = useMetaMask();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const currentChain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);

  const handleNetworkSwitch = async (key: SupportedChainKey) => {
    const chain = SUPPORTED_CHAINS[key];
    if (chain.id === chainId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchNetwork(chain.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="network-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="network-selector__button"
      >
        <div className={`network-selector__indicator ${currentChain ? 'connected' : 'disconnected'}`} />
        <span className="network-selector__name">
          {currentChain?.name ?? "Unknown"}
        </span>
        <svg
          className={`network-selector__chevron ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="network-selector__backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="network-selector__dropdown">
            <div className="network-selector__list">
              {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => {
                const isActive = chain.id === chainId;
                return (
                  <button
                    key={key}
                    onClick={() => handleNetworkSwitch(key as SupportedChainKey)}
                    disabled={isSwitching}
                    className={`network-selector__option ${isActive ? 'active' : ''}`}
                  >
                    <div className="network-selector__option-content">
                      <div className={`network-selector__option-indicator ${isActive ? 'active' : ''}`} />
                      <div className="network-selector__option-info">
                        <div className="network-selector__option-name">{chain.name}</div>
                        <div className="network-selector__option-id">ID: {chain.id}</div>
                      </div>
                    </div>
                    {isActive && (
                      <svg className="network-selector__check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

