import { useState } from "react";
import { S } from "../styles/shared.jsx";
import { DEFAULT_CATS, EMOJI_OPTIONS, COLOR_OPTIONS } from "../utils/constants";

export default function CategoryManager({ customCategories, onSave, onClose }) {
    const [cats, setCats] = useState(() => {
        const merged = {};
        Object.entries(DEFAULT_CATS).forEach(([k, v]) => {
            merged[k] = { ...v, isDefault: true, subs: [...v.subs] };
        });
        Object.entries(customCategories || {}).forEach(([k, v]) => {
            if (merged[k]) {
                const allSubs = [...new Set([...merged[k].subs, ...(v.subs || [])])];
                merged[k] = { ...merged[k], ...v, subs: allSubs, isDefault: true };
            } else {
                merged[k] = { ...v, isDefault: false, subs: [...(v.subs || [])] };
            }
        });
        return merged;
    });

    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIcon, setNewIcon] = useState("💳");
    const [newColor, setNewColor] = useState("#f97316");
    const [newSubs, setNewSubs] = useState("");
    const [editIcon, setEditIcon] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editSubs, setEditSubs] = useState([]);
    const [addSubText, setAddSubText] = useState("");

    const startEdit = (name) => {
        setEditing(name);
        setEditIcon(cats[name].icon);
        setEditColor(cats[name].color);
        setEditSubs([...cats[name].subs]);
        setAddSubText("");
        setAdding(false);
    };

    const saveEdit = () => {
        if (!editing) return;
        setCats(prev => ({ ...prev, [editing]: { ...prev[editing], icon: editIcon, color: editColor, subs: editSubs } }));
        setEditing(null);
    };

    const addCategory = () => {
        const name = newName.trim();
        if (!name) return alert("Enter a category name.");
        if (Object.keys(cats).find(k => k.toLowerCase() === name.toLowerCase())) return alert("Category already exists.");
        const subs = newSubs.split(",").map(s => s.trim()).filter(Boolean);
        setCats(prev => ({ ...prev, [name]: { icon: newIcon, color: newColor, subs, isDefault: false } }));
        setNewName(""); setNewIcon("💳"); setNewColor("#f97316"); setNewSubs("");
        setAdding(false);
    };

    const deleteCategory = (name) => {
        if (cats[name]?.isDefault) return alert("Default categories cannot be deleted.");
        if (!confirm(`Delete "${name}" category? Existing expenses under this category will still be visible.`)) return;
        setCats(prev => { const next = { ...prev }; delete next[name]; return next; });
        if (editing === name) setEditing(null);
    };

    const handleSave = () => {
        const custom = {};
        Object.entries(cats).forEach(([k, v]) => {
            if (!v.isDefault) {
                custom[k] = { icon: v.icon, color: v.color, subs: v.subs };
            } else {
                const defaultSubs = DEFAULT_CATS[k]?.subs || [];
                const extraSubs = v.subs.filter(s => !defaultSubs.includes(s));
                if (extraSubs.length > 0 || v.icon !== DEFAULT_CATS[k]?.icon || v.color !== DEFAULT_CATS[k]?.color) {
                    custom[k] = { icon: v.icon, color: v.color, subs: v.subs };
                }
            }
        });
        onSave(custom);
        onClose();
    };

    const sectionStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16, marginBottom: 12 };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ ...S.card, width: "100%", maxWidth: 520, background: "#12121a", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>⚙️ Manage Categories</h3>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(240,236,228,0.6)", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>

                {/* Category List */}
                {Object.entries(cats).map(([name, c]) => (
                    <div key={name} style={sectionStyle}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                                    <div style={{ fontSize: 11, color: "rgba(240,236,228,0.35)" }}>{c.subs.length} subs{c.isDefault ? " · Default" : " · Custom"}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => editing === name ? setEditing(null) : startEdit(name)} style={{ ...S.btn, background: editing === name ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)", color: editing === name ? "#f97316" : "rgba(240,236,228,0.5)", padding: "6px 12px", fontSize: 12, border: editing === name ? "1px solid rgba(249,115,22,0.3)" : "none" }}>{editing === name ? "Close" : "✏️"}</button>
                                {!c.isDefault && (
                                    <button onClick={() => deleteCategory(name)} style={{ ...S.btn, background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "6px 10px", fontSize: 12, border: "none" }}>🗑️</button>
                                )}
                            </div>
                        </div>

                        {/* Edit Panel */}
                        {editing === name && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <label style={S.label}>Icon</label>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                                    {EMOJI_OPTIONS.map(e => (
                                        <button key={e} onClick={() => setEditIcon(e)} style={{ width: 36, height: 36, borderRadius: 8, border: editIcon === e ? `2px solid ${editColor}` : "1px solid rgba(255,255,255,0.08)", background: editIcon === e ? editColor + "22" : "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
                                    ))}
                                </div>

                                <label style={S.label}>Color</label>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                                    {COLOR_OPTIONS.map(col => (
                                        <button key={col} onClick={() => setEditColor(col)} style={{ width: 32, height: 32, borderRadius: "50%", border: editColor === col ? "3px solid #f0ece4" : "2px solid transparent", background: col, cursor: "pointer", transition: "transform .15s", transform: editColor === col ? "scale(1.2)" : "scale(1)" }} />
                                    ))}
                                </div>

                                <label style={S.label}>Sub-Categories</label>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                                    {editSubs.map((s, i) => (
                                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(240,236,228,0.7)" }}>
                                            {s}
                                            <button onClick={() => setEditSubs(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "rgba(248,113,113,0.7)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input type="text" placeholder="Add sub-category…" value={addSubText} onChange={e => setAddSubText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && addSubText.trim()) { setEditSubs(prev => [...prev, addSubText.trim()]); setAddSubText(""); } }} style={{ ...S.input, flex: 1, fontSize: 12 }} />
                                    <button onClick={() => { if (addSubText.trim()) { setEditSubs(prev => [...prev, addSubText.trim()]); setAddSubText(""); } }} style={{ ...S.btn, background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)", padding: "8px 14px", fontSize: 12 }}>+</button>
                                </div>

                                <button onClick={saveEdit} style={{ ...S.btn, width: "100%", marginTop: 14, background: "linear-gradient(135deg," + editColor + "," + editColor + "aa)", color: "#fff", fontSize: 13, padding: "10px" }}>Save Changes</button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add New Category */}
                {!adding ? (
                    <button onClick={() => { setAdding(true); setEditing(null); }} style={{ ...S.btn, width: "100%", background: "rgba(255,255,255,0.04)", color: "rgba(240,236,228,0.5)", border: "1px dashed rgba(255,255,255,0.15)", padding: "14px", fontSize: 14, marginBottom: 16 }}>
                        + Add New Category
                    </button>
                ) : (
                    <div style={{ ...sectionStyle, border: "1px solid rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.04)" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#f97316" }}>New Category</div>

                        <label style={S.label}>Name</label>
                        <input type="text" placeholder="e.g. Entertainment" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...S.input, marginBottom: 14 }} />

                        <label style={S.label}>Icon</label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                            {EMOJI_OPTIONS.map(e => (
                                <button key={e} onClick={() => setNewIcon(e)} style={{ width: 36, height: 36, borderRadius: 8, border: newIcon === e ? `2px solid ${newColor}` : "1px solid rgba(255,255,255,0.08)", background: newIcon === e ? newColor + "22" : "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{e}</button>
                            ))}
                        </div>

                        <label style={S.label}>Color</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                            {COLOR_OPTIONS.map(col => (
                                <button key={col} onClick={() => setNewColor(col)} style={{ width: 32, height: 32, borderRadius: "50%", border: newColor === col ? "3px solid #f0ece4" : "2px solid transparent", background: col, cursor: "pointer", transition: "transform .15s", transform: newColor === col ? "scale(1.2)" : "scale(1)" }} />
                            ))}
                        </div>

                        <label style={S.label}>Sub-Categories (comma separated)</label>
                        <input type="text" placeholder="e.g. Movies, Netflix, Games" value={newSubs} onChange={e => setNewSubs(e.target.value)} style={{ ...S.input, marginBottom: 14 }} />

                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={addCategory} style={{ ...S.btn, flex: 1, background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", fontSize: 14, padding: "12px" }}>Add Category</button>
                            <button onClick={() => setAdding(false)} style={{ ...S.btn, background: "rgba(255,255,255,0.06)", color: "rgba(240,236,228,0.5)", padding: "12px 18px", fontSize: 13 }}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Save All */}
                <button onClick={handleSave} style={{ ...S.btn, width: "100%", background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "#fff", fontSize: 15, padding: "14px", marginTop: 4 }}>
                    💾 Save All Categories
                </button>
            </div>
        </div>
    );
}
