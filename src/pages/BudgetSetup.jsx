import { useState, useEffect } from "react";
import { MONTHS, CURRENT_MONTH, CURRENT_YEAR } from "../utils/constants";
import { S, FontLink } from "../styles/shared.jsx";
import { monthKey } from "../utils/storage";

export default function BudgetSetup({ allUserData, targetMonth, targetYear, onSave, onBack, showToast, askConfirm }) {
    const [month, setMonth] = useState(targetMonth ?? CURRENT_MONTH);
    const [year] = useState(targetYear ?? CURRENT_YEAR);
    const [sources, setSources] = useState([]);
    const [newSrc, setNewSrc] = useState("");
    const [newAmt, setNewAmt] = useState("");

    // Synchronize sources state when month selection changes
    useEffect(() => {
        const key = monthKey(month, year);
        const monthData = allUserData?.months?.[key];
        const existingSources = monthData?.budget?.sources;
        if (existingSources && existingSources.length > 0) {
            setSources(existingSources);
        } else {
            // Default setup values
            setSources([
                { name: "Parents", amount: "" },
                { name: "Earnings", amount: "" }
            ]);
        }
    }, [month, year, allUserData]);

    const total = sources.reduce((s, x) => s + (Number(x.amount) || 0), 0);

    const handleAddSource = () => {
        const name = newSrc.trim();
        const amountStr = newAmt.trim();
        if (!name) return;

        const amount = amountStr ? Number(amountStr) : 0;

        // Check if it already exists (case-insensitive)
        const existingIndex = sources.findIndex(s => s.name.toLowerCase() === name.toLowerCase());

        if (existingIndex >= 0) {
            // Add amount to existing source
            setSources(p => p.map((s, idx) => {
                if (idx === existingIndex) {
                    const currentVal = Number(s.amount) || 0;
                    return { ...s, amount: String(currentVal + amount) };
                }
                return s;
            }));
        } else {
            // Add new source
            setSources(p => [...p, { name, amount: amountStr }]);
        }

        setNewSrc("");
        setNewAmt("");
    };

    const handleSave = () => {
        const activeSources = sources
            .map(s => ({ name: s.name.trim(), amount: Number(s.amount) || 0 }))
            .filter(s => s.name && s.amount > 0);

        if (activeSources.length === 0) {
            showToast("Add at least one budget source with an amount.", "warning");
            return;
        }

        const calculatedTotal = activeSources.reduce((s, x) => s + x.amount, 0);
        onSave({ month, year, total: calculatedTotal, sources: activeSources });
    };

    return (
        <div style={{ ...S.app, padding: "32px 20px", display: "flex", justifyContent: "center" }}>
            <FontLink />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(251,191,36,0.08) 0%, transparent 70%)" }} />
            <div style={{ maxWidth: 580, width: "100%", position: "relative" }}>
                <div style={{ marginBottom: 28 }}>
                    {onBack && <button onClick={onBack} style={{ ...S.btn, background: "rgba(255,255,255,0.06)", color: "rgba(240,236,228,0.6)", padding: "8px 16px", marginBottom: 16 }}>← Back</button>}
                    <h2 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>💰 Budget Setup</h2>
                    <p style={{ color: "rgba(240,236,228,0.4)", margin: "6px 0 0", fontSize: 14 }}>Define your income for {MONTHS[month]} {year}</p>
                </div>

                <div style={{ ...S.card, marginBottom: 16 }}>
                    <label style={S.label}>Select Month</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} style={S.select}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
                    </select>
                </div>

                <div style={{ ...S.card, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <label style={{ ...S.label, marginBottom: 2 }}>Income Sources</label>
                            <p style={{ margin: 0, color: "rgba(240,236,228,0.35)", fontSize: 12 }}>Where does your money come from?</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)", fontWeight: 700 }}>TOTAL</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", fontFamily: "'JetBrains Mono',monospace" }}>₹{total.toLocaleString()}</div>
                        </div>
                    </div>

                    {sources.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{ flex: 1, display: "flex", gap: 10 }}>
                                <div style={{ flex: 1.2 }}>
                                    <label style={{ ...S.label, fontSize: 10, marginBottom: 4 }}>Source Name</label>
                                    <input
                                        type="text"
                                        value={s.name}
                                        onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                                        style={S.input}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ ...S.label, fontSize: 10, marginBottom: 4 }}>Amount</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,236,228,0.4)", fontSize: 14, fontWeight: 700 }}>₹</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={s.amount}
                                            onChange={e => setSources(p => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))}
                                            style={{ ...S.input, paddingLeft: 30 }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    askConfirm(
                                        `Are you sure you want to delete the income source "${s.name || "Unnamed Source"}"?`,
                                        () => setSources(p => p.filter((_, idx) => idx !== i))
                                    );
                                }}
                                style={{
                                    background: "rgba(248,113,113,0.1)",
                                    border: "1px solid rgba(248,113,113,0.25)",
                                    color: "#f87171",
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontSize: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: 16,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.2)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                                title="Delete source"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <label style={{ ...S.label, fontSize: 11, marginBottom: 8 }}>Add Income Source</label>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                            <div style={{ flex: 1.2 }}>
                                <input
                                    type="text"
                                    placeholder="Add source (e.g. Freelance)…"
                                    value={newSrc}
                                    onChange={e => setNewSrc(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleAddSource(); }}
                                    style={S.input}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,236,228,0.4)", fontSize: 14, fontWeight: 700 }}>₹</span>
                                    <input
                                        type="number"
                                        placeholder="₹ Amount"
                                        value={newAmt}
                                        onChange={e => setNewAmt(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") handleAddSource(); }}
                                        style={{ ...S.input, paddingLeft: 30 }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAddSource}
                                style={{
                                    ...S.btn,
                                    background: "rgba(249,115,22,0.15)",
                                    color: "#f97316",
                                    border: "1px solid rgba(249,115,22,0.3)",
                                    padding: "12px 18px",
                                    fontWeight: 800,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                + Add
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={handleSave} style={{ ...S.btn, width: "100%", background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", fontSize: 16, padding: "16px" }}>
                    Save Budget & Continue →
                </button>
            </div>
        </div>
    );
}
