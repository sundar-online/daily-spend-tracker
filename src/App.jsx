import { CURRENT_MONTH, CURRENT_YEAR } from "./utils/constants";
import { useExpenseManager } from "./hooks/useExpenseManager";
import AuthScreen from "./pages/AuthScreen";
import BudgetSetup from "./pages/BudgetSetup";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const {
    user, screen, setScreen, allUserData, currentBudget,
    login, logout, saveBudget, addExpense, deleteExpense,
    saveCategories, saveNotes,
  } = useExpenseManager();

  if (screen === "auth") return <AuthScreen onLogin={login} />;

  if (screen === "setup") return (
    <BudgetSetup
      username={user}
      existingBudget={currentBudget}
      targetMonth={CURRENT_MONTH}
      targetYear={CURRENT_YEAR}
      onSave={saveBudget}
      onBack={currentBudget ? () => setScreen("dashboard") : null}
    />
  );

  if (screen === "dashboard") return (
    <Dashboard
      username={user}
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
