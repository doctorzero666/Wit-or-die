type TriggerOverlayProps = {
  open: boolean;
  outcome?: "alive" | "dead";
  message: string;
};

export default function TriggerOverlay({
  open,
  outcome,
  message
}: TriggerOverlayProps) {
  if (!open) {
    return null;
  }

  const color =
    outcome === "dead" ? "var(--accent-death)" : "var(--accent-life)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          border: `3px double ${color}`,
          padding: "24px",
          textAlign: "center",
          background: "#080808",
          minWidth: "320px"
        }}
      >
        <div style={{ fontSize: "32px", color, marginBottom: "16px" }}>
          {outcome === "dead" ? "BANG!" : "CLICK"}
        </div>
        <div style={{ marginBottom: "12px" }}>
          Revolver spins... Trigger pulled...
        </div>
        <div style={{ color }}>{message}</div>
      </div>
    </div>
  );
}
