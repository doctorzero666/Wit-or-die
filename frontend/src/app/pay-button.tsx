"use client";

import { defaultDepositValue } from "../lib/gamepool";
import { useLocalWallet } from "../lib/localWallet";
import { formatEther } from "viem";

export default function DepositButton() {
  const { isConnected, isPending, deposit } = useLocalWallet();
  const depositValue = formatEther(defaultDepositValue);

  return (
    <button
      className="button"
      disabled={!isConnected || isPending}
      onClick={() => deposit(depositValue)}
    >
      {isPending ? "Paying..." : "Pay & Join"}
    </button>
  );
}
