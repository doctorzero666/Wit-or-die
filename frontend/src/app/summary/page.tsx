"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ScoreEntry = {
  name: string;
  score: number;
  dead: boolean;
};

type SummaryResponse = {
  survival_seconds: number;
  alive_count: number;
  dead_count: number;
  scores: ScoreEntry[];
};

export default function SummaryPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    const playerId =
      sessionStorage.getItem("playerId") || localStorage.getItem("playerId");
    if (!playerId) {
      return;
    }
    fetch(`http://127.0.0.1:8000/summary/${playerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.scores) {
          setSummary(data);
        }
      })
      .catch(() => undefined);
  }, []);

  const timeLabel = summary
    ? `${String(Math.floor(summary.survival_seconds / 60)).padStart(2, "0")}:${String(
        summary.survival_seconds % 60
      ).padStart(2, "0")}`
    : "02:00";
  const aliveLabel = summary
    ? `ALIVE: ${String(summary.alive_count).padStart(2, "0")} | DEAD: ${String(
        summary.dead_count
      ).padStart(2, "0")}`
    : "ALIVE: 07 | DEAD: 03";
  const scores = summary?.scores ?? [];

  return (
    <main className="page">
      <div className="summary-card">
        <div className="summary-grid">
          <div className="summary-left">
            <div className="summary-blackboard">
              <img src="/image_blackboard.png" alt="blackboard" />
              <div className="summary-blackboard-text">
                {aliveLabel}
              </div>
            </div>
          </div>

          <div className="summary-right">
            <div className="summary-time">{timeLabel}</div>
            <div className="summary-scoreboard">
              <div className="summary-score-title">SCOREBOARD</div>
              {scores.length > 0
                ? scores.map((entry) => (
                    <div key={entry.name} className="summary-score-row">
                      <span>{entry.name}</span>
                      <span>{entry.dead ? "RIP" : entry.score}</span>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>

        <div className="back-row">
          <Link className="back-button" href="/report">
            CLICK TO CONTINUE
          </Link>
        </div>
      </div>
    </main>
  );
}
