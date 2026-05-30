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
    ensureRecurringForMonth, saveRecurringRule, removeRecurringRule,
    saveSavingsGoal, contributeToGoal, removeSavingsGoal,
    toasts, showToast, removeToast, confirmDialog, askConfirm, closeConfirm,
    ensureMonthInitializedAction
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

  let activeView = null;

  if (screen === "auth") {
    activeView = <AuthScreen onLogin={login} />;
  } else if (screen === "setup") {
    activeView = (
      <BudgetSetup
        username={user?.email || ""}
        allUserData={allUserData}
        targetMonth={CURRENT_MONTH}
        targetYear={CURRENT_YEAR}
        onSave={saveBudget}
        onBack={currentBudget ? () => setScreen("dashboard") : null}
        showToast={showToast}
        askConfirm={askConfirm}
      />
    );
  } else if (screen === "dashboard" && allUserData) {
    activeView = (
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
        onEnsureRecurringForMonth={ensureRecurringForMonth}
        onSaveRecurringRule={saveRecurringRule}
        onDeleteRecurringRule={removeRecurringRule}
        onSaveSavingsGoal={saveSavingsGoal}
        onContributeToGoal={contributeToGoal}
        onDeleteSavingsGoal={removeSavingsGoal}
        onEnsureMonthInitialized={ensureMonthInitializedAction}
        showToast={showToast}
        askConfirm={askConfirm}
      />
    );
  }

  return (
    <>
      {activeView}
      {/* Toast Overlay */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast-card toast-${t.type}`}>
              <div className="toast-content">
                <span className="toast-icon">
                  {t.type === "success" && "✅"}
                  {t.type === "error" && "❌"}
                  {t.type === "warning" && "⚠️"}
                  {t.type === "info" && "ℹ️"}
                </span>
                <span className="toast-message">{t.message}</span>
              </div>
              <button className="toast-close-btn" onClick={() => removeToast(t.id)}>×</button>
            </div>
          ))}
        </div>
      )}
      {/* Custom Confirm Modal */}
      {confirmDialog && (
        <div className="confirm-overlay" onClick={closeConfirm}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">
              <span className="emoji-icon">{confirmDialog.isDestructive ? "⚠️" : "❓"}</span>
              {confirmDialog.title}
            </div>
            <div className="confirm-body">{confirmDialog.message}</div>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={closeConfirm}>
                {confirmDialog.cancelText}
              </button>
              <button
                className={`confirm-btn-action ${confirmDialog.isDestructive ? "confirm-btn-destructive" : "confirm-btn-primary"}`}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
