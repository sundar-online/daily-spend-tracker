import { MONTHS } from "../utils/constants";
import { S } from "../styles/shared.jsx";

export default function MonthNavigator({ viewMonth, viewYear, onPrev, onNext, isCurrentMonth, isPastMonth }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "4px 4px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <button
                onClick={onPrev}
                title="Previous month"
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent", color: "rgba(240,236,228,0.6)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", fontFamily: "inherit" }}
                onMouseEnter={e => { e.target.style.background = "rgba(249,115,22,0.15)"; e.target.style.color = "#f97316"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "rgba(240,236,228,0.6)"; }}
            >◀</button>

            <div style={{ minWidth: 160, textAlign: "center", padding: "0 8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: "#f0ece4" }}>{MONTHS[viewMonth]}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "rgba(240,236,228,0.4)", fontFamily: "'JetBrains Mono',monospace" }}>{viewYear}</span>
                    {isCurrentMonth && (
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, padding: "2px 8px", borderRadius: 20, background: "rgba(249,115,22,0.2)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>NOW</span>
                    )}
                    {isPastMonth && (
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: .8, padding: "2px 8px", borderRadius: 20, background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }}>PAST</span>
                    )}
                </div>
            </div>

            <button
                onClick={onNext}
                disabled={isCurrentMonth}
                title={isCurrentMonth ? "Already at current month" : "Next month"}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent", color: isCurrentMonth ? "rgba(240,236,228,0.15)" : "rgba(240,236,228,0.6)", fontSize: 16, cursor: isCurrentMonth ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", fontFamily: "inherit" }}
                onMouseEnter={e => { if (!isCurrentMonth) { e.target.style.background = "rgba(249,115,22,0.15)"; e.target.style.color = "#f97316"; } }}
                onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = isCurrentMonth ? "rgba(240,236,228,0.15)" : "rgba(240,236,228,0.6)"; }}
            >▶</button>
        </div>
    );
}
