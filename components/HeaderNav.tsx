"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMetaMask } from "./MetaMaskProvider";
import AccountOverview from "./AccountOverview";
import { NetworkSelector } from "./NetworkSelector";

type NavLink = {
  href: string;
  label: string;
};

function formatAddress(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function HeaderNav({ links }: { links: NavLink[] }) {
  const { account, isConnecting, connect, disconnect, error, clearError } = useMetaMask();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const connectHandler = async () => {
    clearError();
    await connect();
  };

  return (
    <>
      {/* Sticky Navigation Bar */}
      <nav className={`sticky-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="sticky-nav__container">
          {/* Logo */}
          <Link href="/" className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#gradient)" />
              <path d="M16 8L22 14L16 20L10 14L16 8Z" fill="white" opacity="0.9" />
              <path d="M16 12L20 16L16 20L12 16L16 12Z" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6c5ce7" />
                  <stop offset="100%" stopColor="#a55eea" />
                </linearGradient>
              </defs>
            </svg>
            <span className="logo__text">
              <span className="logo__main">MetaMask Delegation</span>
              <span className="logo__sub">on Monad</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="nav-links desktop-only">
            {links.map((link) => (
              <li key={link.href}>
                <Link 
                  className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Wallet Actions */}
          <div className="nav-actions desktop-only">
            <NetworkSelector />
            {account ? (
              <div className="account-section">
                <AccountOverview />
                <div className="wallet-badge">
                  <span className="wallet-badge__address">{formatAddress(account)}</span>
                  <button className="btn btn--sm btn--outline" type="button" onClick={disconnect}>
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn--primary" type="button" onClick={connectHandler} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            {links.map((link) => (
              <li key={link.href}>
                <Link 
                  className={`mobile-nav-link ${pathname === link.href ? 'active' : ''}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="mobile-wallet-actions">
            <NetworkSelector />
            {account ? (
              <>
                <AccountOverview />
                <div className="wallet-badge">
                  <span className="wallet-badge__address">{formatAddress(account)}</span>
                  <button className="btn btn--sm btn--outline" type="button" onClick={disconnect}>
                    Disconnect
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn--primary btn--full" type="button" onClick={connectHandler} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header - Only on homepage */}
      {pathname === "/" && (
        <header className="hero-header">
          <div className="hero-content">
            <span className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.2" />
                <circle cx="8" cy="8" r="4" fill="currentColor" />
              </svg>
              Monad Testnet x MetaMask Delegation Toolkit
            </span>
            <h1 className="hero-title">
              Smart Account Delegation Platform
            </h1>
            <p className="hero-description">
              Create MetaMask Smart Accounts, sign delegations with spending limits, 
              and transfer tokens on Monad. Indexed in real-time by Envio.
            </p>
          </div>
        </header>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-banner__content">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </>
  );
}
