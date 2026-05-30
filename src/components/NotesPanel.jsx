import { useState } from "react";
import { createPortal } from "react-dom";
import { S } from "../styles/shared.jsx";

export default function NotesPanel({ notes, onSaveNotes, savingsGoals, onSaveSavingsGoal, onContributeToGoal, onDeleteSavingsGoal }) {
    const [noteText, setNoteText] = useState("");
    const [noteAmount, setNoteAmount] = useState("");
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [goalForm, setGoalForm] = useState({ name: "", emoji: "🎯", targetAmount: "", deadline: "" });
    const [contributions, setContributions] = useState({});

    const addNote = () => {
        if (!noteText.trim()) return;
        const newNote = {
            id: Date.now(),
            text: noteText.trim(),
            amount: noteAmount ? Number(noteAmount) : null,
            pinned: false,
            done: false,
            createdAt: new Date().toISOString().split("T")[0],
        };
        onSaveNotes([newNote, ...notes]);
        setNoteText("");
        setNoteAmount("");
    };

    const deleteNote = (id) => onSaveNotes(notes.filter((n) => n.id !== id));
    const togglePin = (id) =>
        onSaveNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
    const toggleDone = (id) =>
        onSaveNotes(notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));

    const createGoal = () => {
        const target = Number(goalForm.targetAmount);
        if (!goalForm.name.trim() || !target) return;
        onSaveSavingsGoal({
            name: goalForm.name.trim(),
            emoji: goalForm.emoji.trim() || "🎯",
            targetAmount: target,
            deadline: goalForm.deadline || null,
        });
        setGoalForm({ name: "", emoji: "🎯", targetAmount: "", deadline: "" });
        setShowGoalModal(false);
    };

    const addContribution = (goal) => {
        const raw = contributions[goal.id];
        const amount = Number(raw);
        if (!amount) return;
        onContributeToGoal(goal.id, amount, goal.savedAmount, goal.name);
        setContributions((prev) => ({ ...prev, [goal.id]: "" }));
    };

    return (
        <div
            className="notes-sidebar"
            style={{
                width: 300,
                minWidth: 280,
                flexShrink: 0,
                position: "sticky",
                top: 80,
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
            }}
        >
            <div style={{ ...S.card, marginBottom: 0 }}>
                <h4 style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                    📝 Notes & Reminders
                </h4>

                {/* Add Note */}
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="text"
                        placeholder="e.g. Lent ₹100 to Ravi…"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                        style={{ ...S.input, fontSize: 12, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                        <input
                            type="number"
                            placeholder="₹ Amount"
                            value={noteAmount}
                            onChange={(e) => setNoteAmount(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                            style={{ ...S.input, flex: 1, fontSize: 12, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                        <button
                            onClick={addNote}
                            style={{ ...S.btn, border: "1px solid transparent", background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", padding: "8px 16px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {/* Notes List */}
                {notes.length === 0 ? (
                    <div style={{ color: "rgba(240,236,228,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                        No notes yet. Add a reminder above!
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[...notes]
                            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                            .map((note) => (
                                <div
                                    key={note.id}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        background: note.pinned ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${note.pinned ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`,
                                        transition: "all .2s",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                        <button
                                            onClick={() => toggleDone(note.id)}
                                            style={{
                                                background: "none",
                                                border: `2px solid ${note.done ? "#10b981" : "rgba(255,255,255,0.2)"}`,
                                                width: 18, height: 18, borderRadius: 5, cursor: "pointer",
                                                flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center",
                                                justifyContent: "center", fontSize: 10, color: "#10b981", padding: 0,
                                            }}
                                        >
                                            {note.done ? "✓" : ""}
                                        </button>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 13, fontWeight: 600,
                                                color: note.done ? "rgba(240,236,228,0.3)" : "rgba(240,236,228,0.85)",
                                                textDecoration: note.done ? "line-through" : "none", lineHeight: 1.3,
                                            }}>
                                                {note.text}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                                {note.amount && (
                                                    <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: note.done ? "rgba(16,185,129,0.4)" : "#10b981" }}>
                                                        ₹{note.amount.toLocaleString()}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 10, color: "rgba(240,236,228,0.2)" }}>{note.createdAt}</span>
                                                {note.pinned && <span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", letterSpacing: 0.5 }}>📌 PINNED</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
                                        <button onClick={() => togglePin(note.id)} style={{ background: note.pinned ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)", border: "none", color: note.pinned ? "#f97316" : "rgba(240,236,228,0.4)", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 600 }}>
                                            {note.pinned ? "Unpin" : "📌 Pin"}
                                        </button>
                                        <button onClick={() => deleteNote(note.id)} style={{ background: "rgba(248,113,113,0.1)", border: "none", color: "#f87171", padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: "inherit", fontWeight: 600 }}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <h4 style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                        🎯 Goals
                    </h4>

                    {(savingsGoals || []).length === 0 ? (
                        <div style={{ color: "rgba(240,236,228,0.22)", fontSize: 12, textAlign: "center", padding: "14px 0" }}>
                            No goals yet. Create your first one!
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                            {savingsGoals.map((goal) => {
                                const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
                                return (
                                    <div key={goal.id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                                <span style={{ fontSize: 18 }}>{goal.emoji || "🎯"}</span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 13 }}>{goal.name}</div>
                                                    {goal.deadline && <div style={{ fontSize: 10, color: "rgba(240,236,228,0.35)" }}>Due {goal.deadline}</div>}
                                                </div>
                                            </div>
                                            <button onClick={() => onDeleteSavingsGoal(goal.id)} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", width: 28, height: 28, borderRadius: 8, cursor: "pointer" }}>🗑️</button>
                                        </div>
                                        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 999, height: 8, overflow: "hidden", marginBottom: 7 }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "linear-gradient(90deg,#f59e0b,#10b981)" : "linear-gradient(90deg,#f97316,#fbbf24)", transition: "width .4s ease" }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "rgba(240,236,228,0.55)", marginBottom: 8 }}>
                                            ₹{goal.savedAmount.toLocaleString()} of ₹{goal.targetAmount.toLocaleString()} saved
                                        </div>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            <input
                                                type="number"
                                                placeholder="Add ₹"
                                                value={contributions[goal.id] || ""}
                                                onChange={(e) => setContributions((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                                                onKeyDown={(e) => { if (e.key === "Enter") addContribution(goal); }}
                                                style={{ ...S.input, flex: 1, fontSize: 12, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 0 }}
                                            />
                                            <button onClick={() => addContribution(goal)} style={{ ...S.btn, border: "1px solid transparent", padding: "8px 16px", fontSize: 12, fontWeight: 800, background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", whiteSpace: "nowrap" }}>+ Add ₹</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button onClick={() => setShowGoalModal(true)} style={{ width: "100%", background: "transparent", border: "1px solid rgba(249,115,22,0.4)", color: "#f97316", padding: "9px 12px", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        + New Goal
                    </button>
                </div>
            </div>

            {showGoalModal && createPortal(
                <div
                    className="modal-overlay"
                    onClick={() => setShowGoalModal(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(13, 13, 15, 0.85)",
                        backdropFilter: "blur(12px)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                    }}
                >
                    <div
                        className="slide-up"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "100%",
                            maxWidth: 440,
                            background: "#12121a",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: 20,
                            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                            padding: 24,
                            position: "relative",
                            zIndex: 10001,
                            maxHeight: "90vh",
                            overflowY: "auto",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                                🎯 Create Savings Goal
                            </h3>
                            <button
                                onClick={() => setShowGoalModal(false)}
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "none",
                                    color: "rgba(240,236,228,0.6)",
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 18,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Goal Name */}
                        <label style={{ ...S.label, marginBottom: 6 }}>Goal Name</label>
                        <input
                            placeholder="e.g. New Laptop, Euro Trip..."
                            value={goalForm.name}
                            onChange={(e) => setGoalForm((p) => ({ ...p, name: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") createGoal(); }}
                            style={{ ...S.input, marginBottom: 16, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                        />

                        {/* Emoji Picker Row */}
                        <label style={{ ...S.label, marginBottom: 6 }}>Goal Icon / Emoji</label>
                        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                            {/* Large Preview */}
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    background: "rgba(255, 255, 255, 0.04)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 24,
                                    flexShrink: 0,
                                }}
                            >
                                {goalForm.emoji || "🎯"}
                            </div>

                            {/* Input for custom emoji */}
                            <input
                                placeholder="Custom Emoji"
                                value={goalForm.emoji}
                                onChange={(e) => setGoalForm((p) => ({ ...p, emoji: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") createGoal(); }}
                                style={{ ...S.input, flex: 1, padding: "10px 12px", background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", textAlign: "center", fontSize: 16 }}
                            />
                        </div>

                        {/* Quick Select Emojis */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                            {["🎯", "💰", "🏠", "🚗", "✈️", "💻", "🎁", "🎓", "🏥", "🍔"].map((em) => (
                                <button
                                    key={em}
                                    type="button"
                                    onClick={() => setGoalForm((p) => ({ ...p, emoji: em }))}
                                    style={{
                                        background: goalForm.emoji === em ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${goalForm.emoji === em ? "#f97316" : "rgba(255,255,255,0.08)"}`,
                                        borderRadius: 8,
                                        width: 34,
                                        height: 34,
                                        fontSize: 16,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (goalForm.emoji !== em) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (goalForm.emoji !== em) {
                                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                        }
                                    }}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>

                        {/* Target Amount */}
                        <label style={{ ...S.label, marginBottom: 6 }}>Target Amount</label>
                        <div style={{ position: "relative", marginBottom: 16 }}>
                            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(240,236,228,0.4)", fontSize: 14, fontWeight: 700 }}>₹</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={goalForm.targetAmount}
                                onChange={(e) => setGoalForm((p) => ({ ...p, targetAmount: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") createGoal(); }}
                                style={{ ...S.input, paddingLeft: 30, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", fontFamily: "'JetBrains Mono',monospace", fontSize: 15 }}
                            />
                        </div>

                        {/* Target Date */}
                        <label style={{ ...S.label, marginBottom: 6 }}>Target Date / Deadline (optional)</label>
                        <input
                            type="date"
                            value={goalForm.deadline}
                            onChange={(e) => setGoalForm((p) => ({ ...p, deadline: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") createGoal(); }}
                            style={{ ...S.input, marginBottom: 24, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff" }}
                        />

                        {/* Action Buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button
                                onClick={() => setShowGoalModal(false)}
                                style={{
                                    ...S.btn,
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(240,236,228,0.6)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    padding: "10px 18px",
                                    fontSize: 13,
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                    e.currentTarget.style.color = "#ffffff";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                    e.currentTarget.style.color = "rgba(240,236,228,0.6)";
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createGoal}
                                style={{
                                    ...S.btn,
                                    background: "linear-gradient(135deg, #f97316, #fbbf24)",
                                    color: "#0d0d0f",
                                    fontWeight: 800,
                                    padding: "10px 18px",
                                    fontSize: 13,
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.03)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(249,115,22,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                Create Goal
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
