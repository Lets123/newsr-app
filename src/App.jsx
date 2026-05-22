import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./components/DashboardPage";
import BillingPage from "./components/BillingPage";
import InventoryPage from "./components/InventoryPage";
import FinancePage from "./components/FinancePage";
import DuesPage from "./components/DuesPage";
import ExpensesPage from "./components/ExpensesPage";
import OtherIncomePage from "./components/OtherIncomePage";
import LedgerPage from "./components/LedgerPage";
import ReportsPage from "./components/ReportsPage";
import StockSetupPage from "./components/StockSetupPage";

function App() {
  return (
    <div className="min-h-screen p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1360px] overflow-hidden rounded-lg border border-slate-300/70 bg-white shadow-panel">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50/70 p-3 sm:p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/stock-setup" element={<StockSetupPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/dues" element={<DuesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/other-income" element={<OtherIncomePage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
