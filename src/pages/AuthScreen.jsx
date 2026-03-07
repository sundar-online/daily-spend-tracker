import { useState } from "react";
import { S, FontLink } from "../styles/shared.jsx";

export default function AuthScreen({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [f, setF] = useState({ username: "", password: "", confirm: "" });
    const [err, setErr] = useState("");

    const submit = (e) => {
        e.preventDefault();
        setErr("");
        const users = JSON.parse(localStorage.getItem("setUsers") || "{}");
        if (!f.username.trim() || !f.password) return setErr("All fields required.");
        if (mode === "signup") {
            if (f.password !== f.confirm) return setErr("Passwords don't match.");
            if (users[f.username]) return setErr("Username taken.");
            users[f.username] = f.password;
            localStorage.setItem("setUsers", JSON.stringify(users));
            return onLogin(f.username);
        }
        if (!users[f.username] || users[f.username] !== f.password)
            return setErr("Invalid credentials.");
        onLogin(f.username);
    };

    return (
        <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <FontLink />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)" }} />
            <div style={{ width: "100%", maxWidth: 420, position: "relative" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div style={{ fontSize: 56, marginBottom: 8 }}>💸</div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, background: "linear-gradient(135deg,#f97316,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SpendSmart</h1>
                    <p style={{ color: "rgba(240,236,228,0.4)", margin: "8px 0 0", fontSize: 14 }}>Track every rupee, own every day</p>
                </div>
                <div style={{ ...S.card }}>
                    <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3, marginBottom: 28 }}>
                        {["login", "signup"].map(t => (
                            <button key={t} onClick={() => { setMode(t); setErr(""); }} style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: mode === t ? "rgba(249,115,22,0.25)" : "transparent", color: mode === t ? "#f97316" : "rgba(240,236,228,0.4)", transition: "all .2s" }}>
                                {t === "login" ? "Log In" : "Sign Up"}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={submit}>
                        {["username", "password", ...(mode === "signup" ? ["confirm"] : [])].map(k => (
                            <div key={k} style={{ marginBottom: 16 }}>
                                <label style={S.label}>{k === "confirm" ? "Confirm Password" : k}</label>
                                <input type={k === "username" ? "text" : "password"} value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} placeholder={k === "confirm" ? "Re-enter password" : k === "username" ? "your username" : "••••••••"} style={S.input} />
                            </div>
                        ))}
                        {err && <p style={{ color: "#f87171", fontSize: 12, textAlign: "center", margin: "0 0 12px" }}>{err}</p>}
                        <button type="submit" style={{ ...S.btn, width: "100%", background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", fontSize: 15, padding: "14px" }}>
                            {mode === "login" ? "Log In →" : "Create Account →"}
                        </button>
                    </form>
                    <p style={{ textAlign: "center", color: "rgba(240,236,228,0.2)", fontSize: 11, marginTop: 20, marginBottom: 0 }}>Demo: sign up with any credentials</p>
                </div>
            </div>
        </div>
    );
}
