import { useState } from "react";
import { S } from "../styles/shared.jsx";

export default function NotesPanel({ notes, onSaveNotes }) {
    const [noteText, setNoteText] = useState("");
    const [noteAmount, setNoteAmount] = useState("");

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
                        style={{ ...S.input, fontSize: 12, marginBottom: 8 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                        <input
                            type="number"
                            placeholder="₹ Amount"
                            value={noteAmount}
                            onChange={(e) => setNoteAmount(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                            style={{ ...S.input, flex: 1, fontSize: 12 }}
                        />
                        <button
                            onClick={addNote}
                            style={{ ...S.btn, background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", padding: "8px 16px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}
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
            </div>
        </div>
    );
}
