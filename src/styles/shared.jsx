// ── Shared Inline Styles ─────────────────────────────────────────────────────

export const S = {
    app: { minHeight: "100vh", background: "#0d0d0f", fontFamily: "'Nunito',sans-serif", color: "#f0ece4" },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 },
    input: { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f0ece4", fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", padding: "12px 16px", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f0ece4", fontFamily: "inherit", fontSize: 14, outline: "none", boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "rgba(240,236,228,0.4)", textTransform: "uppercase", marginBottom: 6, display: "block" },
    btn: { padding: "12px 24px", border: "none", borderRadius: 12, fontFamily: "inherit", fontWeight: 700, fontSize: 14, cursor: "pointer" },
    pill: (active, color) => ({ padding: "7px 16px", borderRadius: 20, border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`, background: active ? color + "22" : "transparent", color: active ? color : "rgba(240,236,228,0.5)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }),
};

// ── Google Fonts Link ────────────────────────────────────────────────────────
export const FontLink = () => (
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
);
