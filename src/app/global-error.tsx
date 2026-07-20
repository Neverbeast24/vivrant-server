"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#ede8df",
          color: "#14221b",
          fontFamily: "Segoe UI, system-ui, sans-serif",
        }}
      >
        <main
          style={{
            width: "min(100%, 28rem)",
            margin: "1.25rem",
            borderRadius: "1.4rem",
            border: "1px solid rgba(20,34,27,0.08)",
            background: "#f6faf7",
            boxShadow: "0 30px 90px rgba(54,43,34,0.16)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              height: "2.75rem",
              padding: "0 1rem",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              background: "rgba(255,255,255,0.35)",
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
            <span style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#8b8691" }}>
              VIVA
            </span>
          </div>
          <div style={{ padding: "2rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
              Something broke at the root.
            </h1>
            <p style={{ margin: "0.75rem 0 0", color: "#77717d", lineHeight: 1.6, fontSize: 14 }}>
              VIVA hit an unexpected error before the page could recover. Your data is safe —
              try again.
            </p>
            {error.digest ? (
              <p style={{ margin: "0.75rem 0 0", color: "#aaa4ae", fontSize: 10, fontFamily: "monospace" }}>
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                border: 0,
                borderRadius: "0.75rem",
                background: "#14221b",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
                padding: "0.75rem 1rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
