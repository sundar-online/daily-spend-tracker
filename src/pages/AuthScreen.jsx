import { useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { S, FontLink } from "../styles/shared.jsx";
import { auth } from "../utils/firebaseClient";

export default function AuthScreen({ onLogin }) {
    const [mode, setMode] = useState("login");
    const [f, setF] = useState({ email: "", password: "", confirm: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        if (!f.email.trim() || !f.password) return setErr("All fields required.");

        setLoading(true);
        try {
            if (mode === "signup") {
                if (f.password !== f.confirm) { setLoading(false); return setErr("Passwords don't match."); }
                if (f.password.length < 6) { setLoading(false); return setErr("Password must be at least 6 characters."); }
                const cred = await createUserWithEmailAndPassword(auth, f.email.trim(), f.password);
                onLogin({ id: cred.user.uid, email: cred.user.email });
            } else {
                const cred = await signInWithEmailAndPassword(auth, f.email.trim(), f.password);
                onLogin({ id: cred.user.uid, email: cred.user.email });
            }
        } catch (ex) {
            // Map Firebase error codes to friendly messages
            const code = ex.code || "";
            if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setErr("Invalid email or password.");
            } else if (code === "auth/email-already-in-use") {
                setErr("An account with this email already exists.");
            } else if (code === "auth/invalid-email") {
                setErr("Please enter a valid email address.");
            } else if (code === "auth/too-many-requests") {
                setErr("Too many attempts. Please try again later.");
            } else {
                setErr(ex.message || "Something went wrong.");
            }
        }
        setLoading(false);
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
                        <div style={{ marginBottom: 16 }}>
                            <label style={S.label}>Email</label>
                            <input type="email" value={f.email} onChange={e => setF(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" style={S.input} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={S.label}>Password</label>
                            <input type="password" value={f.password} onChange={e => setF(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" style={S.input} />
                        </div>
                        {mode === "signup" && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={S.label}>Confirm Password</label>
                                <input type="password" value={f.confirm} onChange={e => setF(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter password" style={S.input} />
                            </div>
                        )}
                        {err && <p style={{ color: "#f87171", fontSize: 12, textAlign: "center", margin: "0 0 12px" }}>{err}</p>}
                        <button type="submit" disabled={loading} style={{ ...S.btn, width: "100%", background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", fontSize: 15, padding: "14px", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Please wait…" : mode === "login" ? "Log In →" : "Create Account →"}
                        </button>
                    </form>
                    <p style={{ textAlign: "center", color: "rgba(240,236,228,0.2)", fontSize: 11, marginTop: 20, marginBottom: 0 }}>Sign up with your email &amp; password (min 6 chars)</p>
                </div>
            </div>
        </div>
    );
}
