 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WalletStatus from "../../components/WalletStatus";
import ConnectButton from "../../components/ConnectButton";
import DepositButton from "../pay-button";
import { useLocalWallet } from "../../lib/localWallet";

const ROOM_TTL_MS = 5 * 60 * 1000;

export default function LobbyPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [roomInfo] = useState(() => {
    if (typeof window === "undefined") {
      return { roomId: "local-test", shouldReset: false };
    }
    const existing = localStorage.getItem("activeRoomId");
    const createdAtRaw = localStorage.getItem("activeRoomCreatedAt");
    const status = localStorage.getItem("activeRoomStatus");
    const createdAt = createdAtRaw ? Number(createdAtRaw) : 0;
    const now = Date.now();
    const isExpired =
      !createdAt || now - createdAt > ROOM_TTL_MS || status === "over";
    if (!existing || isExpired) {
      const id = `local-test-${now.toString(36)}`;
      localStorage.setItem("activeRoomId", id);
      localStorage.setItem("activeRoomCreatedAt", String(now));
      localStorage.removeItem("activeRoomStatus");
      return { roomId: id, shouldReset: true };
    }
    return { roomId: existing, shouldReset: false };
  });
  const { isConnected, isPending, connect, deposit } = useLocalWallet();

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedAvatar");
    if (stored) {
      setAvatar(stored);
    }
  }, []);

  return (
    <main className="page">
      <header className="lobby-header">
        <strong>PLAYER</strong>
        <WalletStatus />
        <div className="spacer" />
        <span className="status-pill">Status: ONLINE</span>
        <Link className="status-pill" href="/profile">
          Profile
        </Link>
      </header>

      <section className="lobby-grid">
        <aside className="panel rank-card">
          <div className="panel-title">Current Rank</div>
          <div className="rank-avatar">
            {avatar ? <img src={avatar} alt="selected avatar" /> : "AVATAR"}
          </div>
          <div>
            <strong>一级生</strong>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              LEVEL ONE
            </div>
          </div>
          <div>
            <div style={{ fontSize: "12px", marginBottom: "6px" }}>
              XP Progress
            </div>
            <div className="rank-progress">
              <span />
            </div>
          </div>
        </aside>

        <div className="lobby-main">
          <div className="panel match-card">
            <div className="match-title">寻觅同学</div>
            <div className="match-subtitle">Find Classmates</div>
            <div style={{ fontSize: "12px" }}>142 players searching</div>
            <div className="row">
              <button
                className="button primary"
                onClick={async () => {
                  try {
                    if (!isConnected) {
                      connect();
                    }
                    await deposit("0.01");
                  const storedRoomId = localStorage.getItem("activeRoomId");
                  const nextRoomId = storedRoomId || roomInfo.roomId;
                  if (!storedRoomId) {
                    localStorage.setItem("activeRoomId", nextRoomId);
                    localStorage.setItem(
                      "activeRoomCreatedAt",
                      String(Date.now())
                    );
                  }
                  if (roomInfo.shouldReset) {
                    localStorage.removeItem("activeRoomStatus");
                  }
                  const shouldReset = roomInfo.shouldReset;
                    await fetch(`http://127.0.0.1:8000/rooms/${nextRoomId}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reset: shouldReset })
                    });
                  } catch {
                    // ignore; fall back to existing room
                  }
                  const active =
                    localStorage.getItem("activeRoomId") || roomInfo.roomId;
                  router.push(`/arena?room=${active}`);
                }}
                disabled={isPending}
              >
                {isPending ? "Paying..." : "Start Match"}
              </button>
              <ConnectButton />
            </div>
          </div>

          <div className="panel lobby-row">
            <div>
              <div className="panel-title zh-strong">进入教室</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                Classroom Entry
              </div>
            </div>
            <button className="button">+</button>
          </div>

          <div className="lobby-small">
            <div className="panel">
              <div className="panel-title zh-strong">小卖部</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                Snack Shop
              </div>
            </div>
            <div className="panel">
              <div className="panel-title zh-strong">考试成绩</div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                Exam Results
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Open Rooms</div>
            <div className="row" style={{ marginBottom: "12px" }}>
              <div>Room #A-112</div>
              <div className="spacer" />
              <div>8 / 12</div>
              <DepositButton />
            </div>
            <div className="row">
              <div>Room #B-207</div>
              <div className="spacer" />
              <div>5 / 12</div>
              <DepositButton />
            </div>
          </div>
        </div>
      </section>

      <div className="ticker">
        0xA3...9F 刚刚赢走了 0.5 ETH！| 0xB7...42 再战一次！
      </div>
    </main>
  );
}
