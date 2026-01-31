"use client";

import { useLocalWallet } from "../lib/localWallet";

export default function WalletStatus() {
  const {
    address,
    isConnected,
    balance,
    connect,
    disconnect,
    accounts,
    accountIndex,
    setAccountIndex
  } = useLocalWallet();

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not Connected";

  return (
    <>
      <button
        className="status-pill"
        style={{
          background: "transparent",
          cursor: "pointer",
          color: "var(--fg)",
          font: "inherit"
        }}
        onClick={isConnected ? disconnect : connect}
      >
        Wallet: {isConnected ? displayAddress : "Disconnected"}
      </button>
      <div className="status-pill">
        Balance: {balance ? `${balance} ETH` : "--"}
      </div>
      <label
        className="status-pill"
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        Account
        <select
          value={accountIndex}
          onChange={(event) => setAccountIndex(Number(event.target.value))}
          style={{
            background: "#0b0b0b",
            color: "var(--fg)",
            border: "1px solid var(--border)",
            font: "inherit",
            padding: "2px 6px"
          }}
        >
          {accounts.map((acct, idx) => (
            <option key={acct} value={idx}>
              #{idx} {acct.slice(0, 6)}...{acct.slice(-4)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
