"use client";

import { useRef, useState } from "react";
import {
  GunEliminationOverlay,
  GunEliminationOverlayHandle
} from "../../components/GunEliminationOverlay";

export default function GamePage() {
  const overlayRef = useRef<GunEliminationOverlayHandle>(null);
  const [lastResult, setLastResult] = useState<string>("—");

  const handleWrongAnswer = async () => {
    const eliminated = Math.random() < 0.3;
    await overlayRef.current?.play({ eliminated });
    setLastResult(eliminated ? "ELIMINATED" : "SURVIVED");
  };

  return (
    <main className="page">
      <GunEliminationOverlay
        ref={overlayRef}
        onDone={({ eliminated }) =>
          setLastResult(eliminated ? "ELIMINATED" : "SURVIVED")
        }
        lockPointerEvents={false}
        dimBackground={0.12}
        crackHoldMs={650}
        fireFrameHoldMs={90}
      />

      <h2>Demo Game Page</h2>
      <div className="row">
        <button className="button primary" onClick={handleWrongAnswer}>
          Trigger Wrong Answer
        </button>
        <div>Last Result: {lastResult}</div>
      </div>
    </main>
  );
}
