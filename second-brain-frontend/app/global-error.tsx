"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#050B18", color: "#F0F4FF", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px", textAlign: "center", padding: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Something went wrong</h1>
          <p style={{ color: "#8B9EC7", fontSize: "14px" }}>
            {error.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{ padding: "8px 20px", background: "#7C3AED", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
