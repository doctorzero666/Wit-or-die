import type { ReactNode } from "react";

type WindowProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function Window({ title, children, actions }: WindowProps) {
  return (
    <section
      style={{
        border: "2px double var(--border)",
        background: "var(--panel)"
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "2px double var(--border)"
        }}
      >
        <span>{title}</span>
        <span>[X]</span>
      </header>
      <div style={{ padding: "16px" }}>{children}</div>
      {actions ? (
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "12px",
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end"
          }}
        >
          {actions}
        </footer>
      ) : null}
    </section>
  );
}
