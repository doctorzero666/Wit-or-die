"use client";

import { ReactNode } from "react";
import { LocalWalletProvider } from "../lib/localWallet";

export default function Providers({ children }: { children: ReactNode }) {
  return <LocalWalletProvider>{children}</LocalWalletProvider>;
}
