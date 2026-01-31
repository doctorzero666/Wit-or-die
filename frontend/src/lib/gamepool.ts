import { parseEther } from "viem";

export const gamePoolAddress =
  (process.env.NEXT_PUBLIC_GAMEPOOL_ADDRESS as `0x${string}` | undefined) ??
  ("0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`);

export const gamePoolAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "payout",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "totalPot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  }
];

export const defaultDepositValue = parseEther("0.01");
