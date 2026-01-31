"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKey = () => {
      router.push("/select");
    };
    const handleClick = () => {
      router.push("/select");
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("click", handleClick);
    };
  }, [router]);

  return (
    <main className="page intro-background">
      <div className="intro-hint">按任意键开始游戏......</div>
    </main>
  );
}
