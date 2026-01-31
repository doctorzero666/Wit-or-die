import Link from "next/link";
import Window from "../../components/Window";

export default function ProfilePage() {
  return (
    <main className="page">
      <Window title="My Profile">
        <div>Avatar: 0xAB...789</div>
        <div>Level: Bronze Speller</div>
        <div>Matches: 12</div>
        <div>Win rate: 33%</div>
        <div>Total profit: 0.18 ETH</div>
      </Window>

      <Window title="NFT Showcase">
        <div>🏅 Survivor I</div>
        <div style={{ opacity: 0.4 }}>🔒 Cold Blooded II</div>
        <div style={{ opacity: 0.4 }}>🔒 Endless Streak III</div>
      </Window>

      <Link className="button" href="/lobby">
        Back to Lobby
      </Link>
    </main>
  );
}
