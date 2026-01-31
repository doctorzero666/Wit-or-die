"use client";

import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther
} from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { gamePoolAbi, gamePoolAddress } from "./gamepool";

type LocalWalletContextValue = {
  address?: `0x${string}`;
  balance?: string;
  isConnected: boolean;
  isPending: boolean;
  accounts: `0x${string}`[];
  accountIndex: number;
  setAccountIndex: (index: number) => void;
  connect: () => void;
  disconnect: () => void;
  deposit: (amountEth: string) => Promise<void>;
  payout: (to: `0x${string}`, amountEth: string) => Promise<void>;
  getTotalPot: () => Promise<string>;
};

const LocalWalletContext = createContext<LocalWalletContextValue | null>(null);

const hardhatAccounts = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
].map((key) => privateKeyToAccount(key as `0x${string}`));

export function LocalWalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [accountIndex, setAccountIndex] = useState(0);
  const account = hardhatAccounts[accountIndex] ?? hardhatAccounts[0];
  const ownerAccount = hardhatAccounts[0];

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: hardhat,
        transport: http("http://127.0.0.1:8545")
      }),
    []
  );

  const walletClient = useMemo(
    () =>
      createWalletClient({
        chain: hardhat,
        transport: http("http://127.0.0.1:8545")
      }),
    []
  );

  const refreshBalance = useCallback(async () => {
    if (!isConnected) {
      return;
    }
    const wei = await publicClient.getBalance({
      address: account.address
    });
    setBalance((Number(wei) / 1e18).toFixed(4));
  }, [account.address, isConnected, publicClient]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const connect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setBalance(undefined);
  }, []);

  const deposit = useCallback(
    async (amountEth: string) => {
      if (!isConnected) {
        setIsConnected(true);
      }
      setIsPending(true);
      try {
        const hash = await walletClient.writeContract({
          address: gamePoolAddress,
          abi: gamePoolAbi,
          functionName: "deposit",
          value: parseEther(amountEth),
          account
        });
        await publicClient.waitForTransactionReceipt({ hash });
        await refreshBalance();
      } finally {
        setIsPending(false);
      }
    },
    [account, isConnected, publicClient, refreshBalance, walletClient]
  );

  const payout = useCallback(
    async (to: `0x${string}`, amountEth: string) => {
      if (!isConnected) {
        return;
      }
      if (!amountEth || Number(amountEth) <= 0) {
        return;
      }
      setIsPending(true);
      try {
        const hash = await walletClient.writeContract({
          address: gamePoolAddress,
          abi: gamePoolAbi,
          functionName: "payout",
          args: [to, parseEther(amountEth)],
          account: ownerAccount
        });
        await publicClient.waitForTransactionReceipt({ hash });
        await refreshBalance();
      } finally {
        setIsPending(false);
      }
    },
    [isConnected, ownerAccount, publicClient, refreshBalance, walletClient]
  );

  const getTotalPot = useCallback(async () => {
    const pot = await publicClient.readContract({
      address: gamePoolAddress,
      abi: gamePoolAbi,
      functionName: "totalPot"
    });
    return formatEther(pot);
  }, [publicClient]);

  return (
    <LocalWalletContext.Provider
      value={{
        address: account.address,
        balance,
        isConnected,
        isPending,
        accounts: hardhatAccounts.map((item) => item.address),
        accountIndex,
        setAccountIndex,
        connect,
        disconnect,
        deposit,
        payout,
        getTotalPot
      }}
    >
      {children}
    </LocalWalletContext.Provider>
  );
}

export function useLocalWallet() {
  const value = useContext(LocalWalletContext);
  if (!value) {
    throw new Error("useLocalWallet must be used within LocalWalletProvider");
  }
  return value;
}
