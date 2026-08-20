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
      <head>
        <meta name="color-scheme" content="light dark" />
        <style>{`
          :root { color-scheme: light dark; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #eef4f0;
            color: #14221b;
            font-family: Segoe UI, system-ui, sans-serif;
          }
          main {
            width: min(100%, 28rem);
            margin: 1.25rem;
            border-radius: 1.4rem;
            border: 1px solid rgba(20, 34, 27, 0.08);
            background: #f6faf7;
            box-shadow: 0 30px 90px rgba(20, 34, 27, 0.16);
            overflow: hidden;
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0c1210; color: #e8f0eb; }
            main {
              border-color: rgba(232, 240, 235, 0.12);
              background: #17201a;
              box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
            }
            .muted { color: #b7c9be !important; }
            .bar { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.08) !important; }
            .brand { color: #b7c9be !important; }
            .action { background: #e8f0eb !important; color: #0f1612 !important; }
          }
        `}</style>
      </head>
      <body>
        <main>
          <div
            className="bar"
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
            <span
              className="brand"
              style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#4a5c54" }}
            >
              VIVRΛNT
            </span>
          </div>
          <div style={{ padding: "2rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.75rem", letterSpacing: "-0.03em" }}>
              Something broke at the root.
            </h1>
            <p className="muted" style={{ margin: "0.75rem 0 0", color: "#4a5c54", lineHeight: 1.6, fontSize: 14 }}>
              VIVRΛNT hit an unexpected error before the page could recover. Your data is safe —
              try again.
            </p>
            {error.digest ? (
              <p className="muted" style={{ margin: "0.75rem 0 0", color: "#4a5c54", fontSize: 10, fontFamily: "monospace" }}>
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              className="action"
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
