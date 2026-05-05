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
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif',
          background: "#fbfbfd",
          color: "#1d1d1f",
          minHeight: "100vh",
          margin: 0,
          padding: "64px 24px",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.022em",
              margin: 0,
            }}
          >
            JobPilot crashed.
          </h1>
          <p style={{ marginTop: 12, color: "#6e6e73", lineHeight: 1.5 }}>
            {error.message || "An unexpected error broke the app shell."}
          </p>
          {error.digest ? (
            <p style={{ marginTop: 8, color: "#86868b", fontSize: 12 }}>
              digest: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              borderRadius: 9999,
              border: "none",
              background: "#0071e3",
              color: "white",
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
