"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GunEliminationOverlay,
  GunEliminationOverlayHandle
} from "../../components/GunEliminationOverlay";
import {
  VictoryTrophyOverlay,
  VictoryTrophyOverlayHandle
} from "../../components/VictoryTrophyOverlay";
import { useArenaClient } from "../../lib/arenaClient";
import { useLocalWallet } from "../../lib/localWallet";

export default function ArenaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room") ?? "arena";
  const [playerId] = useState(() => {
    if (typeof window === "undefined") {
      return `player-${Math.random().toString(36).slice(2, 10)}`;
    }
    const existing = sessionStorage.getItem("playerId");
    if (existing) {
      return existing;
    }
    const randomId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10);
    const id = `player-${randomId}`;
    sessionStorage.setItem("playerId", id);
    return id;
  });
  const {
    question,
    score,
    status,
    trigger,
    triggerId,
    isConnected,
    roomPlayers,
    aliveCount,
    deadCount,
    submitAnswer,
    timeLeft,
    durationSeconds,
    gameOver,
    winnerId,
    notices
  } = useArenaClient(playerId, roomId);
  const { address, isConnected: walletConnected, payout, getTotalPot } =
    useLocalWallet();
  const [answer, setAnswer] = useState("");
  const overlayRef = useRef<GunEliminationOverlayHandle>(null);
  const victoryRef = useRef<VictoryTrophyOverlayHandle>(null);
  const [victoryPlayed, setVictoryPlayed] = useState(false);
  const [potAmount, setPotAmount] = useState("0.00");
  const handledGameOverRef = useRef(false);
  const eliminationPlayedRef = useRef(false);

  const labelPlayer = useCallback(
    (id: string) => {
      if (id === playerId) {
        return "YOU";
      }
      return id.replace("player-", "P").slice(0, 10);
    },
    [playerId]
  );

  const postSummary = useCallback(
    async (eliminated: boolean) => {
      const players =
        roomPlayers.length > 0
          ? roomPlayers
          : [
              {
                id: playerId,
                score,
                alive: !eliminated
              }
            ];
      const duration = durationSeconds ?? 180;
      const survivalSeconds = Math.max(
        0,
        Math.min(
          duration,
          duration - (typeof timeLeft === "number" ? timeLeft : 0)
        )
      );
      const aliveTotal =
        roomPlayers.length > 0
          ? roomPlayers.filter((entry) => entry.alive).length
          : eliminated
            ? 0
            : 1;
      const deadTotal = players.length - aliveTotal;
      const scores = players
        .map((entry) => ({
          name: labelPlayer(entry.id),
          score: entry.score,
          dead: !entry.alive
        }))
        .sort((a, b) => b.score - a.score);

      await fetch("http://127.0.0.1:8000/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          survival_seconds: survivalSeconds,
          alive_count: aliveTotal,
          dead_count: deadTotal,
          scores
        })
      });
    },
    [durationSeconds, labelPlayer, playerId, roomPlayers, score, timeLeft]
  );

  useEffect(() => {
    sessionStorage.setItem("playerId", playerId);
  }, [playerId]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const amount = await getTotalPot();
        if (active) {
          setPotAmount(Number(amount).toFixed(4));
        }
      } catch {
        if (active) {
          setPotAmount("0.00");
        }
      }
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [getTotalPot]);

  useEffect(() => {
    if (!trigger.outcome) {
      return;
    }
    overlayRef.current?.play({
      eliminated: trigger.outcome === "dead"
    });
    if (trigger.outcome === "dead") {
      eliminationPlayedRef.current = true;
    }
  }, [triggerId, trigger.outcome]);

  useEffect(() => {
    if (status !== "eliminated" || eliminationPlayedRef.current) {
      return;
    }
    eliminationPlayedRef.current = true;
    overlayRef.current?.play({ eliminated: true });
  }, [status]);

  useEffect(() => {
    if (timeLeft === 0 && !victoryPlayed && status !== "eliminated") {
      setVictoryPlayed(true);
    }
  }, [timeLeft, victoryPlayed, status]);

  useEffect(() => {
    if (!gameOver || handledGameOverRef.current) {
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("activeRoomStatus", "over");
    }
    handledGameOverRef.current = true;
    if (winnerId === playerId) {
      setVictoryPlayed(true);
      (async () => {
        try {
          let amount = "0.0";
          try {
            amount = await getTotalPot();
            const payoutAmount = Number(amount);
            if (walletConnected && address && payoutAmount > 0) {
              await payout(address, amount);
            }
          } catch {
            // keep amount as-is for display if payout fails
          }
          await victoryRef.current?.play({
            amount: `${Number(amount).toFixed(4)} ETH`
          });
          await postSummary(false);
          router.push("/summary");
        } catch {
          await victoryRef.current?.play({ amount: "0.0 ETH" });
          await postSummary(false);
          router.push("/summary");
        }
      })();
      return;
    }
    (async () => {
      await postSummary(true);
      router.push("/summary");
    })();
  }, [gameOver, winnerId, playerId, router, postSummary, getTotalPot, payout, walletConnected, address]);

  return (
    <main className="page">
      <GunEliminationOverlay
        ref={overlayRef}
        lockPointerEvents={false}
        dimBackground={0.12}
        onDone={async ({ eliminated }) => {
          if (eliminated) {
            await postSummary(true);
            router.push("/summary");
          }
        }}
      />
      <VictoryTrophyOverlay ref={victoryRef} />

      <div className="arena-panel">
        <div className="hud-row">
          <div className="hud-box">POT: {potAmount} ETH</div>
          <div className="hud-box">SCORE: {score}</div>
          <div className="hud-box time-box">
            TIME: {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>
        </div>

        <div className="terminal">
          <div className="terminal-title">QUESTION TERMINAL</div>
          <div className="terminal-prompt">
            {question.prompt}{" "}
            <span className="terminal-hint">
              HINT: {isConnected ? "LIVE" : "LOCAL"}
            </span>
          </div>
          <div className="terminal-input-row">
            <input
              className="terminal-input"
              placeholder="Type your answer here..."
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={status === "eliminated"}
            />
            <button
              className="submit-button"
              onClick={() => {
                submitAnswer(answer);
                setAnswer("");
              }}
              disabled={status === "eliminated"}
            >
              SUBMIT
            </button>
          </div>
        </div>

        <div className="broadcast">
          <div className="broadcast-title">BROADCAST</div>
          <div className="broadcast-body">
            LIVE: {aliveCount} | DEAD: {deadCount} | ROOM: {roomId}
          </div>
          <div className="broadcast-players">
            {roomPlayers.slice(0, 6).map((player) => (
              <div key={player.id} className="broadcast-player-row">
                <span>{labelPlayer(player.id)}</span>
                <span>{player.alive ? "ALIVE" : "RIP"}</span>
              </div>
            ))}
          </div>
          {notices.length > 0 ? (
            <div className="broadcast-status">
              NOTICE: {notices[notices.length - 1]}
            </div>
          ) : null}
          <div className="broadcast-status">
            STATUS: {status.toUpperCase()}
          </div>
        </div>

        <div className="back-row">
          <Link className="back-button" href="/lobby">
            BACK TO LOBBY
          </Link>
        </div>
      </div>
    </main>
  );
}
