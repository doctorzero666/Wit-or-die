"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const boyImages = [
  "/boy/boy_1.jpg",
  "/boy/boy_2.jpg",
  "/boy/boy_3.jpg",
  "/boy/boy_4.jpg",
  "/boy/boy_5.jpg",
  "/boy/boy_6.jpg"
];

const girlImages = [
  "/girl/girl_1.jpg",
  "/girl/girl_2.jpg",
  "/girl/girl_3.jpg",
  "/girl/girl_4.jpg"
];

export default function SelectPage() {
  const router = useRouter();
  const [boyIndex, setBoyIndex] = useState(0);
  const [girlIndex, setGirlIndex] = useState(0);

  const currentBoy = useMemo(() => boyImages[boyIndex], [boyIndex]);
  const currentGirl = useMemo(() => girlImages[girlIndex], [girlIndex]);

  const cycle = (count: number, setter: (value: number) => void, delta: number) =>
    setter((prev) => (prev + delta + count) % count);

  return (
    <main className="select-page">
      <h2 className="select-title">选择角色</h2>
      <div className="select-grid">
        <button
          className="select-card"
          onWheel={(event) => {
            event.preventDefault();
            cycle(boyImages.length, setBoyIndex, event.deltaY > 0 ? 1 : -1);
          }}
          onClick={() => {
            sessionStorage.setItem("selectedAvatar", currentBoy);
            sessionStorage.setItem("selectedAvatarType", "boy");
            localStorage.removeItem("selectedAvatar");
            localStorage.removeItem("selectedAvatarType");
            router.push("/lobby");
          }}
        >
          <img src={currentBoy} alt="boy character" />
          <div className="select-label">BOY</div>
        </button>
        <button
          className="select-card"
          onWheel={(event) => {
            event.preventDefault();
            cycle(girlImages.length, setGirlIndex, event.deltaY > 0 ? 1 : -1);
          }}
          onClick={() => {
            sessionStorage.setItem("selectedAvatar", currentGirl);
            sessionStorage.setItem("selectedAvatarType", "girl");
            localStorage.removeItem("selectedAvatar");
            localStorage.removeItem("selectedAvatarType");
            router.push("/lobby");
          }}
        >
          <img src={currentGirl} alt="girl character" />
          <div className="select-label">GIRL</div>
        </button>
      </div>
      <div className="select-hint">鼠标悬停 + 滚轮切换，点击选择</div>
    </main>
  );
}
