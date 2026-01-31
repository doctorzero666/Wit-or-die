"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LobbyPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => {
      router.push("/intro");
    }, 420);
  };

  return (
    <main className={`intro-screen ${leaving ? "slide-out" : ""}`}>
      <div className="intro-content">
        <div className="intro-buttons">
          <button className="button primary" onClick={handleStart}>
            开始游戏
          </button>
          <button className="button">游戏设置</button>
        </div>
        <div className="intro-gun" aria-label="pixel revolver">
          <img src="/image_左轮手枪.png" alt="pixel revolver" />
        </div>
      </div>
    </main>
  );
}
