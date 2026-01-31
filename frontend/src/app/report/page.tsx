"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReportResponse = {
  text: string;
};

export default function ReportPage() {
  const [text, setText] = useState<string>("正在生成评价...");

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wrong_words: ["chance", "danger"],
            score: 60
          })
        });
        const data = (await response.json()) as ReportResponse;
        setText(data.text || "暂无评价内容。");
      } catch {
        setText("暂时无法获取评价内容，请稍后重试。");
      }
    };
    run();
  }, []);

  return (
    <main className="page report-page">
      <div className="report-grid">
        <div className="report-left">
          <img src="/image_学姐.png" alt="学姐" />
        </div>
        <div className="report-right">
          <div className="report-title">学姐评价</div>
          <div className="report-text">{text}</div>
        </div>
      </div>
      <div className="back-row">
        <Link className="back-button" href="/lobby">
          BACK TO LOBBY
        </Link>
      </div>
    </main>
  );
}
