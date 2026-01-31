
# README

![image-20260131113216036](https://raw.githubusercontent.com/zhaojinxiu6/images/master/image-20260131113216036.png)

>  “WIT OR DIE”

一款结合 **LLM（大语言模型）** + **Web3 博弈** + **左轮手枪生存机制** 的英语学习游戏。（后续考虑增加其他语言）

## 📸 视频演示：（这里应该是视频上传到网盘，网盘分享的连接）

1. 启动后端 WebSocket 服务。
2. 启动前端应用。
3. 进入游戏大厅 → 选择「Start Match」。
4. **故意答错** → 触发遮罩层（overlay）→ 进入淘汰页面。

## 🖥️ 游戏介绍

“鱿鱼游戏”版的背单词。系统由 AI 实时生成完全随机的题目

玩家支付少量入场费入场，进行异步单词拼写竞速。

答错触发“左轮手枪”概率淘汰机制。即使答错也可能有概率幸存，增加博弈乐趣

最终幸存者独享奖池，并获得 NFT 成就。

## ✨ 游戏特色

- 完全基于拼写能力
- 比赛结果与奖励链上透明结算
- NFT奖励机制吸引玩家
- 多角色、多关卡、可持续扩展

##  💰 商业模式

- 每局小额参与费用
- 赢家获得主要奖励
- 极低比例作为系统维护
- 未来：
  - 更多的语言or学科
  - 自定义人数及单局价格
  - 剧情 + 晋级结合模式
  - 不同人物属性
  - 赛前竞猜

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



## 📄 开源协议

MIT License



## 👥 项目成员

本项目由四位 Web3 初学者共同打造。在黑客松的数个深夜里，我们并肩作战，从零开始探索协议与链上交互。克服了重重技术壁垒，最终在截止前的最后一刻完成了这个作品。

特别感谢每一位成员的坚持与付出：

+ [中二大魔王](https://github.com/doctorzero666)
+ [Jade](https://github.com/JadeTwinkle)
+ [芋头](https://github.com/yuanxuejpjp)
+ [大米](https://github.com/zhaojinxiu6)



## 🤝 项目共建

欢迎提交 PR 和 Issue！

## 🙏 致谢

本项目为 [SPARK AI Hackathon](https://github.com/CasualHackathon/SPARK-AI-Hackathon) 而建，特别鸣谢[SpoonOS](https://xspoonai.github.io/) 、[ETHPanda](https://ethpanda.org/)、[LXDAO](https://lxdao.io/) 

 
