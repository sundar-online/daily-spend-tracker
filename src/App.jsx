import { CURRENT_MONTH, CURRENT_YEAR } from "./utils/constants";
import { useExpenseManager } from "./hooks/useExpenseManager";
import AuthScreen from "./pages/AuthScreen";
import BudgetSetup from "./pages/BudgetSetup";
import Dashboard from "./pages/Dashboard";
import { S, FontLink } from "./styles/shared.jsx";

export default function App() {
  const {
    user, screen, setScreen, allUserData, currentBudget, loading,
    login, logout, saveBudget, addExpense, deleteExpense,
    saveCategories, saveNotes,
  } = useExpenseManager();

  // Show loading spinner while checking session
  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <FontLink />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: "pulse 1.5s infinite" }}>💸</div>
        <div style={{ color: "rgba(240,236,228,0.5)", fontSize: 14, fontWeight: 600 }}>Loading SpendSmart…</div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    </div>
  );

  if (screen === "auth") return <AuthScreen onLogin={login} />;

  if (screen === "setup") return (
    <BudgetSetup
      username={user?.email || ""}
      existingBudget={currentBudget}
      targetMonth={CURRENT_MONTH}
      targetYear={CURRENT_YEAR}
      onSave={saveBudget}
      onBack={currentBudget ? () => setScreen("dashboard") : null}
    />
  );

  if (screen === "dashboard" && allUserData) return (
    <Dashboard
      username={user?.email || ""}
      allUserData={allUserData}
      currentBudget={currentBudget}
      onAddExpense={addExpense}
      onDeleteExpense={deleteExpense}
      onLogout={logout}
      onEditBudget={() => setScreen("setup")}
      onSetupMonthBudget={() => setScreen("setup")}
      onSaveCategories={saveCategories}
      onSaveNotes={saveNotes}
    />
  );

  return null;
}
