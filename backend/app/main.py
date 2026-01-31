from __future__ import annotations

import asyncio
import json
import random
import time
from dataclasses import dataclass
from typing import Dict, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.llm_agent import (
    LlmQuestion,
    generate_question,
    judge_answer,
    generate_report,
)

app = FastAPI(title="Roulette LLM Arena API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


QUESTION_POOL = [
    LlmQuestion(id="q1", prompt="拼写: 机会", answer="chance", difficulty=1, topic="basic"),
    LlmQuestion(id="q2", prompt="拼写: 危险", answer="danger", difficulty=1, topic="basic"),
    LlmQuestion(id="q3", prompt="拼写: 生存", answer="survival", difficulty=1, topic="basic"),
]


@dataclass
class PlayerState:
    score: int = 0
    alive: bool = True
    correct_streak: int = 0
    difficulty: int = 1


class RoomState:
    def __init__(self, room_id: str, duration_seconds: int = 180) -> None:
        self.room_id = room_id
        self.players: Dict[str, PlayerState] = {}
        self.current_question_index: Dict[str, int] = {}
        self.last_question: Dict[str, LlmQuestion] = {}
        self.question_queue: Dict[str, list[LlmQuestion]] = {}
        self.connections: set[WebSocket] = set()
        self.duration_seconds = duration_seconds
        self.started_at: float | None = None
        self.game_over: bool = False
        self.winner_id: str | None = None
        self.timer_task: asyncio.Task | None = None

    def join(self, player_id: str) -> None:
        if player_id not in self.players:
            self.players[player_id] = PlayerState()
        else:
            self.players[player_id].score = 0
            self.players[player_id].alive = True
            self.players[player_id].correct_streak = 0
            self.players[player_id].difficulty = 1
        self.current_question_index[player_id] = 0
        self.last_question.pop(player_id, None)
        self.question_queue.pop(player_id, None)

    async def _fill_question_queue(
        self, player_id: str, desired_count: int = 3
    ) -> None:
        queue = self.question_queue.setdefault(player_id, [])
        player = self.players.get(player_id)
        if player is None:
            player = PlayerState()
            self.players[player_id] = player
        difficulty = max(1, min(5, player.difficulty))
        last_question = self.last_question.get(player_id)

        attempts = 0
        while len(queue) < desired_count and attempts < 12:
            attempts += 1
            candidate = await generate_question(player_id, difficulty)
            if candidate is None:
                break
            if last_question and (
                candidate.id == last_question.id
                or candidate.prompt == last_question.prompt
            ):
                continue
            if any(
                existing.id == candidate.id or existing.prompt == candidate.prompt
                for existing in queue
            ):
                continue
            queue.append(candidate)

        if len(queue) < desired_count:
            idx = self.current_question_index.get(player_id, 0)
            for offset in range(1, len(QUESTION_POOL) + 1):
                candidate = QUESTION_POOL[(idx + offset) % len(QUESTION_POOL)]
                if last_question and candidate.id == last_question.id:
                    continue
                if any(existing.id == candidate.id for existing in queue):
                    continue
                queue.append(candidate)
                if len(queue) >= desired_count:
                    break

    async def next_question(self, player_id: str) -> LlmQuestion:
        idx = self.current_question_index.get(player_id, 0)
        queue = self.question_queue.get(player_id, [])
        if not queue:
            await self._fill_question_queue(player_id, desired_count=3)
            queue = self.question_queue.get(player_id, [])
        if queue:
            question = queue.pop(0)
        else:
            question = QUESTION_POOL[idx % len(QUESTION_POOL)]
        self.current_question_index[player_id] = idx + 1
        self.last_question[player_id] = question
        return question

    def apply_answer(self, player_id: str, correct: bool) -> tuple[int, bool, int]:
        player = self.players.get(player_id)
        if player is None:
            player = PlayerState()
            self.players[player_id] = player
        difficulty_increased = False
        if correct:
            player.score += 10
            player.correct_streak += 1
            if player.correct_streak >= 3:
                if player.difficulty < 5:
                    player.difficulty += 1
                    difficulty_increased = True
                player.correct_streak = 0
        else:
            player.correct_streak = 0
        return player.score, difficulty_increased, player.difficulty

    def mark_dead(self, player_id: str) -> None:
        player = self.players.get(player_id)
        if player:
            player.alive = False

    def connect(self, websocket: WebSocket) -> None:
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    def snapshot(self) -> dict:
        now_epoch = time.time()
        if self.started_at is None:
            time_left = self.duration_seconds
            started_at_epoch = None
        else:
            elapsed = max(0.0, time.monotonic() - self.started_at)
            time_left = max(0, self.duration_seconds - int(elapsed))
            started_at_epoch = now_epoch - elapsed
        players = [
            {"id": player_id, "score": state.score, "alive": state.alive}
            for player_id, state in self.players.items()
        ]
        alive_count = sum(1 for entry in players if entry["alive"])
        dead_count = len(players) - alive_count
        return {
            "players": players,
            "aliveCount": alive_count,
            "deadCount": dead_count,
            "timeLeft": time_left,
            "durationSeconds": self.duration_seconds,
            "serverNowMs": int(now_epoch * 1000),
            "startedAtMs": int(started_at_epoch * 1000) if started_at_epoch else None,
        }

    async def broadcast(self, event: dict) -> None:
        disconnected: list[WebSocket] = []
        for conn in self.connections:
            try:
                await conn.send_text(json.dumps(event))
            except Exception:
                disconnected.append(conn)
        for conn in disconnected:
            self.connections.discard(conn)

    def reset(self) -> None:
        self.players.clear()
        self.current_question_index.clear()
        self.last_question.clear()
        self.started_at = None
        self.game_over = False
        self.winner_id = None
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None

    def start_timer(self) -> None:
        if self.started_at is not None or self.game_over:
            return
        self.started_at = time.monotonic()
        self.timer_task = asyncio.create_task(self._run_timer())

    async def _run_timer(self) -> None:
        try:
            await asyncio.sleep(self.duration_seconds)
            await self.finish_game(reason="timeout")
        except asyncio.CancelledError:
            return

    async def finish_game(self, reason: str) -> None:
        if self.game_over:
            return
        self.game_over = True
        alive_players = [
            (player_id, state)
            for player_id, state in self.players.items()
            if state.alive
        ]
        candidates = alive_players if alive_players else list(self.players.items())
        if candidates:
            winner_id = max(candidates, key=lambda item: item[1].score)[0]
        else:
            winner_id = None
        self.winner_id = winner_id
        await self.broadcast(
            {
                "type": "game_over",
                "payload": {
                    "winnerId": winner_id,
                    "reason": reason,
                    "roomId": self.room_id,
                    **self.snapshot(),
                },
            }
        )

    async def maybe_finish_last_alive(self) -> None:
        if self.game_over:
            return
        alive_count = sum(1 for state in self.players.values() if state.alive)
        if alive_count <= 1 and self.players:
            await self.finish_game(reason="last_alive")


ROOMS: Dict[str, RoomState] = {"arena": RoomState("arena")}
SUMMARY_BY_PLAYER: dict[str, SummaryPayload] = {}


class ReportRequest(BaseModel):
    wrong_words: list[str] = []
    score: int | None = None


class ScoreEntry(BaseModel):
    name: str
    score: int
    dead: bool


class SummaryPayload(BaseModel):
    player_id: str
    survival_seconds: int
    alive_count: int
    dead_count: int
    scores: list[ScoreEntry]


class RoomCreateRequest(BaseModel):
    duration_seconds: int | None = None
    reset: bool = True


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/match")
def match(player_id: str) -> dict:
    room = ROOMS["arena"]
    room.join(player_id)
    return {"room_id": "arena", "players": list(room.players.keys())}


@app.post("/rooms/{room_id}")
def create_room(room_id: str, request: RoomCreateRequest | None = None) -> dict:
    room = ROOMS.get(room_id)
    if room is None:
        if request and request.duration_seconds:
            room = RoomState(room_id, duration_seconds=request.duration_seconds)
        else:
            room = RoomState(room_id)
        ROOMS[room_id] = room
    if request is None or request.reset:
        if not room.connections:
            room.reset()
    return {"ok": True, "room_id": room_id}


@app.post("/rooms/{room_id}/reset")
def reset_room(room_id: str) -> dict:
    room = ROOMS.get(room_id)
    if room is None:
        ROOMS[room_id] = RoomState(room_id)
    else:
        room.reset()
    return {"ok": True, "room_id": room_id}


@app.post("/report")
async def report(request: ReportRequest) -> dict:
    text = await generate_report(request.wrong_words, request.score)
    return {"text": text}


@app.get("/reward")
def reward() -> dict:
    return {"amount": "0.8 ETH"}


@app.post("/summary")
def save_summary(payload: SummaryPayload) -> dict:
    SUMMARY_BY_PLAYER[payload.player_id] = payload
    return {"ok": True}


@app.get("/summary/{player_id}")
def get_summary(player_id: str) -> SummaryPayload | dict:
    summary = SUMMARY_BY_PLAYER.get(player_id)
    if summary is None:
        return {"ok": False}
    return summary


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    room = ROOMS.get(room_id)
    if room is None:
        await websocket.close(code=1008)
        return

    player_id = "unknown"
    room.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            payload = json.loads(message)
            msg_type = payload.get("type")

            if msg_type == "join":
                player_id = payload["payload"]["playerId"]
                room.join(player_id)
                room.start_timer()
                question = await room.next_question(player_id)
                await websocket.send_text(
                    json.dumps({"type": "question", "payload": question.__dict__})
                )
                await room.broadcast(
                    {
                        "type": "room",
                        "payload": {"roomId": room_id, **room.snapshot()},
                    }
                )
                if room.game_over:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "game_over",
                                "payload": {
                                    "winnerId": room.winner_id,
                                    "reason": "ended",
                                    "roomId": room_id,
                                    **room.snapshot(),
                                },
                            }
                        )
                    )
                continue

            if msg_type == "submit":
                if room.game_over:
                    continue
                answer = payload["payload"]["answer"]
                question_id = payload["payload"]["questionId"]
                player_state = room.players.get(player_id)
                if player_state is None or not player_state.alive:
                    continue
                expected: Optional[LlmQuestion] = room.last_question.get(player_id)
                if expected is None or expected.id != question_id:
                    expected = next(
                        (q for q in QUESTION_POOL if q.id == question_id), None
                    )

                correct = False
                if expected is not None:
                    result = await judge_answer(expected, answer)
                    if result is not None:
                        correct = result.correct
                    else:
                        correct = (
                            answer.strip().lower() == expected.answer.lower()
                        )
                total_score, difficulty_increased, new_difficulty = room.apply_answer(
                    player_id, correct
                )
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "result",
                            "payload": {
                                "correct": correct,
                                "scoreDelta": 10 if correct else 0,
                                "totalScore": total_score,
                            },
                        }
                    )
                )
                if difficulty_increased:
                    room.question_queue[player_id] = []
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "notice",
                                "payload": {
                                    "message": (
                                        f"Difficulty increased to {new_difficulty}."
                                    )
                                },
                            }
                        )
                    )

                if not correct:
                    survived = random.random() > 0.5
                    outcome = "alive" if survived else "dead"
                    message = "LUCKY! You survived." if survived else "YOU DIED."
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "trigger",
                                "payload": {"outcome": outcome, "message": message},
                            }
                        )
                    )
                    if not survived:
                        room.mark_dead(player_id)
                        await room.broadcast(
                            {
                                "type": "room",
                                "payload": {"roomId": room_id, **room.snapshot()},
                            }
                        )
                        await room.maybe_finish_last_alive()
                        continue

                question = await room.next_question(player_id)
                await websocket.send_text(
                    json.dumps({"type": "question", "payload": question.__dict__})
                )
                await room.broadcast(
                    {
                        "type": "room",
                        "payload": {"roomId": room_id, **room.snapshot()},
                    }
                )
                await room.maybe_finish_last_alive()
    except WebSocketDisconnect:
        return
    finally:
        room.disconnect(websocket)
