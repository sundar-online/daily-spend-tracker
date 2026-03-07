import { useState, useMemo } from "react";
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { MONTHS, CURRENT_MONTH, CURRENT_YEAR, TODAY, DEFAULT_CATS, DAY_NAMES } from "../utils/constants";
import { monthKey } from "../utils/storage";
import { S, FontLink } from "../styles/shared.jsx";
import MonthNavigator from "../components/MonthNavigator";
import AddExpenseModal from "../components/AddExpenseModal";
import CategoryManager from "../components/CategoryManager";
import NotesPanel from "../components/NotesPanel";

export default function Dashboard({
    username, allUserData, currentBudget,
    onAddExpense, onDeleteExpense, onLogout,
    onEditBudget, onSetupMonthBudget, onSaveCategories, onSaveNotes,
}) {
    const [showModal, setShowModal] = useState(false);
    const [showCatManager, setShowCatManager] = useState(false);
    const [tab, setTab] = useState("overview");
    const [filterCat, setFilterCat] = useState("All");

    const notes = allUserData?.notes || [];

    const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
    const [viewYear, setViewYear] = useState(CURRENT_YEAR);

    const isCurrentMonth = viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR;
    const isPastMonth = !isCurrentMonth;

    const goToPrev = () => {
        setTab("overview"); setFilterCat("All");
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else { setViewMonth(m => m - 1); }
    };
    const goToNext = () => {
        if (isCurrentMonth) return;
        setTab("overview"); setFilterCat("All");
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else { setViewMonth(m => m + 1); }
    };

    const vKey = monthKey(viewMonth, viewYear);
    const viewedMonthData = allUserData.months?.[vKey];
    const budget = viewedMonthData?.budget || null;
    const expenses = viewedMonthData?.expenses || [];

    const cats = allUserData?.customCategories ? { ...DEFAULT_CATS, ...allUserData.customCategories } : DEFAULT_CATS;
    const catKeys = Object.keys(cats);

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = budget ? budget.total - totalSpent : 0;
    const usedPct = budget ? Math.min(100, (totalSpent / budget.total) * 100) : 0;

    const catStats = useMemo(() => {
        const stats = {};
        catKeys.forEach(c => { stats[c] = { total: 0, subs: {} }; });
        expenses.forEach(e => {
            if (!stats[e.category]) stats[e.category] = { total: 0, subs: {} };
            stats[e.category].total += e.amount;
            if (!stats[e.category].subs[e.subCategory]) stats[e.category].subs[e.subCategory] = 0;
            stats[e.category].subs[e.subCategory] += e.amount;
        });
        return stats;
    }, [expenses, catKeys.join()]);

    const dailyStats = useMemo(() => {
        const byDate = {};
        expenses.forEach(e => { byDate[e.date] = (byDate[e.date] || 0) + e.amount; });
        return Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, amount]) => {
            const d = new Date(date + "T00:00:00");
            const dayName = DAY_NAMES[d.getDay()];
            const dayNum = date.slice(8);
            return { day: `${dayName} ${dayNum}`, amount };
        });
    }, [expenses]);

    const pieData = catKeys.map(c => ({ name: c, value: catStats[c]?.total || 0, color: cats[c]?.color || "#f97316" })).filter(d => d.value > 0);

    const filteredExpenses = useMemo(() => {
        const list = filterCat === "All" ? expenses : expenses.filter(e => e.category === filterCat);
        return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, filterCat]);

    const todayStr = TODAY.toISOString().split("T")[0];
    const todaySpent = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) return (
            <div style={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: "inherit" }}>
                {label && <div style={{ color: "rgba(240,236,228,0.4)", fontSize: 11, marginBottom: 4 }}>{label}</div>}
                <div style={{ color: "#fbbf24", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>₹{payload[0].value.toLocaleString()}</div>
            </div>
        );
        return null;
    };

    const allMonthKeys = Object.keys(allUserData.months || {}).sort();

    return (
        <div style={{ ...S.app }}>
            <FontLink />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 30% at 80% 10%, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />

            {/* STICKY HEADER */}
            <header className="dashboard-header" style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(13,13,15,0.92)", backdropFilter: "blur(14px)", zIndex: 100, gap: 12, flexWrap: "wrap" }}>
                <div className="header-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>💸</span>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 17, background: "linear-gradient(135deg,#f97316,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>SpendSmart</div>
                        <div style={{ color: "rgba(240,236,228,0.3)", fontSize: 10, marginTop: 1 }}>Smart Expense Tracker</div>
                    </div>
                </div>

                <MonthNavigator
                    viewMonth={viewMonth} viewYear={viewYear}
                    onPrev={goToPrev} onNext={goToNext}
                    isCurrentMonth={isCurrentMonth} isPastMonth={isPastMonth}
                />

                <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "rgba(240,236,228,0.4)", fontSize: 12 }}>👤 {username}</span>
                    <button onClick={onEditBudget} style={{ ...S.btn, background: "rgba(255,255,255,0.05)", color: "rgba(240,236,228,0.55)", border: "1px solid rgba(255,255,255,0.07)", padding: "6px 12px", fontSize: 12 }}>✏️ Budget</button>
                    <button onClick={() => setShowCatManager(true)} style={{ ...S.btn, background: "rgba(255,255,255,0.05)", color: "rgba(240,236,228,0.55)", border: "1px solid rgba(255,255,255,0.07)", padding: "6px 12px", fontSize: 12 }}>⚙️ Categories</button>
                    <button onClick={onLogout} style={{ ...S.btn, background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", padding: "6px 12px", fontSize: 12 }}>Logout</button>
                </div>
            </header>

            <div className="dashboard-main-layout" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 120px", display: "flex", gap: 24, alignItems: "flex-start" }}>

                {/* LEFT — NOTES PANEL */}
                <NotesPanel notes={notes} onSaveNotes={onSaveNotes} />

                {/* RIGHT — MAIN DASHBOARD CONTENT */}
                <div className="dashboard-content" style={{ flex: 1, minWidth: 0 }}>

                    {/* NO BUDGET BANNER */}
                    {!budget && (
                        <div style={{ ...S.card, marginBottom: 24, border: "1px dashed rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 15, color: "#f97316", marginBottom: 4 }}>
                                    {isPastMonth ? `📂 No budget data for ${MONTHS[viewMonth]} ${viewYear}` : "🚀 Set up your budget to get started"}
                                </div>
                                <div style={{ color: "rgba(240,236,228,0.4)", fontSize: 13 }}>
                                    {isPastMonth ? "This month has no recorded budget or expenses." : "Define your income sources and start tracking daily expenses."}
                                </div>
                            </div>
                            {isCurrentMonth && (
                                <button onClick={onSetupMonthBudget} style={{ ...S.btn, background: "linear-gradient(135deg,#f97316,#fbbf24)", color: "#0d0d0f", padding: "10px 22px", fontSize: 14, whiteSpace: "nowrap" }}>
                                    Set Budget →
                                </button>
                            )}
                        </div>
                    )}

                    {/* PAST MONTH NOTICE */}
                    {isPastMonth && budget && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 12, marginBottom: 20, fontSize: 13 }}>
                            <span style={{ fontSize: 16 }}>👁️</span>
                            <span style={{ color: "rgba(240,236,228,0.6)" }}>Viewing <strong style={{ color: "#60a5fa" }}>{MONTHS[viewMonth]} {viewYear}</strong> — read-only. Use the arrows to navigate months.</span>
                        </div>
                    )}

                    {/* HERO CARDS */}
                    {budget && (
                        <>
                            <div className="hero-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
                                {[
                                    { label: "Monthly Budget", val: `₹${budget.total.toLocaleString()}`, icon: "🎯", color: "#fbbf24", sub: budget.sources.map(s => s.name).join(" + ") },
                                    { label: "Total Spent", val: `₹${totalSpent.toLocaleString()}`, icon: "💸", color: "#f97316", sub: `${usedPct.toFixed(1)}% of budget` },
                                    { label: "Remaining", val: `₹${Math.abs(remaining).toLocaleString()}`, icon: remaining >= 0 ? "💚" : "🔴", color: remaining >= 0 ? "#10b981" : "#f87171", sub: remaining >= 0 ? "available" : "over budget!" },
                                    isCurrentMonth
                                        ? { label: "Today's Spend", val: `₹${todaySpent.toLocaleString()}`, icon: "📅", color: "#06b6d4", sub: `${expenses.filter(e => e.date === todayStr).length} transactions` }
                                        : { label: "Transactions", val: expenses.length.toString(), icon: "🧾", color: "#a78bfa", sub: `across ${pieData.length} categories` },
                                ].map((c, i) => (
                                    <div key={i} style={{ ...S.card, position: "relative", overflow: "hidden" }}>
                                        <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.05 }}>{c.icon}</div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,236,228,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: c.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{c.val}</div>
                                        <div style={{ fontSize: 11, color: "rgba(240,236,228,0.35)" }}>{c.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* BUDGET PROGRESS BAR */}
                            <div style={{ ...S.card, marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                    <span style={{ fontWeight: 700, fontSize: 14 }}>Budget Usage — {MONTHS[viewMonth]} {viewYear}</span>
                                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: usedPct > 90 ? "#f87171" : usedPct > 70 ? "#f97316" : "#10b981", fontWeight: 700 }}>{usedPct.toFixed(1)}%</span>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 12, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${usedPct}%`, background: usedPct > 90 ? "linear-gradient(90deg,#f87171,#ef4444)" : usedPct > 70 ? "linear-gradient(90deg,#f97316,#fbbf24)" : "linear-gradient(90deg,#10b981,#06b6d4)", borderRadius: 8, transition: "width .6s ease" }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                                    <span style={{ fontSize: 11, color: "rgba(240,236,228,0.25)" }}>₹0</span>
                                    <span style={{ fontSize: 11, color: "rgba(240,236,228,0.25)" }}>₹{budget.total.toLocaleString()}</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                                    {budget.sources.map((src, i) => (
                                        <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ["#f97316", "#fbbf24", "#06b6d4", "#10b981"][i % 4] }} />
                                            <span style={{ fontSize: 12, color: "rgba(240,236,228,0.5)" }}>{src.name}</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>₹{Number(src.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SPENDING SUMMARY + DAILY LINE CHART */}
                            {expenses.length > 0 && (() => {
                                const amounts = expenses.map(e => e.amount);
                                const byDate = {};
                                expenses.forEach(e => { byDate[e.date] = (byDate[e.date] || 0) + e.amount; });
                                const dailyAmounts = Object.values(byDate);
                                const maxDay = Math.max(...dailyAmounts);
                                const minDay = Math.min(...dailyAmounts);
                                const avgDay = dailyAmounts.reduce((s, v) => s + v, 0) / dailyAmounts.length;
                                const maxTx = Math.max(...amounts);
                                const minTx = Math.min(...amounts);
                                const avgTx = amounts.reduce((s, v) => s + v, 0) / amounts.length;
                                const lineData = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, total]) => {
                                    const d = new Date(date + "T00:00:00");
                                    const dayName = DAY_NAMES[d.getDay()];
                                    const dayNum = date.slice(8);
                                    return { day: `${dayName} ${dayNum}`, total };
                                });

                                return (
                                    <div style={{ ...S.card, marginBottom: 24 }}>
                                        <h4 style={{ margin: "0 0 18px", fontWeight: 800, fontSize: 15 }}>📊 Spending Summary — {MONTHS[viewMonth]}</h4>
                                        <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
                                            {[
                                                { label: "Highest Day", val: `₹${maxDay.toLocaleString()}`, color: "#f87171", icon: "📈", sub: `Single txn max: ₹${maxTx.toLocaleString()}` },
                                                { label: "Lowest Day", val: `₹${minDay.toLocaleString()}`, color: "#10b981", icon: "📉", sub: `Single txn min: ₹${minTx.toLocaleString()}` },
                                                { label: "Avg / Day", val: `₹${Math.round(avgDay).toLocaleString()}`, color: "#fbbf24", icon: "⚖️", sub: `Avg txn: ₹${Math.round(avgTx).toLocaleString()}` },
                                            ].map((s, i) => (
                                                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 12px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                                                    <div style={{ position: "absolute", top: -4, right: -2, fontSize: 28, opacity: 0.06 }}>{s.icon}</div>
                                                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "rgba(240,236,228,0.35)", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                                                    <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{s.val}</div>
                                                    <div style={{ fontSize: 10, color: "rgba(240,236,228,0.3)" }}>{s.sub}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,236,228,0.45)", marginBottom: 12 }}>Daily Expense Trend</div>
                                        <ResponsiveContainer width="100%" height={180}>
                                            <LineChart data={lineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" tick={{ fill: "rgba(240,236,228,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }}
                                                    formatter={v => [`₹${v.toLocaleString()}`, "Spent"]}
                                                    labelStyle={{ color: "rgba(240,236,228,0.5)", fontSize: 11 }}
                                                    itemStyle={{ color: "#fbbf24", fontWeight: 700 }}
                                                />
                                                <ReferenceLine y={avgDay} stroke="#fbbf24" strokeDasharray="6 4" strokeOpacity={0.5} label={{ value: `Avg ₹${Math.round(avgDay)}`, position: "right", fill: "#fbbf24", fontSize: 10, fontWeight: 700 }} />
                                                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#fbbf24", strokeWidth: 0 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                );
                            })()}
                        </>
                    )}

                    {/* MONTH HISTORY STRIP */}
                    {allMonthKeys.length > 1 && (
                        <div style={{ marginBottom: 20, overflowX: "auto" }}>
                            <div style={{ display: "flex", gap: 8, paddingBottom: 4, minWidth: "max-content" }}>
                                {allMonthKeys.map(k => {
                                    const [ky, km] = k.split("-");
                                    const m = parseInt(km) - 1; const y = parseInt(ky);
                                    const isActive = m === viewMonth && y === viewYear;
                                    const isNow = m === CURRENT_MONTH && y === CURRENT_YEAR;
                                    const mData = allUserData.months?.[k];
                                    const mSpent = (mData?.expenses || []).reduce((s, e) => s + e.amount, 0);
                                    return (
                                        <button key={k} onClick={() => { setViewMonth(m); setViewYear(y); setTab("overview"); setFilterCat("All"); }} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${isActive ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.07)"}`, background: isActive ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", transition: "all .15s", minWidth: 100, textAlign: "center" }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#f97316" : isNow ? "rgba(240,236,228,0.7)" : "rgba(240,236,228,0.4)", marginBottom: 2 }}>{MONTHS[m].slice(0, 3)} {ky}</div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: isActive ? "#fbbf24" : "rgba(240,236,228,0.5)", fontFamily: "'JetBrains Mono',monospace" }}>₹{mSpent.toLocaleString()}</div>
                                            {isNow && !isActive && <div style={{ fontSize: 9, fontWeight: 800, color: "#f97316", marginTop: 2, letterSpacing: .5 }}>CURRENT</div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TABS */}
                    {budget && (
                        <>
                            <div className="tabs-bar" style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, marginBottom: 20 }}>
                                {[["overview", "📊 Overview"], ["charts", "📈 Charts"], ["expenses", "🧾 Expenses"]].map(([t, l]) => (
                                    <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, background: tab === t ? "rgba(249,115,22,0.2)" : "transparent", color: tab === t ? "#f97316" : "rgba(240,236,228,0.4)", transition: "all .2s" }}>
                                        {l}
                                    </button>
                                ))}
                            </div>

                            {/* OVERVIEW TAB */}
                            {tab === "overview" && (
                                <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                                    {catKeys.map((c) => {
                                        const spent = catStats[c]?.total || 0;
                                        const topSubs = Object.entries(catStats[c]?.subs || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
                                        const color = cats[c]?.color || "#f97316";
                                        return (
                                            <div key={c} style={S.card}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cats[c]?.icon}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: 15 }}>{c}</div>
                                                            <div style={{ color: "rgba(240,236,228,0.35)", fontSize: 11 }}>{Object.keys(catStats[c]?.subs || {}).length} sub-categories</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color, fontSize: 18 }}>₹{spent.toLocaleString()}</div>
                                                        <div style={{ fontSize: 11, color: "rgba(240,236,228,0.3)" }}>{totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(1) : 0}% of total</div>
                                                    </div>
                                                </div>
                                                {spent > 0 ? (
                                                    <>
                                                        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 6, overflow: "hidden", marginBottom: 12 }}>
                                                            <div style={{ height: "100%", width: `${Math.min(100, (spent / (totalSpent || 1)) * 100)}%`, background: color, borderRadius: 6 }} />
                                                        </div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                            {topSubs.map(([sub, amt]) => (
                                                                <div key={sub} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                                                                    <span style={{ color: "rgba(240,236,228,0.5)" }}>· {sub}</span>
                                                                    <span style={{ color: "rgba(240,236,228,0.7)", fontFamily: "'JetBrains Mono',monospace" }}>₹{amt.toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ color: "rgba(240,236,228,0.2)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>No expenses</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* CHARTS TAB */}
                            {tab === "charts" && (
                                <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
                                    <div style={{ ...S.card, gridColumn: "1/-1" }}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📈 Daily Spending — {MONTHS[viewMonth]} {viewYear}</h4>
                                        {dailyStats.length === 0
                                            ? <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>No expenses recorded</p>
                                            : <ResponsiveContainer width="100%" height={180}>
                                                <AreaChart data={dailyStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isPastMonth ? "#60a5fa" : "#f97316"} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={isPastMonth ? "#60a5fa" : "#f97316"} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="day" tick={{ fill: "rgba(240,236,228,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey="amount" stroke={isPastMonth ? "#60a5fa" : "#f97316"} strokeWidth={2} fill="url(#ag2)" dot={{ fill: isPastMonth ? "#60a5fa" : "#f97316", strokeWidth: 0, r: 3 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        }
                                    </div>

                                    <div style={S.card}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📅 Spending by Day</h4>
                                        {(() => {
                                            const dayColors = ["#f97316", "#fbbf24", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899", "#3b82f6"];
                                            const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                            const byDay = {};
                                            expenses.forEach(exp => {
                                                const d = new Date(exp.date + "T00:00:00");
                                                const dayIdx = d.getDay();
                                                byDay[dayIdx] = (byDay[dayIdx] || 0) + exp.amount;
                                            });
                                            const dayPieData = Object.entries(byDay)
                                                .map(([idx, val]) => ({ name: dayLabels[idx], value: val, color: dayColors[idx] }))
                                                .sort((a, b) => dayLabels.indexOf(a.name) - dayLabels.indexOf(b.name));
                                            const dayTotal = dayPieData.reduce((s, d) => s + d.value, 0);
                                            if (dayPieData.length === 0) return <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>No data yet</p>;
                                            return (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie data={dayPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={dayPieData.length > 1 ? 3 : 0} dataKey="value">
                                                            {dayPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip formatter={(v) => [`₹${v.toLocaleString()} (${dayTotal > 0 ? ((v / dayTotal) * 100).toFixed(1) : 0}%)`, "Spent"]} contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }} itemStyle={{ color: "#fbbf24", fontWeight: 700 }} labelStyle={{ color: "#f0ece4" }} />
                                                        <Legend wrapperStyle={{ color: "rgba(240,236,228,0.5)", fontSize: 12 }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}
                                    </div>

                                    <div style={S.card}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📊 Category Breakdown</h4>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={catKeys.map(c => ({ name: c, spent: catStats[c]?.total || 0 }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="name" tick={{ fill: "rgba(240,236,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }} itemStyle={{ color: "#fbbf24", fontWeight: 700 }} labelStyle={{ color: "#f0ece4" }} />
                                                <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                                                    {catKeys.map((c, i) => <Cell key={i} fill={cats[c]?.color || "#f97316"} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {allMonthKeys.length > 1 && (
                                        <div style={{ ...S.card, gridColumn: "1/-1" }}>
                                            <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📅 Month-over-Month Comparison</h4>
                                            <ResponsiveContainer width="100%" height={160}>
                                                <BarChart
                                                    data={allMonthKeys.slice(-6).map(k => {
                                                        const [ky, km] = k.split("-");
                                                        const mData = allUserData.months?.[k];
                                                        const spent = (mData?.expenses || []).reduce((s, e) => s + e.amount, 0);
                                                        const bud = mData?.budget?.total || 0;
                                                        return { name: `${MONTHS[parseInt(km) - 1].slice(0, 3)} ${ky}`, Spent: spent, Budget: bud };
                                                    })}
                                                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                                >
                                                    <XAxis dataKey="name" tick={{ fill: "rgba(240,236,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }} itemStyle={{ color: "#fbbf24", fontWeight: 700 }} labelStyle={{ color: "#f0ece4" }} />
                                                    <Legend wrapperStyle={{ color: "rgba(240,236,228,0.5)", fontSize: 12 }} />
                                                    <Bar dataKey="Budget" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="Spent" fill="#f97316" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXPENSES TAB */}
                            {tab === "expenses" && (
                                <div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                        {["All", ...catKeys].map(c => (
                                            <button key={c} onClick={() => setFilterCat(c)} style={{ ...S.pill(filterCat === c, cats[c]?.color || "#f97316"), ...(c === "All" && filterCat === "All" ? { borderColor: "#fbbf24", color: "#fbbf24", background: "rgba(251,191,36,0.1)" } : {}) }}>
                                                {c !== "All" && cats[c]?.icon + " "}{c}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={S.card}>
                                        {filteredExpenses.length === 0
                                            ? <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>{isPastMonth ? "No expenses for this month." : "No expenses yet. Tap + to add one!"}</p>
                                            : filteredExpenses.map((e, i) => {
                                                const color = cats[e.category]?.color || "#f97316";
                                                return (
                                                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < filteredExpenses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                                            {cats[e.category]?.icon || "💳"}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{e.subCategory}</div>
                                                            <div style={{ color: "rgba(240,236,228,0.35)", fontSize: 11, marginTop: 2 }}>
                                                                <span style={{ color, fontWeight: 600 }}>{e.category}</span>
                                                                {" · "}{e.date}
                                                                {e.note && ` · ${e.note}`}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: "#f87171", fontSize: 15, flexShrink: 0 }}>
                                                            -₹{e.amount.toLocaleString()}
                                                        </div>
                                                        <button
                                                            onClick={(ev) => { ev.stopPropagation(); onDeleteExpense(e.id); }}
                                                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}
                                                            onMouseEnter={ev => { ev.currentTarget.style.background = "rgba(248,113,113,0.25)"; ev.currentTarget.style.borderColor = "rgba(248,113,113,0.5)"; }}
                                                            onMouseLeave={ev => { ev.currentTarget.style.background = "rgba(248,113,113,0.1)"; ev.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
                                                            title="Delete expense"
                                                        >🗑️</button>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* FAB */}
            {isCurrentMonth && currentBudget && (
                <button
                    onClick={() => setShowModal(true)}
                    style={{ position: "fixed", bottom: 28, right: 28, width: 60, height: 60, borderRadius: 30, background: "linear-gradient(135deg,#f97316,#fbbf24)", border: "none", color: "#0d0d0f", fontSize: 28, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 30px rgba(249,115,22,0.4)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .2s, box-shadow .2s" }}
                    onMouseEnter={e => { e.target.style.transform = "scale(1.1)"; e.target.style.boxShadow = "0 8px 40px rgba(249,115,22,0.6)"; }}
                    onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 6px 30px rgba(249,115,22,0.4)"; }}
                >+</button>
            )}

            {/* MODALS */}
            {showModal && currentBudget && (
                <AddExpenseModal budget={currentBudget} onAdd={onAddExpense} onClose={() => setShowModal(false)} />
            )}
            {showCatManager && (
                <CategoryManager
                    customCategories={allUserData?.customCategories}
                    onSave={onSaveCategories}
                    onClose={() => setShowCatManager(false)}
                />
            )}
        </div>
    );
}
