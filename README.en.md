<div align="center">
  <a href="README.md">简体中文</a> | <b>English</b>
</div>

# WIT OR DIE

![WIT OR DIE](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131113216036.png)

> **"WIT OR DIE"**

A battle-royale English vocabulary game that combines an **LLM**, **Web3 wagering**, and a **Russian-roulette survival mechanic**.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=fff)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=fff)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=fff)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity&logoColor=fff)
![Hardhat](https://img.shields.io/badge/Hardhat-local-F9D72D)

## 📸 Video Demo

| Watch | What it shows |
|--------------|--------------|
| [WIT OR DIE on Bilibili](https://www.bilibili.com/video/BV1fr64B6Ekg/?share_source=copy_web&vd_source=58d42657ca98be5b02d6bf1322b54890) | |
| ![Demo cover](https://github.com/user-attachments/assets/14e550b9-0b87-43e2-9f7e-f45d142ae677) | Start game → pick a character → enter the lobby → connect wallet → answer correctly → win the round → settlement. Then: **answer wrong on purpose** → the overlay fires → elimination screen. |

## 🖥️ The Game

- Vocabulary drilling as a *Squid Game*. Every question is generated on the fly by an AI — nothing is pre-written.
- Players pay a small entry fee and race each other in asynchronous spelling rounds.
- A wrong answer triggers a Russian-roulette elimination roll: you can survive a mistake, which is what makes it a gamble rather than a quiz.
- Even eliminated players mint a participation NFT.
- The last survivor takes the whole prize pool and earns an achievement NFT.

Full details in [Wit or die.pdf](https://github.com/doctorzero666/Wit-or-die/blob/main/Wit%20or%20die.pdf).

## 📸 Screenshots

| Home | Winner's view |
|--------------|------------|
| ![Home](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194747590.png) | ![Winner](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194847072.png) |

| Elimination roll | Personal recap |
|--------------|------------|
| ![Elimination](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194436644.png) | ![Recap](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131195515561.png) |

## ✨ Highlights

- Outcomes rest purely on spelling ability
- Results and rewards settle transparently on-chain
- NFT rewards give players a reason to come back
- Multiple characters and stages, built to extend

## 💰 Business Model

- A small entry fee per round
- Winners take the staked pool
- A share of the fees funds platform upkeep

## 🔗 How a Round Works

### 1. Entry and matchmaking

- **Login** — Players sign in with `MetaMask` / `WalletConnect`. The system reads not just the wallet address but any `Survivor NFT` the player holds, which carries their level, win rate and past learning data.
- **Match** — The backend matches players in milliseconds against their on-chain record, so opponents are evenly matched.
- **Deposit** — Once matched, the player calls the contract to pay **1 USDT** (or another token) as the entry fee.

  > **Prize pool:** every entry fee flows into a transparent smart-contract pool, and the running total is displayed live at the top of the UI.

### 2. Real-time AI question engine

- **Dynamic generation** — At the start of a round, the LLM generates a batch of deliberately tricky English questions calibrated to the room's average level.
- **Validation and adaptive difficulty** — The backend model checks spelling and meaning instantly. If a player answers correctly several times in a row, the LLM raises the difficulty in later rounds (for example, stepping up from intermediate vocabulary to GRE-level words).

### 3. The survival roll

This is the revolver moment, and the part that has to be trustworthy for Web3 players — so it is resolved with **on-chain randomness**:

1. **Trigger** — The AI marks the answer wrong and the interaction animation fires.
2. **Pull** — The system calls `Chainlink VRF` (or an equivalent decentralised randomness source).
3. **Outcome**
   - 🟢 **Lucky (survived):** the number lands in the safe range, the UI plays an empty chamber, and the player returns to answering.
   - 🔴 **Eliminated:** the number hits the bullet range, the screen shatters, and the contract marks the player out — forfeiting any claim on the pool.

### 4. Settlement and assets

- **Payout** — When the timer expires or one survivor remains, the contract transfers USDT from the pool to the winning wallets at the preset ratio.
- **NFT progression** — A summary of the LLM-generated post-match report is written into the player's profile as metadata. Players on a streak (five consecutive survivals, say) mint a rare `Golden Revolver` badge (`ERC-1155`), which serves as an entry ticket to higher tiers.

## 🛠️ Tech Stack

### With thanks to [SpoonOS](https://xspoonai.github.io/) for their support

- **Frontend**
  - Next.js
  - wagmi / viem
- **On-chain core**
  - Hardhat
  - Solidity
- **Supporting layer**
  - [SpoonOS](https://xspoonai.github.io/) agent
  - OpenAI

## 📁 Project Structure

```
.
├─ backend/            # FastAPI backend (WebSocket / LLM)
│  ├─ app/
│  │  ├─ main.py       # Entry point, room and match logic
│  │  └─ llm_agent.py  # SpoonOS / LLM adapter
│  └─ requirements.txt
├─ chain/              # Hardhat contracts and deploy scripts
│  ├─ contracts/       # GamePool contract
│  ├─ scripts/         # Deployment scripts
│  └─ hardhat.config.js
├─ frontend/           # Next.js frontend
│  ├─ public/          # Image assets
│  └─ src/
│     ├─ app/          # Page routes
│     ├─ components/   # Components
│     ├─ lib/          # Logic, Web3 and WebSocket clients
│     │  └─ gamepool.ts# GamePool address config (NEXT_PUBLIC_GAMEPOOL_ADDRESS)
│     └─ styles/       # Global styles
└─ README.md
```

## Frontend / Backend / Chain Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js / React)                                          │
│ ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│ │ Connect Wallet      │  │ Battle Arena (UI)   │  │ Broadcast UI │ │
│ └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────────┘
            │                        │                       │
            ▼                        ▼                       ▼
┌────────────────────────────────────────────────────────────────────┐
│ Backend (FastAPI)                                                   │
│ ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ │
│ │ Room / WS Manager   │  │ LLM Agent Adapter   │  │ Match Logic  │ │
│ │ (state + broadcast) │  │ (SpoonOS)           │  │ (timer/score)│ │
│ └─────────────────────┘  └─────────────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────────┘
            │                                               │
            ▼                                               ▼
┌────────────────────────────────────────────────────────────────────┐
│ Chain (Hardhat / EVM)                                              │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ GamePool Contract (deposit / payout / totalPot)               │  │
│ └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

> ⚠️ **Time ran short during the hackathon, so the contract-to-backend integration was never wired up on the hosted build. To experience the full interaction, run it locally using the steps below — the local build includes the complete frontend + backend + contract loop.** If the **WebSocket backend is unavailable**, the arena page **falls back to a local demo mode**, so the full flow can still be demonstrated without starting the backend.

### Clone

```bash
git clone https://github.com/doctorzero666/Wit-or-die.git
cd Wit-or-die
```

### Install dependencies

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
npm install
cd ..

# Contracts
cd chain
npm install
cd ..
```

### Configure environment variables

```bash
# Backend (LLM)
# Create a .env file inside backend/ and add your OpenAI key
OPENAI_API_KEY=your_openai_api_key
```

### Start a local chain (Hardhat)

```bash
cd chain
npx hardhat node
```

### Deploy the contracts to the local chain

```bash
cd chain
npx hardhat run scripts/deploy.js --network localhost
```

The contract address is printed to the terminal on success. Write it into the frontend configuration as prompted.

### Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Start the frontend

```bash
cd frontend
npm run dev
```

### Play

**Open `http://localhost:3000` in your browser.**

## 🗺️ Roadmap

| Stage | Module | Description |
| :--- | :--- | :--- |
| **Expansion** | 🌐 **Subject universe** | Extend into **coding**, **maths** and **other languages** — anything can become a wager. |
| **Freedom** | ⚙️ **Custom rooms** | Let players set the **stake** and **room size (2–100)**, including 1v1 deathmatch. |
| **RPG** | 📖 **Story & ranked** | Add seasons and a promotion ladder, with RPG storylines and rank progression through wins. |
| **Strategy** | 🦸 **Character abilities** | Give NFTs real utility, such as *"Second Chance"* (one revival) or *"Time Stop"* (extra time). |
| **SocialFi** | 🎲 **Pre-match betting** | Let spectators bet on players, building a prediction market on top of knowledge competition. |

## 📄 License

MIT License

## 👥 Team Members

Built by four **Web3 beginners**. Over several late nights of the hackathon we worked side by side, learning protocols and on-chain interaction from scratch, cleared a lot of technical walls, and shipped this in the final hour before the deadline.

| Member | Role | Responsibilities | GitHub |
| :--- | :--- | :--- | :--- |
| **Jade** | 🎬 PM & Video | Project coordination, demo video editing and production | [@JadeTwinkle](https://github.com/JadeTwinkle) |
| **中二大魔王** | 💻 Frontend Dev | Frontend pages and interaction logic, on-chain data integration | [@doctorzero666](https://github.com/doctorzero666) |
| **芋头** | 🎨 UI & Presenter | UI/UX design, slide deck, pitch presentation | [@yuanxuejpjp](https://github.com/yuanxuejpjp) |
| **大米不辣.** | 📜 Contract & Docs | Smart contract development, research and documentation | [@zhaojinxiu6](https://github.com/zhaojinxiu6) |

## 🤝 Contributing

PRs and issues are welcome.

## 🙏 Acknowledgements

Built for the [SPARK AI Hackathon](https://github.com/CasualHackathon/SPARK-AI-Hackathon). Special thanks to [SpoonOS](https://xspoonai.github.io/), [ETHPanda](https://ethpanda.org/) and [LXDAO](https://lxdao.io/).
