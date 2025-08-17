import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { SuppliersPage } from "./pages/SuppliersPage";
import { PurchasesPage } from "./pages/PurchasesPage";
import { PurchaseFormPage } from "./pages/PurchaseFormPage";
import { ItemsPage } from "./pages/ItemsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAppStore } from "./store/useAppStore";
import { Toaster } from "./components/ui/toaster";

function PrivateRoute() {
  const { token } = useAppStore();
  return token ? <Outlet /> : <Navigate to="/login" />;
}

function AdminRoute() {
  const { user } = useAppStore();
  return user?.role === "admin" ? <Outlet /> : <Navigate to="/" />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/purchases/new" element={<PurchaseFormPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
