"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClientEvent, Question, RoomPlayer, ServerEvent } from "./types";

type TriggerState = {
  open: boolean;
  outcome?: "alive" | "dead";
  message: string;
};

const mockQuestions: Question[] = [
  { id: "q1", prompt: "拼写: 机会", answer: "chance" },
  { id: "q2", prompt: "拼写: 危险", answer: "danger" },
  { id: "q3", prompt: "拼写: 生存", answer: "survival" }
];

const nextQuestion = (idx: number) => mockQuestions[idx % mockQuestions.length];

export function useArenaClient(playerId: string, roomId: string = "arena") {
  const [question, setQuestion] = useState<Question>(() => mockQuestions[0]);
  const [score, setScore] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [trigger, setTrigger] = useState<TriggerState>({
    open: false,
    message: ""
  });
  const [triggerId, setTriggerId] = useState(0);
  const [status, setStatus] = useState<"alive" | "eliminated">("alive");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [localDifficulty, setLocalDifficulty] = useState(1);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [aliveCount, setAliveCount] = useState(0);
  const [deadCount, setDeadCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [gameOverReason, setGameOverReason] = useState<
    "timeout" | "last_alive" | "ended" | null
  >(null);
  const [notices, setNotices] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const wsUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000/ws/arena";
    if (base.includes("/ws/") && roomId !== "arena") {
      return base.replace("/ws/arena", `/ws/${roomId}`);
    }
    if (roomId === "arena") {
      return base;
    }
    return base.replace(/\/ws\/[^/]+$/, `/ws/${roomId}`);
  }, [roomId]);

  useEffect(() => {
    let canceled = false;
    try {
      (async () => {
        try {
          await fetch(`http://127.0.0.1:8000/rooms/${roomId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reset: false })
          });
        } catch {
          // ignore room bootstrap failures
        }
        if (canceled) {
          return;
        }
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;
        socket.onopen = () => {
          if (canceled) {
            return;
          }
          setIsConnected(true);
          const joinEvent: ClientEvent = {
            type: "join",
            payload: { playerId }
          };
          socket.send(JSON.stringify(joinEvent));
        };
        socket.onmessage = (evt) => {
        const parsed = JSON.parse(evt.data) as ServerEvent;
        if (parsed.type === "question") {
          setQuestion(parsed.payload);
        }
        if (parsed.type === "result") {
          setScore(parsed.payload.totalScore);
        }
        if (parsed.type === "trigger") {
          setTrigger({
            open: true,
            outcome: parsed.payload.outcome,
            message: parsed.payload.message
          });
          setTriggerId((prev) => prev + 1);
          if (parsed.payload.outcome === "dead") {
            setStatus("eliminated");
          }
          setTimeout(() => {
            setTrigger((prev) => ({ ...prev, open: false }));
          }, 1600);
        }
        if (parsed.type === "notice") {
          setNotices((prev) => {
            const next = [...prev, parsed.payload.message];
            return next.slice(-3);
          });
        }
        if (parsed.type === "room") {
          setRoomPlayers(parsed.payload.players);
          setAliveCount(parsed.payload.aliveCount);
          setDeadCount(parsed.payload.deadCount);
          setTimeLeft(parsed.payload.timeLeft);
          setDurationSeconds(parsed.payload.durationSeconds);
          setServerOffsetMs(parsed.payload.serverNowMs - Date.now());
          setStartedAtMs(parsed.payload.startedAtMs);
        }
        if (parsed.type === "game_over") {
          setRoomPlayers(parsed.payload.players);
          setAliveCount(parsed.payload.aliveCount);
          setDeadCount(parsed.payload.deadCount);
          setTimeLeft(parsed.payload.timeLeft);
          setDurationSeconds(parsed.payload.durationSeconds);
          setServerOffsetMs(parsed.payload.serverNowMs - Date.now());
          setStartedAtMs(parsed.payload.startedAtMs);
          setWinnerId(parsed.payload.winnerId);
          setGameOverReason(parsed.payload.reason);
          setGameOver(true);
        }
        };
        socket.onclose = () => setIsConnected(false);
      })();
    } catch {
      setIsConnected(false);
    }

    return () => {
      canceled = true;
      socketRef.current?.close();
    };
  }, [playerId, wsUrl]);

  useEffect(() => {
    if (!startedAtMs || !durationSeconds) {
      return;
    }
    const update = () => {
      const now = Date.now() + serverOffsetMs;
      const elapsedSeconds = Math.floor((now - startedAtMs) / 1000);
      const nextLeft = Math.max(0, durationSeconds - elapsedSeconds);
      setTimeLeft(nextLeft);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds, serverOffsetMs, startedAtMs]);

  const submitAnswer = useCallback(
    (answer: string) => {
      const payload: ClientEvent = {
        type: "submit",
        payload: { answer, questionId: question.id }
      };

      if (socketRef.current && isConnected) {
        socketRef.current.send(JSON.stringify(payload));
        return;
      }

      const correct =
        answer.trim().toLowerCase() === question.answer.toLowerCase();
      const nextScore = correct ? score + 10 : score;
      setScore(nextScore);

      if (!correct) {
        setCorrectStreak(0);
        const survived = Math.random() > 0.5;
        const outcome = survived ? "alive" : "dead";
        setTrigger({
          open: true,
          outcome,
          message: survived ? "LUCKY! You survived." : "YOU DIED."
        });
        setTriggerId((prev) => prev + 1);
        if (!survived) {
          setStatus("eliminated");
        }
        setTimeout(() => {
          setTrigger((prev) => ({ ...prev, open: false }));
        }, 1600);
      }
      if (correct) {
        setCorrectStreak((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setLocalDifficulty((current) => {
              const increased = Math.min(5, current + 1);
              if (increased !== current) {
                setNotices((items) => {
                  const nextNotices = [
                    ...items,
                    `Difficulty increased to ${increased}.`
                  ];
                  return nextNotices.slice(-3);
                });
              }
              return increased;
            });
            return 0;
          }
          return next;
        });
      }

      setQuestionIndex((prev) => prev + 1);
      setQuestion(nextQuestion(questionIndex + 1));
    },
    [isConnected, question, questionIndex, score]
  );

  return {
    question,
    score,
    status,
    trigger,
    triggerId,
    isConnected,
    roomPlayers,
    aliveCount,
    deadCount,
    timeLeft,
    durationSeconds,
    gameOver,
    winnerId,
    gameOverReason,
    submitAnswer,
    notices,
    localDifficulty
  };
}
