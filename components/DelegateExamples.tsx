"use client";

import { useState } from "react";

const EXAMPLES = [
  {
    id: "smart-account",
    title: "Smart Account (app / game)",
    description: "Delegate to another smart account controlled by your application or game.",
    address: "0x1234567890123456789012345678901234567890",
    useCase: "App subscription  -  Game payment  -  Service fee",
  },
  {
    id: "eoa",
    title: "EOA (friend or family)",
    description: "Delegate to a regular wallet so a trusted person can spend your mUSDC.",
    address: "0x9876543210987654321098765432109876543210",
    useCase: "Family allowance  -  Friend payment  -  Personal use",
  },
  {
    id: "contract",
    title: "Smart contract",
    description: "Delegate to an automated contract that executes payments on your behalf.",
    address: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
    useCase: "DeFi protocol  -  DAO voting  -  Automated service",
  },
];

export default function DelegateExamples() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string, address: string) => {
    setSelectedId(id);
    navigator.clipboard.writeText(address);
  };

  return (
    <section className="card stack-md">
      <header className="stack-sm">
        <span className="badge">Delegate presets</span>
        <h3 className="section-title">Quick delegate examples</h3>
        <p className="muted">Click any example to copy the address into your clipboard.</p>
      </header>

      <div className="two-column">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => handleSelect(example.id, example.address)}
            className={`card card--interactive stack-sm${selectedId === example.id ? " is-active" : ""}`}
          >
            <div className="stack-sm">
              <h4>{example.title}</h4>
              <p className="muted">{example.description}</p>
              <code>{example.address}</code>
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                Use case: {example.useCase}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedId && (
        <div className="banner banner--success">
          Address copied to clipboard. Paste it into the form below.
        </div>
      )}
    </section>
  );
}


