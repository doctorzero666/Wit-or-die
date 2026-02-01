# README



![image-20260131113216036](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131113216036.png)

>  “WIT OR DIE”

一款结合 **LLM（大语言模型）** + **Web3 博弈** + **左轮手枪生存机制** 的大逃杀英语学习游戏。



## 📸 视频演示：

| 视频播放地址 | 视频梗概 |
|--------------|--------------|
| [[WID OR DIE]](https://www.bilibili.com/video/BV1fr64B6Ekg/?share_source=copy_web&vd_source=58d42657ca98be5b02d6bf1322b54890) | |
| ![wit or die 视频2-封面](https://github.com/user-attachments/assets/14e550b9-0b87-43e2-9f7e-f45d142ae677) | 开始游戏 → 选择角色→ 进入游戏大厅 → 选择「连接钱包」→ 回答正确 → 获得最终胜利 → 对局结算。→ **故意答错** → 触发遮罩层（overlay）→ 进入淘汰页面。 |

## 🖥️ 游戏介绍

+ “鱿鱼游戏”版的背单词。系统由 AI 实时生成完全随机的题目

+ 玩家支付少量入场费入场，进行异步单词拼写竞速。

+ 答错触发“左轮手枪”概率淘汰机制，即使答错也可能有概率幸存，增加博弈乐趣。

+ 回答错误也有 NFT 参与奖。

+ 最终幸存者独享奖池，并获得 NFT 成就。

## 📸 精彩截图

| 主页面 | 赢家视角 |
|--------------|------------|
| ![image-20260131194747590](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194747590.png) | ![image-20260131194847072](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194847072.png)|

| 死亡判定 | 个人总结 |
|--------------|------------|
| ![image-20260131194436644](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131194436644.png)|![image-20260131195515561](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131195515561.png)|

## ✨ 游戏特色

- 完全基于拼写能力
- 比赛结果与奖励链上透明结算
- NFT奖励机制吸引玩家
- 多角色、多关卡、可持续扩展

##  💰 商业模式

- 每局小额参与费用
- 赢家获得质押奖励
- 部分手续费作为系统维护

##  🔗 业务流程图 

###  1. 资产准入与匹配
* **Login (身份识别)**
  玩家通过 `MetaMask` / `WalletConnect` 登录。系统不仅读取钱包地址
  还会检索玩家持有的 `Survivor NFT`（包含等级、胜率、过往学习数据）。
* **Match (智能匹配)**
    后端基于玩家在链上的“战绩属性”进行毫秒级匹配，确保对手水平旗鼓相当。
* **Deposit (合约押注)**
    匹配成功后，玩家调用合约接口支付 **1 USDT**（或其他代币）作为入场费。
  
    > **资金池 (Prize Pool):** 所有入场费汇入一个透明的智能合约池中，UI 顶部会实时显示当前总奖金池金额。

###  2. AI 实时出题引擎 
* **动态生成**
    游戏开始时，LLM 根据当前房间的平均等级，实时生成一批具有干扰性的英语题目。
* **逻辑判定与动态难度**
    * 玩家输入单词后，后端 AI 模型进行瞬时语义与拼写校验。
    * **难度补偿机制：** 如果玩家连续答题正确，LLM 会动态分析并在后续轮次中自动提升题目难度（例如从四级词汇提升至 GRE 词汇）。


###  3. 生死博弈判定
这是游戏中最关键的“左轮手枪”环节。为了保证 Web3 用户的信任，我们引入了**链上随机数**：

1.  **答错触发：** 当 AI 判定答案错误，立即触发交互动画。
2.  **链上开火：** 系统调用 `Chainlink VRF` (可验证随机函数) 或类似去中心化随机源。
3.  **判定结果：**
    * 🟢 **Lucky (存活)：** 随机数结果在安全区间内，UI 播放空枪声，返回答题。
    * 🔴 **Eliminated (死亡)：** 随机数命中“子弹”区间，触发碎屏动画。合约自动将该玩家标记为“已淘汰”，失去奖金瓜分权。


###  4. 结算与资产化 
* **奖金分配**
    当倒计时结束或场上只剩最后一名幸存者时，合约根据预设比例自动将资金池中的 USDT 划转至玩家钱包。
* **NFT 进化与存证**
    * **学习报告存证：** LLM 生成的“复盘报告”摘要将作为元数据，写入玩家的个人主页中。
    * **成就铸造：** 连续幸存（如 5 连胜）的玩家可获得稀有的 `Golden Revolver` 勋章 (`ERC-1155`)，作为后续高级赛道的入场券。


## 🛠️ 技术栈

### 首先感谢 [SpoonOS](https://xspoonai.github.io/) 的大力支持

+ #### 前端交互层：

  + Next.js
  + wagmi/viem

+ #### 链上核心层：

  + hardhat
  + Solidity

+ #### 关键支撑层：

  + [SpoonOS](https://xspoonai.github.io/) agent
  + OpenAI



## 📁 项目结构

```
.
├─ backend/            # FastAPI 后端（WebSocket/LLM）
│  ├─ app/
│  │  ├─ main.py       # 入口与房间/对局逻辑
│  │  └─ llm_agent.py  # SpoonOS/LLM 适配
│  └─ requirements.txt
├─ chain/              # Hardhat 合约与部署脚本
│  ├─ contracts/       # GamePool 合约
│  ├─ scripts/         # 部署脚本
│  └─ hardhat.config.js
├─ frontend/           # Next.js 前端
│  ├─ public/          # 资源图片
│  └─ src/
│     ├─ app/          # 页面路由
│     ├─ components/   # 组件
│     ├─ lib/          # 逻辑与 Web3/WS 客户端
│     │  └─ gamepool.ts# GamePool 地址配置（NEXT_PUBLIC_GAMEPOOL_ADDRESS）
│     └─ styles/       # 全局样式
└─ README.md
```

## 前后端与链结构图（ASCII）
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


## 🚀 快速开始

 ⚠️**由于时间关系，连接智能合约与后端服务的功能并未在线上联调。如需体验完整交互功能，请参考下方的步骤在本地运行完整版，本地版本包含了前后端+智能合约测试的完整交互版本。**如果 **WebSocket 后端不可用**，竞技场页面将**自动回退到本地 Demo 模式**，因此即使不启动后端，**触发流程依然可以完整演示**。

### 克隆项目

```bash
git clone https://github.com/doctorzero666/Wit-or-die.git
cd Wit-or-die
```

### 安装依赖

```bash
# 后端依赖
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# 前端依赖
cd frontend
npm install
cd ..

# 合约依赖
cd chain
npm install
cd ..
```
### 配置环境变量

```bash
# 后端（LLM）
# 在 backend 目录下创建 .env 并写入你的 OpenAI Key
OPENAI_API_KEY=your_openai_api_key
```
### 启动本地链（hardhat）

```bash
cd chain
npx hardhat node
```
### 部署合约到本地链

```bash
cd chain
npx hardhat run scripts/deploy.js --network localhost
```
成功后会在终端输出合约地址（如需前端使用，请按项目提示写入对应配置）。
### 启动后端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
### 启动前端

```bash
cd frontend
npm run dev
```
### 访问应用

**打开浏览器访问 `http://localhost:3000` 开始游戏。**



## 🗺️ 未来路径

| 阶段 | 功能模块 | 详细描述 |
| :--- | :--- | :--- |
| **Expansion** | 🌐 **学科宇宙** | 拓展至 **编程 (Coding)**、**数学**、**多语言** 等赛道，万物皆可“对赌”。 |
| **Freedom** | ⚙️ **自定义房间** | 支持用户设定 **入场金额 (Stake)** 及 **人数 (2-100人)**，支持 1v1 死斗模式。 |
| **RPG** | 📖 **剧情/排位** | 引入赛季（Seasons）与晋级体系，结合 RPG 剧情，通过胜场提升段位。 |
| **Strategy** | 🦸 **角色技能** | 赋予 NFT 实际效用，如 *"Second Chance" (复活一次)* 或 *"Time Stop" (延时)*。 |
| **SocialFi** | 🎲 **赛前竞猜** | 允许旁观者 (Spectators) 对选手进行下注，构建基于知识竞技的预测市场。 |


## 📄 开源协议

MIT License


## 👥 Team Members (项目成员)

本项目由四位 **Web3 初学者** 共同打造。在黑客松的数个深夜里，我们并肩作战，从零开始探索协议与链上交互。克服了重重技术壁垒，最终在截止前的最后一刻完成了这个作品。

| 成员  | 角色 | 主要职责 | GitHub |
| :--- | :--- | :--- | :--- |
| **Jade** | 🎬 PM & Video | 项目统筹管理，演示视频剪辑与制作 | [@JadeTwinkle](https://github.com/JadeTwinkle) |
| **中二大魔王** | 💻 Frontend Dev | 前端页面交互逻辑，链上数据对接 | [@doctorzero666](https://github.com/doctorzero666) |
| **芋头** | 🎨 UI & Presenter | UI/UX 界面设计，PPT 制作与路演主讲 | [@yuanxuejpjp](https://github.com/yuanxuejpjp) |
| **大米不辣.** | 📜 Contract & Docs | 智能合约开发，项目资料收集与文档整理 | [@zhaojinxiu6](https://github.com/zhaojinxiu6) |

## 🤝 项目共建

欢迎提交 PR 和 Issue！

## 🙏 致谢

本项目为 [SPARK AI Hackathon](https://github.com/CasualHackathon/SPARK-AI-Hackathon) 而建，特别鸣谢[SpoonOS](https://xspoonai.github.io/) 、[ETHPanda](https://ethpanda.org/)、[LXDAO](https://lxdao.io/) 

 
