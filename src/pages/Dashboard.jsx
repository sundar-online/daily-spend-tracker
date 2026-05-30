/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useMemo, useEffect } from "react";
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { MONTHS, CURRENT_MONTH, CURRENT_YEAR, TODAY, DEFAULT_CATS, DAY_NAMES } from "../utils/constants";
import { monthKey } from "../utils/storage";
import { S, FontLink } from "../styles/shared.jsx";
import MonthNavigator from "../components/MonthNavigator";
import AddExpenseModal from "../components/AddExpenseModal";
import NotesPanel from "../components/NotesPanel";
import RecurringManagerModal from "../components/RecurringManagerModal";
import CategoryManager from "../components/CategoryManager";

const CustomBar = (props) => {
    const { x, y, width, height, fill, payload, active } = props;
    const value = payload.spent;
    if (value === 0) {
        return <rect x={x} y={y} width={width} height={0} opacity={0} />;
    }
    return (
        <g>
            {active && (
                <rect
                    x={x - 4}
                    y={y}
                    width={width + 8}
                    height={height}
                    fill="rgba(255, 255, 255, 0.08)"
                    rx={6}
                    ry={6}
                />
            )}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                rx={6}
                ry={6}
            />
        </g>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
        <div style={{ pointerEvents: "none", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontFamily: "inherit" }}>
            {label && <div style={{ color: "rgba(240,236,228,0.4)", fontSize: 11, marginBottom: 4 }}>{label}</div>}
            <div style={{ color: "#fbbf24", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>₹{payload[0].value.toLocaleString()}</div>
        </div>
    );
    return null;
};

export default function Dashboard({
    username, allUserData, currentBudget,
    onAddExpense, onDeleteExpense, onLogout,
    onEditBudget, onSetupMonthBudget, onSaveCategories, onSaveNotes,
    onSaveSavingsGoal, onContributeToGoal, onDeleteSavingsGoal,
    showToast, askConfirm,
}) {
    const [showModal, setShowModal] = useState(false);
    const [showCatManager, setShowCatManager] = useState(false);
    const [tab, setTab] = useState("overview");
    const [filterCat, setFilterCat] = useState("All");
    const [filterDate, setFilterDate] = useState("");

    const [dailyTrendActive, setDailyTrendActive] = useState(false);
    const [dailySpendingActive, setDailySpendingActive] = useState(false);
    const [categoryBreakdownActive, setCategoryBreakdownActive] = useState(false);
    const [momActive, setMomActive] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDayLabel, setSelectedDayLabel] = useState(null);
    const [selectedYearMonthKey, setSelectedYearMonthKey] = useState(null);
    const [selectedYearMonthLabel, setSelectedYearMonthLabel] = useState(null);
    const [lastSelectedMonthKey, setLastSelectedMonthKey] = useState(null);

    useEffect(() => {
        if (selectedYearMonthKey) {
            setLastSelectedMonthKey(selectedYearMonthKey);
        }
    }, [selectedYearMonthKey]);

    useEffect(() => {
        const handleGlobalClick = () => {
            setDailyTrendActive(false);
            setDailySpendingActive(false);
            setCategoryBreakdownActive(false);
            setMomActive(false);
            setShowProfileMenu(false);
        };
        window.addEventListener("click", handleGlobalClick);
        return () => window.removeEventListener("click", handleGlobalClick);
    }, []);

    const notes = allUserData?.notes || [];
    const savingsGoals = allUserData?.savingsGoals || [];

    const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
    const [viewYear, setViewYear] = useState(CURRENT_YEAR);

    const isCurrentMonth = viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR;
    const isPastMonth = !isCurrentMonth;

    const goToPrev = () => {
        setTab("overview"); setFilterCat("All"); setFilterDate("");
        setSelectedDate(null); setSelectedDayLabel(null);
        setSelectedYearMonthKey(null); setSelectedYearMonthLabel(null);
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else { setViewMonth(m => m - 1); }
    };
    const goToNext = () => {
        if (isCurrentMonth) return;
        setTab("overview"); setFilterCat("All"); setFilterDate("");
        setSelectedDate(null); setSelectedDayLabel(null);
        setSelectedYearMonthKey(null); setSelectedYearMonthLabel(null);
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
        const localCatKeys = Object.keys(cats);
        const stats = {};
        localCatKeys.forEach(c => { stats[c] = { total: 0, subs: {} }; });
        expenses.forEach(e => {
            if (!stats[e.category]) stats[e.category] = { total: 0, subs: {} };
            stats[e.category].total += e.amount;
            if (!stats[e.category].subs[e.subCategory]) stats[e.category].subs[e.subCategory] = 0;
            stats[e.category].subs[e.subCategory] += e.amount;
        });
        return stats;
    }, [expenses, cats]);

    const sortedCategories = useMemo(() => {
        return [...catKeys].sort((a, b) => {
            const spentA = catStats[a]?.total || 0;
            const spentB = catStats[b]?.total || 0;
            if (spentA > 0 && spentB === 0) return -1;
            if (spentB > 0 && spentA === 0) return 1;
            return spentB - spentA;
        });
    }, [catKeys, catStats]);

    const dailyStats = useMemo(() => {
        const dailyTotals = {};
        expenses.forEach(e => {
            dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
        });

        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const lastDay = (viewMonth === CURRENT_MONTH && viewYear === CURRENT_YEAR)
            ? Math.min(TODAY.getDate(), daysInMonth)
            : daysInMonth;

        const allDays = [];
        for (let d = 1; d <= lastDay; d++) {
            const mm = String(viewMonth + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            const dateKey = `${viewYear}-${mm}-${dd}`;
            
            const tempDate = new Date(viewYear, viewMonth, d);
            const dayName = DAY_NAMES[tempDate.getDay()];
            
            allDays.push({
                day: `${dayName} ${dd}`,
                amount: dailyTotals[dateKey] ?? 0,
                date: dateKey,
            });
        }
        return allDays;
    }, [viewYear, viewMonth, expenses]);

    const pieData = Object.keys(cats).map(c => ({ name: c, value: catStats[c]?.total || 0, color: cats[c]?.color || "#f97316" })).filter(d => d.value > 0);

    const categoryBreakdownData = useMemo(() => {
        const localCatKeys = Object.keys(cats);
        const totals = {};
        localCatKeys.forEach((cat) => {
            totals[cat] = 0;
        });

        expenses.forEach((exp) => {
            if (totals[exp.category] === undefined) return;
            const amount = Number(exp.amount);
            if (!Number.isFinite(amount) || amount <= 0) return;
            totals[exp.category] += amount;
        });

        // Normalization guard
        const maxValue = Math.max(...Object.values(totals).filter(
            v => typeof v === 'number' && !isNaN(v)
        ), 1);
        const MAX_BAR_HEIGHT_PX = 180;
        const getBarHeight = (val) => 
            (typeof val === 'number' && val > 0) 
                ? (val / maxValue) * MAX_BAR_HEIGHT_PX 
                : 0;

        return localCatKeys.map((cat) => ({
            name: cat,
            spent: Number.isFinite(totals[cat]) ? totals[cat] : 0,
            barHeight: getBarHeight(totals[cat]),
            fill: cats[cat]?.color || "#f97316"
        }));
    }, [expenses, cats]);

    const categoryBreakdownMaxValue = useMemo(() => {
        const values = categoryBreakdownData.map(d => d.spent);
        return Math.max(...values.filter(v => typeof v === 'number' && !isNaN(v)), 1);
    }, [categoryBreakdownData]);

    const filteredExpenses = useMemo(() => {
        let list = filterCat === "All" ? expenses : expenses.filter(e => e.category === filterCat);
        if (filterDate) list = list.filter(e => e.date === filterDate);
        return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, filterCat, filterDate]);

    const todayStr = TODAY.toISOString().split("T")[0];
    const todaySpent = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);

    const allMonthKeys = Object.keys(allUserData.months || {}).sort();

    const yearlyOverviewData = useMemo(() => {
        const data = [];
        const localCatKeys = Object.keys(cats);
        for (let m = 0; m < 12; m++) {
            const key = monthKey(m, viewYear);
            const monthData = allUserData.months?.[key] || {};
            const monthExpenses = monthData.expenses || [];

            const row = {
                month: MONTHS[m].slice(0, 3), // "Jan", "Feb", etc.
                monthFull: MONTHS[m],
                key,
                total: 0,
            };

            localCatKeys.forEach(cat => {
                row[cat] = 0;
            });

            monthExpenses.forEach(exp => {
                if (row[exp.category] !== undefined) {
                    row[exp.category] += exp.amount;
                } else {
                    row[exp.category] = exp.amount;
                }
                row.total += exp.amount;
            });

            data.push(row);
        }
        return data;
    }, [viewYear, allUserData.months, cats]);

    const monthlyBreakdownStats = useMemo(() => {
        if (!lastSelectedMonthKey) return null;
        const targetMonthData = allUserData.months?.[lastSelectedMonthKey] || {};
        const targetExpenses = targetMonthData.expenses || [];
        const targetTotal = targetExpenses.reduce((s, e) => s + e.amount, 0);
        const targetCount = targetExpenses.length;

        const [yStr, mStr] = lastSelectedMonthKey.split("-");
        const year = parseInt(yStr, 10);
        const mIdx = parseInt(mStr, 10) - 1;
        const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
        const averageDailySpend = targetTotal / daysInMonth;

        const categorySpends = {};
        Object.keys(cats).forEach(cat => {
            categorySpends[cat] = 0;
        });
        targetExpenses.forEach(exp => {
            const cat = exp.category;
            categorySpends[cat] = (categorySpends[cat] || 0) + exp.amount;
        });

        const activeCategorySpends = Object.entries(categorySpends).filter(([_, amt]) => amt > 0);

        let highestCategoryText = "None";
        let lowestCategoryText = "None";

        if (activeCategorySpends.length > 0) {
            const maxSpend = Math.max(...activeCategorySpends.map(([_, amt]) => amt));
            const highestCats = activeCategorySpends.filter(([_, amt]) => amt === maxSpend).map(([cat]) => {
                const icon = cats[cat]?.icon || "📁";
                return `${icon} ${cat}`;
            });
            highestCategoryText = `${highestCats.join(" & ")} (₹${maxSpend.toLocaleString()})`;

            const minSpend = Math.min(...activeCategorySpends.map(([_, amt]) => amt));
            const lowestCats = activeCategorySpends.filter(([_, amt]) => amt === minSpend).map(([cat]) => {
                const icon = cats[cat]?.icon || "📁";
                return `${icon} ${cat}`;
            });
            lowestCategoryText = `${lowestCats.join(" & ")} (₹${minSpend.toLocaleString()})`;
        }

        const categoryBreakdownList = activeCategorySpends.sort((a, b) => b[1] - a[1]);

        return {
            total: targetTotal,
            count: targetCount,
            averageDailySpend,
            highestCategoryText,
            lowestCategoryText,
            categoryBreakdownList,
        };
    }, [lastSelectedMonthKey, allUserData.months, cats]);

    const CustomYearlyTooltip = ({ active, payload }) => {
        if (active && payload?.length) {
            const data = payload[0].payload;
            const breakdown = Object.entries(data)
                .filter(([key, val]) => catKeys.includes(key) && typeof val === "number" && val > 0)
                .sort((a, b) => b[1] - a[1]);

            return (
                <div style={{ pointerEvents: "none", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", fontFamily: "inherit" }}>
                    <div style={{ color: "rgba(240,236,228,0.5)", fontSize: 11, marginBottom: 6 }}>
                        {data.monthFull} {viewYear}
                    </div>
                    {breakdown.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                            {breakdown.map(([cat, val]) => {
                                const icon = cats[cat]?.icon || "📁";
                                const color = cats[cat]?.color || "#f97316";
                                return (
                                    <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontSize: 12 }}>
                                        <span style={{ color: "rgba(240,236,228,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <span>{icon}</span> {cat}
                                        </span>
                                        <span style={{ color, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                                            ₹{val.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ color: "rgba(240,236,228,0.3)", fontSize: 12, marginBottom: 8 }}>
                            No expenses
                        </div>
                    )}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, fontSize: 12 }}>
                        <span style={{ color: "rgba(240,236,228,0.5)", fontWeight: 600 }}>Total Spent</span>
                        <span style={{ color: "#fbbf24", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                            ₹{data.total.toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomMomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const budgetVal = payload.find(p => p.dataKey === "Budget")?.value ?? 0;
            const spentVal = payload.find(p => p.dataKey === "Spent")?.value ?? 0;

            return (
                <div style={{
                    pointerEvents: "none",
                    background: "#1a1a20",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontFamily: "inherit",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    minWidth: 120,
                }}>
                    <div style={{ color: "rgba(240,236,228,0.5)", fontWeight: 600, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 4, marginBottom: 2 }}>
                        {label}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <span style={{ color: "rgba(240,236,228,0.7)" }}>Budget:</span>
                        <span style={{ color: "rgba(240,236,228,0.9)", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                            ₹{budgetVal.toLocaleString()}
                        </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <span style={{ color: "rgba(240,236,228,0.7)" }}>Spent:</span>
                        <span style={{ color: "#f97316", fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>
                            ₹{spentVal.toLocaleString()}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ ...S.app }}>
            <FontLink />
            <style>{`
                .recharts-wrapper:focus, 
                .recharts-wrapper *:focus {
                    outline: none !important;
                    box-shadow: none !important;
                }
                /* Remove default white backgrounds and borders from Recharts tooltips */
                .recharts-tooltip-wrapper,
                .recharts-default-tooltip {
                    background-color: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                /* Hide native input number spinners */
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
                /* Make calendar picker icon visible and interactive on dark backgrounds */
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.6;
                    cursor: pointer;
                    transition: opacity 0.15s ease;
                }
                input[type="date"]::-webkit-calendar-picker-indicator:hover {
                    opacity: 0.95;
                }
                /* Header layout and responsiveness using CSS Grid */
                .dashboard-header {
                    display: grid !important;
                    grid-template-columns: 1fr auto 1fr !important;
                    align-items: center !important;
                }
                .header-brand {
                    grid-row: 1 !important;
                    grid-column: 1 !important;
                    justify-self: start !important;
                }
                .month-navigator-wrap {
                    grid-row: 1 !important;
                    grid-column: 2 !important;
                    justify-self: center !important;
                }
                .header-actions {
                    grid-row: 1 !important;
                    grid-column: 3 !important;
                    justify-self: end !important;
                }
                @media (max-width: 768px) {
                    .dashboard-header {
                        grid-template-columns: 1fr 1fr !important;
                        row-gap: 10px !important;
                    }
                    .header-brand {
                        grid-row: 1 !important;
                        grid-column: 1 !important;
                        justify-self: start !important;
                    }
                    .header-actions {
                        grid-row: 1 !important;
                        grid-column: 2 !important;
                        justify-self: end !important;
                    }
                    .month-navigator-wrap {
                        grid-row: 2 !important;
                        grid-column: 1 / span 2 !important;
                        justify-self: center !important;
                        width: 100%;
                        display: flex;
                        justify-content: center;
                        margin-top: 4px;
                    }
                }
            `}</style>
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 50% 30% at 80% 10%, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />

            {/* STICKY HEADER */}
            <header className="dashboard-header" style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(13,13,15,0.92)", backdropFilter: "blur(14px)", zIndex: 100 }}>
                <div className="header-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>💸</span>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 17, background: "linear-gradient(135deg,#f97316,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>SpendSmart</div>
                        <div style={{ color: "rgba(240,236,228,0.3)", fontSize: 10, marginTop: 1 }}>Smart Expense Tracker</div>
                    </div>
                </div>

                <div className="month-navigator-wrap">
                    <MonthNavigator
                        viewMonth={viewMonth} viewYear={viewYear}
                        onPrev={goToPrev} onNext={goToNext}
                        isCurrentMonth={isCurrentMonth} isPastMonth={isPastMonth}
                    />
                </div>

                <div className="header-actions" style={{ position: "relative" }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileMenu(!showProfileMenu);
                        }}
                        style={{
                            ...S.btn,
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            padding: "6px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 12,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #f97316, #fbbf24)",
                            color: "#0d0d0f",
                            fontWeight: 800,
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            {username ? username.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span style={{ fontSize: 12, color: "rgba(240, 236, 228, 0.8)", fontWeight: 600 }}>Profile</span>
                        <span style={{ fontSize: 10, color: "rgba(240, 236, 228, 0.4)", transform: showProfileMenu ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                    </button>

                    {showProfileMenu && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: "absolute",
                                right: 0,
                                top: "calc(100% + 8px)",
                                width: 240,
                                background: "#12121a",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: 16,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                                backdropFilter: "blur(12px)",
                                padding: 14,
                                zIndex: 1000,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {/* User Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    fontSize: 16,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    👤
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 10, color: "rgba(240, 236, 228, 0.3)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>Logged In As</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={username}>
                                        {username}
                                    </div>
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        onEditBudget();
                                    }}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "rgba(240, 236, 228, 0.8)",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                        e.currentTarget.style.color = "#ffffff";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "rgba(240, 236, 228, 0.8)";
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>✏️</span> Adjust Budget
                                </button>
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        setShowCatManager(true);
                                    }}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "rgba(240, 236, 228, 0.8)",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                        e.currentTarget.style.color = "#ffffff";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "rgba(240, 236, 228, 0.8)";
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>⚙️</span> Manage Categories
                                </button>
                            </div>

                            {/* Logout Action */}
                            <div style={{ paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <button
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        onLogout();
                                    }}
                                    style={{
                                        width: "100%",
                                        background: "rgba(248,113,113,0.08)",
                                        border: "1px solid rgba(248,113,113,0.15)",
                                        color: "#f87171",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        textAlign: "center",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 6,
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(248,113,113,0.15)";
                                        e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                                        e.currentTarget.style.borderColor = "rgba(248,113,113,0.15)";
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="dashboard-main-layout" style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 120px", display: "flex", gap: 24, alignItems: "flex-start" }}>

                {/* LEFT — NOTES PANEL */}
                <NotesPanel
                    notes={notes}
                    onSaveNotes={onSaveNotes}
                    savingsGoals={savingsGoals}
                    onSaveSavingsGoal={onSaveSavingsGoal}
                    onContributeToGoal={onContributeToGoal}
                    onDeleteSavingsGoal={onDeleteSavingsGoal}
                />

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
                                            <LineChart
                                                data={lineData}
                                                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                                onMouseEnter={() => setDailyTrendActive(true)}
                                                onMouseLeave={() => setDailyTrendActive(false)}
                                                onClick={(e) => { e.stopPropagation(); setDailyTrendActive(true); }}
                                            >
                                                <defs>
                                                    <linearGradient id="lineGlow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="day" tick={{ fill: "rgba(240,236,228,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    active={dailyTrendActive ? undefined : false}
                                                    cursor={false}
                                                    contentStyle={{ background: "#1a1a20", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }}
                                                    formatter={v => [`₹${v.toLocaleString()}`, "Spent"]}
                                                    labelStyle={{ color: "rgba(240,236,228,0.5)", fontSize: 11 }}
                                                    itemStyle={{ color: "#fbbf24", fontWeight: 700 }}
                                                />
                                                <ReferenceLine y={avgDay} stroke="#fbbf24" strokeDasharray="6 4" strokeOpacity={0.5} label={{ value: `Avg ₹${Math.round(avgDay)}`, position: "right", fill: "#fbbf24", fontSize: 10, fontWeight: 700 }} />
                                                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", strokeWidth: 0, r: 4 }} activeDot={dailyTrendActive ? { r: 6, fill: "#fbbf24", strokeWidth: 0 } : false} />
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
                                        <button key={k} onClick={() => { setViewMonth(m); setViewYear(y); setTab("overview"); setFilterCat("All"); setSelectedDate(null); setSelectedDayLabel(null); setSelectedYearMonthKey(null); setSelectedYearMonthLabel(null); }} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${isActive ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.07)"}`, background: isActive ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.03)", cursor: "pointer", fontFamily: "inherit", transition: "all .15s", minWidth: 100, textAlign: "center" }}>
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
                                    {sortedCategories.map((c) => {
                                        const spent = catStats[c]?.total || 0;
                                        const topSubs = Object.entries(catStats[c]?.subs || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
                                        const color = cats[c]?.color || "#f97316";
                                        return (
                                            <div key={c} style={S.card}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <div className="emoji-icon" style={{ width: 40, height: 40, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{cats[c]?.icon}</div>
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
                                        {expenses.length === 0
                                            ? <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>No expenses recorded</p>
                                            : <ResponsiveContainer width="100%" height={180}>
                                                <AreaChart
                                                    data={dailyStats}
                                                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                                    onMouseEnter={() => setDailySpendingActive(true)}
                                                    onMouseLeave={() => setDailySpendingActive(false)}
                                                    onClick={(state) => {
                                                        if (state) {
                                                            let clickedData = null;
                                                            if (state.activePayload && state.activePayload.length > 0) {
                                                                clickedData = state.activePayload[0].payload;
                                                            } else if (state.activeLabel) {
                                                                clickedData = dailyStats.find(d => d.day === state.activeLabel);
                                                            }

                                                            if (clickedData) {
                                                                setSelectedDate(clickedData.date);
                                                                setSelectedDayLabel(clickedData.day);
                                                            }
                                                        }
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    <defs>
                                                        <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isPastMonth ? "#60a5fa" : "#f97316"} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={isPastMonth ? "#60a5fa" : "#f97316"} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="day" tick={{ fill: "rgba(240,236,228,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <Tooltip active={dailySpendingActive ? undefined : false} cursor={false} content={<CustomTooltip />} />
                                                    {selectedDayLabel && (
                                                        <ReferenceLine x={selectedDayLabel} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" />
                                                    )}
                                                    <Area type="monotone" dataKey="amount" stroke={isPastMonth ? "#60a5fa" : "#f97316"} strokeWidth={2} fill="url(#ag2)" dot={{ fill: isPastMonth ? "#60a5fa" : "#f97316", strokeWidth: 0, r: 3 }} activeDot={dailySpendingActive ? undefined : false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        }
                                    </div>

                                    {selectedDate && (() => {
                                        const dayExpenses = expenses.filter(e => e.date === selectedDate);
                                        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);

                                        const getSelectedDayFormatted = (dateStr) => {
                                            if (!dateStr) return "";
                                            const [y, m, d] = dateStr.split("-").map(Number);
                                            const dateObj = new Date(y, m - 1, d);
                                            const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                            const weekday = dayNamesFull[dateObj.getDay()];
                                            const month = monthNames[dateObj.getMonth()];
                                            return `${weekday}, ${month} ${d}`;
                                        };

                                        const formattedDay = getSelectedDayFormatted(selectedDate);

                                        if (dayExpenses.length === 0) {
                                            return (
                                                <div style={{ ...S.card, gridColumn: "1/-1", position: "relative", background: "rgba(255, 255, 255, 0.01)" }}>
                                                    <button 
                                                        onClick={() => { setSelectedDate(null); setSelectedDayLabel(null); }}
                                                        style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "rgba(240,236,228,0.4)", fontSize: 20, cursor: "pointer" }}
                                                    >
                                                        ×
                                                    </button>
                                                    <div style={{ textAlign: "center", color: "rgba(240,236,228,0.4)", fontSize: 13, padding: "20px 0" }}>
                                                        No expenses recorded on {formattedDay}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const catBreakdown = {};
                                        dayExpenses.forEach(exp => {
                                            if (!catBreakdown[exp.category]) {
                                                catBreakdown[exp.category] = { total: 0, items: [] };
                                            }
                                            catBreakdown[exp.category].total += exp.amount;
                                            catBreakdown[exp.category].items.push(exp);
                                        });

                                        const catBreakdownList = Object.entries(catBreakdown).sort((a, b) => b[1].total - a[1].total);
                                        const distinctCategoriesCount = catBreakdownList.length;

                                        return (
                                            <div style={{ ...S.card, gridColumn: "1/-1", position: "relative", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.3s ease" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                                    <div>
                                                        <h4 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 15, color: "#ffffff" }}>
                                                            📅 Spending Breakdown
                                                        </h4>
                                                        <div style={{ color: "rgba(240,236,228,0.4)", fontSize: 12 }}>
                                                            {formattedDay}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                        <div style={{ textAlign: "right" }}>
                                                            <div style={{ fontSize: 18, fontWeight: 900, color: isPastMonth ? "#60a5fa" : "#f97316", fontFamily: "'JetBrains Mono',monospace" }}>
                                                                ₹{dayTotal.toLocaleString()}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                                                                Daily Total
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => { setSelectedDate(null); setSelectedDayLabel(null); }}
                                                            style={{
                                                                background: "rgba(255,255,255,0.06)",
                                                                border: "none",
                                                                color: "rgba(240,236,228,0.6)",
                                                                width: 28,
                                                                height: 28,
                                                                borderRadius: 8,
                                                                cursor: "pointer",
                                                                fontSize: 16,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "all 0.2s"
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                                                            Categories ({distinctCategoriesCount})
                                                        </div>
                                                        
                                                        {distinctCategoriesCount === 1 ? (
                                                            (() => {
                                                                const [catName, data] = catBreakdownList[0];
                                                                const color = cats[catName]?.color || "#f97316";
                                                                const icon = cats[catName]?.icon || "📁";
                                                                return (
                                                                    <div style={{ background: `${color}0c`, border: `1px solid ${color}33`, borderRadius: 14, padding: 16, textAlign: "center" }}>
                                                                        <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                                                                        <div style={{ fontWeight: 800, fontSize: 16, color: "#ffffff" }}>{catName}</div>
                                                                        <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "'JetBrains Mono',monospace", margin: "6px 0" }}>
                                                                            ₹{data.total.toLocaleString()}
                                                                        </div>
                                                                        <div style={{ fontSize: 11, color: "rgba(240,236,228,0.4)" }}>
                                                                            100% of today's spending
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : (
                                                            catBreakdownList.map(([catName, data]) => {
                                                                const color = cats[catName]?.color || "#f97316";
                                                                const icon = cats[catName]?.icon || "📁";
                                                                const pct = dayTotal > 0 ? (data.total / dayTotal) * 100 : 0;
                                                                return (
                                                                    <div key={catName} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 12 }}>
                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                                <span style={{ fontSize: 18 }}>{icon}</span>
                                                                                <div>
                                                                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{catName}</span>
                                                                                    <span style={{ color: "rgba(240,236,228,0.35)", fontSize: 10, marginLeft: 6 }}>
                                                                                        {pct.toFixed(0)}%
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color }}>
                                                                                ₹{data.total.toLocaleString()}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999 }}>
                                                                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                                                            Transactions ({dayExpenses.length})
                                                        </div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                                                            {dayExpenses.map((exp) => {
                                                                const color = cats[exp.category]?.color || "#f97316";
                                                                return (
                                                                    <div 
                                                                        key={exp.id} 
                                                                        style={{ 
                                                                            display: "flex", 
                                                                            justifyContent: "space-between", 
                                                                            alignItems: "center", 
                                                                            padding: "10px 12px", 
                                                                            borderRadius: 10, 
                                                                            background: "rgba(255, 255, 255, 0.02)", 
                                                                            borderLeft: `4px solid ${color}`,
                                                                            border: "1px solid rgba(255,255,255,0.04)",
                                                                            borderLeftColor: color
                                                                        }}
                                                                    >
                                                                        <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                                                <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>
                                                                                    {exp.subCategory}
                                                                                </span>
                                                                                {exp.note && (
                                                                                    <span 
                                                                                        style={{ fontSize: 10, color: "rgba(240,236,228,0.4)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
                                                                                        title={exp.note}
                                                                                    >
                                                                                        — {exp.note}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div style={{ fontSize: 9, color: "rgba(240,236,228,0.3)", marginTop: 2 }}>
                                                                                {exp.category}
                                                                            </div>
                                                                        </div>
                                                                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: "#ffffff" }}>
                                                                            ₹{exp.amount.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Yearly Spending Overview */}
                                    <div style={{ ...S.card, gridColumn: "1/-1", background: "rgba(18, 18, 22, 0.7)", borderColor: "rgba(255, 255, 255, 0.08)" }}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📅 Yearly Spending Overview — {viewYear}</h4>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart
                                                data={yearlyOverviewData}
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                style={{ cursor: "pointer" }}
                                                onClick={(state) => {
                                                    if (state) {
                                                        let clickedData = null;
                                                        if (state.activePayload && state.activePayload.length > 0) {
                                                            clickedData = state.activePayload[0].payload;
                                                        } else if (state.activeLabel) {
                                                            clickedData = yearlyOverviewData.find(d => d.month === state.activeLabel);
                                                        }

                                                        if (clickedData) {
                                                            setSelectedYearMonthKey(clickedData.key);
                                                            setSelectedYearMonthLabel(clickedData.monthFull);
                                                        }
                                                    }
                                                }}
                                            >
                                                <XAxis dataKey="month" tick={false} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomYearlyTooltip />} wrapperStyle={{ zIndex: 1000 }} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                                                {selectedYearMonthKey && (
                                                    <ReferenceLine x={selectedYearMonthKey.split("-")[1] === "12" ? "Dec" : MONTHS[parseInt(selectedYearMonthKey.split("-")[1]) - 1].slice(0, 3)} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" />
                                                )}
                                                {catKeys.map((catName) => (
                                                    <Bar
                                                        key={catName}
                                                        dataKey={catName}
                                                        stackId="a"
                                                        fill={cats[catName]?.color || "#f97316"}
                                                        radius={[2, 2, 0, 0]}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Monthly Breakdown Panel */}
                                    <div style={{
                                        gridColumn: "1/-1",
                                        maxHeight: selectedYearMonthKey ? "600px" : "0px",
                                        opacity: selectedYearMonthKey ? 1 : 0,
                                        overflow: "hidden",
                                        transition: "max-height 0.4s ease, opacity 0.3s ease, margin-top 0.4s ease, margin-bottom 0.4s ease",
                                        marginTop: selectedYearMonthKey ? 16 : 0,
                                        marginBottom: selectedYearMonthKey ? 16 : 0,
                                    }}>
                                        {lastSelectedMonthKey && (() => {
                                            const stats = monthlyBreakdownStats;
                                            if (!stats) return null;

                                            const targetMonthData = allUserData.months?.[lastSelectedMonthKey] || {};
                                            const targetExpenses = targetMonthData.expenses || [];
                                            const isEmpty = targetExpenses.length === 0;

                                            const [yStr, mStr] = lastSelectedMonthKey.split("-");
                                            const year = parseInt(yStr, 10);
                                            const mIdx = parseInt(mStr, 10) - 1;
                                            const selectedMonthName = `${MONTHS[mIdx]} ${year}`;

                                            return (
                                                <div style={{ ...S.card, background: "rgba(18, 18, 22, 0.5)", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                                        <div>
                                                            <h4 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 15, color: "#ffffff" }}>
                                                                📅 Monthly Spending Breakdown
                                                            </h4>
                                                            <div style={{ color: "rgba(240,236,228,0.4)", fontSize: 12 }}>
                                                                {selectedMonthName}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                                            {!isEmpty && (
                                                                <div style={{ textAlign: "right" }}>
                                                                    <div style={{ fontSize: 18, fontWeight: 900, color: "#f97316", fontFamily: "'JetBrains Mono',monospace" }}>
                                                                        ₹{stats.total.toLocaleString()}
                                                                    </div>
                                                                    <div style={{ fontSize: 10, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
                                                                        Monthly Total
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <button 
                                                                onClick={() => { setSelectedYearMonthKey(null); setSelectedYearMonthLabel(null); }}
                                                                style={{
                                                                    background: "rgba(255,255,255,0.06)",
                                                                    border: "none",
                                                                    color: "rgba(240,236,228,0.6)",
                                                                    width: 28,
                                                                    height: 28,
                                                                    borderRadius: 8,
                                                                    cursor: "pointer",
                                                                    fontSize: 16,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 0.2s"
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isEmpty ? (
                                                        <div style={{ textAlign: "center", color: "rgba(240,236,228,0.4)", fontSize: 13, padding: "20px 0" }}>
                                                            No expenses recorded for this month
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                                                            {/* Statistics Column */}
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                                                                    Monthly Statistics
                                                                </div>
                                                                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                        <span style={{ color: "rgba(240,236,228,0.5)", fontSize: 13 }}>Transactions Count</span>
                                                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{stats.count}</span>
                                                                    </div>
                                                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                                        <span style={{ color: "rgba(240,236,228,0.5)", fontSize: 13 }}>Daily Average</span>
                                                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#ffffff", fontFamily: "'JetBrains Mono',monospace" }}>₹{Math.round(stats.averageDailySpend).toLocaleString()}</span>
                                                                    </div>
                                                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                                                        <span style={{ color: "rgba(240,236,228,0.3)", fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Highest Spending Category</span>
                                                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#fbbf24" }}>{stats.highestCategoryText}</span>
                                                                    </div>
                                                                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                                                        <span style={{ color: "rgba(240,236,228,0.3)", fontSize: 10, textTransform: "uppercase", fontWeight: 700 }}>Lowest Spending Category</span>
                                                                        <span style={{ fontWeight: 700, fontSize: 13, color: "#10b981" }}>{stats.lowestCategoryText}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Category Contribution Column */}
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,236,228,0.3)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                                                                    Category Contribution
                                                                </div>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                                                                    {stats.categoryBreakdownList.map(([catName, amount]) => {
                                                                        const color = cats[catName]?.color || "#f97316";
                                                                        const icon = cats[catName]?.icon || "📁";
                                                                        const pct = stats.total > 0 ? (amount / stats.total) * 100 : 0;
                                                                        return (
                                                                            <div key={catName} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: 12 }}>
                                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                                        <span style={{ fontSize: 18 }}>{icon}</span>
                                                                                        <div>
                                                                                            <span style={{ fontWeight: 700, fontSize: 13 }}>{catName}</span>
                                                                                            <span style={{ color: "rgba(240,236,228,0.35)", fontSize: 10, marginLeft: 6 }}>
                                                                                                {pct.toFixed(1)}%
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 13, color }}>
                                                                                        ₹{amount.toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999 }}>
                                                                                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999 }} />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div style={S.card}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📅 Spending by Day</h4>
                                        {(() => {
                                            const PALETTE = ['#ec4899', '#10b981', '#f97316', '#6366f1', '#f59e0b', '#3b82f6', '#a855f7'];
                                            const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                                            const fullDayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                            const byDay = {};
                                            expenses.forEach(exp => {
                                                const d = new Date(exp.date + "T00:00:00");
                                                const dayIdx = d.getDay();
                                                byDay[dayIdx] = (byDay[dayIdx] || 0) + exp.amount;
                                            });
                                            const donutData = Object.entries(byDay)
                                                .filter(([, val]) => val > 0)
                                                .map(([idx, val], i) => ({
                                                    label: dayLabels[parseInt(idx)],
                                                    fullLabel: fullDayLabels[parseInt(idx)],
                                                    value: val,
                                                    color: PALETTE[i % PALETTE.length]
                                                }));
                                            const dayTotal = donutData.reduce((s, d) => s + d.value, 0);
                                            if (donutData.length === 0) return <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>No data yet</p>;

                                            const CustomDonutTooltip = ({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    const pct = dayTotal > 0 ? ((data.value / dayTotal) * 100).toFixed(1) : 0;
                                                    return (
                                                        <div style={{ pointerEvents: "none", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", fontFamily: "inherit" }}>
                                                            <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{data.fullLabel}</div>
                                                            <div style={{ color: "rgba(240,236,228,0.6)", fontSize: 12 }}>
                                                                Spent: <span style={{ color: "#fbbf24", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>₹{data.value.toLocaleString()}</span>
                                                            </div>
                                                            <div style={{ color: "rgba(240,236,228,0.45)", fontSize: 11, marginTop: 2 }}>
                                                                {pct}% of total
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            };

                                            return (
                                                <ResponsiveContainer width="100%" height={220}>
                                                    <PieChart>
                                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={donutData.length > 1 ? 3 : 0} dataKey="value" nameKey="label">
                                                            {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        </Pie>
                                                        <Tooltip content={<CustomDonutTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            );
                                        })()}
                                    </div>

                                    <div style={S.card}>
                                        <h4 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 15 }}>📊 Category Breakdown</h4>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart
                                                data={categoryBreakdownData}
                                                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                                onMouseEnter={() => setCategoryBreakdownActive(true)}
                                                onMouseLeave={() => setCategoryBreakdownActive(false)}
                                                onClick={(e) => { e.stopPropagation(); setCategoryBreakdownActive(true); }}
                                            >
                                                <XAxis dataKey="name" tick={{ fill: "rgba(240,236,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip active={categoryBreakdownActive ? undefined : false} cursor={false} formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: "#12121a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontFamily: "inherit" }} itemStyle={{ color: "#fbbf24", fontWeight: 700 }} labelStyle={{ color: "#f0ece4" }} />
                                                <Bar
                                                    dataKey="spent"
                                                    shape={<CustomBar active={false} maxValue={categoryBreakdownMaxValue} />}
                                                    activeBar={<CustomBar active={categoryBreakdownActive} maxValue={categoryBreakdownMaxValue} />}
                                                >
                                                    {categoryBreakdownData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={cats[entry.name]?.color || "#f97316"} />
                                                    ))}
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
                                                    onMouseEnter={() => setMomActive(true)}
                                                    onMouseLeave={() => setMomActive(false)}
                                                    onClick={(e) => { e.stopPropagation(); setMomActive(true); }}
                                                >
                                                    <XAxis dataKey="name" tick={{ fill: "rgba(240,236,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fill: "rgba(240,236,228,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <Tooltip content={<CustomMomTooltip />} wrapperStyle={{ zIndex: 1000 }} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
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
                                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
                                            {["All", ...catKeys].map(c => (
                                                <button key={c} onClick={() => setFilterCat(c)} style={{ ...S.pill(filterCat === c, cats[c]?.color || "#f97316"), ...(c === "All" && filterCat === "All" ? { borderColor: "#fbbf24", color: "#fbbf24", background: "rgba(251,191,36,0.1)" } : {}) }}>
                                                    {c !== "All" && cats[c]?.icon + " "}{c}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <input
                                                type="date"
                                                value={filterDate}
                                                onChange={(e) => setFilterDate(e.target.value)}
                                                style={{ ...S.input, padding: "8px 12px", width: "auto", minWidth: 140, marginBottom: 0 }}
                                            />
                                            {filterDate && (
                                                <button onClick={() => setFilterDate("")} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(240,236,228,0.6)", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                                                    Clear Date
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={S.card}>
                                        {filteredExpenses.length === 0
                                            ? <p style={{ color: "rgba(240,236,228,0.2)", textAlign: "center", padding: "40px 0" }}>{isPastMonth ? "No expenses for this month." : "No expenses yet. Tap + to add one!"}</p>
                                            : filteredExpenses.map((e, i) => {
                                                const color = cats[e.category]?.color || "#f97316";
                                                return (
                                                    <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: i < filteredExpenses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                                        <div className="emoji-icon" style={{ width: 42, height: 42, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
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
                <AddExpenseModal budget={currentBudget} customCategories={allUserData?.customCategories} onAdd={onAddExpense} onClose={() => setShowModal(false)} showToast={showToast} />
            )}
            {showCatManager && (
                <CategoryManager
                    customCategories={allUserData?.customCategories}
                    onSave={onSaveCategories}
                    onClose={() => setShowCatManager(false)}
                    showToast={showToast}
                    askConfirm={askConfirm}
                />
            )}
        </div>
    );
}
