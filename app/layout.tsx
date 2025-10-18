import "./globals.css";
import HeaderNav from "@/components/HeaderNav";
import { MetaMaskProvider } from "@/components/MetaMaskProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/subscription", label: "Create Delegation" },
  { href: "/withdraw-delegation", label: "Redeem Delegation" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>MetaMask Delegation on Monad</title>
        <meta name="description" content="Smart Account Delegation Platform powered by MetaMask & Monad" />
      </head>
      <body>
        <MetaMaskProvider>
          <HeaderNav links={NAV_LINKS} />
          <div className="app-shell">
            <main className="page-content">{children}</main>
          </div>
          <footer className="app-footer">
            <div className="footer-content">
              <p className="footer-text">
                <strong>MetaMask Smart Accounts</strong> on Monad Testnet
              </p>
              <p className="footer-credits">
                Powered by <span className="footer-highlight">Delegation Toolkit</span> & <span className="footer-highlight">Envio</span>
              </p>
            </div>
          </footer>
        </MetaMaskProvider>
      </body>
    </html>
  );
}
