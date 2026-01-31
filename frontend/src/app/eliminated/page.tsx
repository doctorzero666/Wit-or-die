import Link from "next/link";
import Window from "../../components/Window";

export default function EliminatedPage() {
  return (
    <main className="page">
      <Window
        title="ELIMINATED"
        actions={
          <>
            <Link className="button primary" href="/arena">
              Play Again
            </Link>
            <Link className="button" href="/arena">
              Spectate
            </Link>
          </>
        }
      >
        <h2 style={{ color: "var(--accent-death)" }}>YOU DIED</h2>
        <p>你损失了 0.01 ETH 入场费。</p>
        <Link className="button" href="/lobby">
          Back to Lobby
        </Link>
      </Window>
    </main>
  );
}
