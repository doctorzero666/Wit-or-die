# Roulette LLM Arena (MVP P0)

## Quick Demo Flow
1. Start backend websocket server.
2. Start frontend app.
3. Open Lobby → Ranked Match.
4. Answer wrong intentionally → trigger overlay → eliminated page.

## Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

The arena page will fall back to local demo mode if the websocket
is unavailable, so the trigger flow still works without backend.
