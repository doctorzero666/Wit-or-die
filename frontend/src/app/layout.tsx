import "../styles/globals.css";
import type { ReactNode } from "react";
import Providers from "./providers";

export const metadata = {
  title: "Roulette LLM Arena",
  description: "LLM + Web3 + Roulette survival spelling game"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
