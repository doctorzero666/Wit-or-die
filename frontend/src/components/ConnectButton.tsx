"use client";

import { useLocalWallet } from "../lib/localWallet";

export default function ConnectButton() {
  const { isConnected, connect, disconnect } = useLocalWallet();

  if (isConnected) {
    return (
      <button className="button" onClick={disconnect}>
        Disconnect
      </button>
    );
  }

  return (
    <button className="button primary" onClick={connect}>
      Connect Local Wallet
    </button>
  );
}
