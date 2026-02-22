import { Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProblemsPage } from "./pages/ProblemsPage";
import { RegisterPage } from "./pages/RegisterPage";

function AppShell() {
  const { user, signOutUser } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/problems">
          Code Analyser
        </Link>
        <nav>
          <NavLink to="/problems">Problems</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <div className="topbar-actions">
          <span className="user-email">{user?.email}</span>
          <button type="button" className="ghost-btn" onClick={() => void signOutUser()}>
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="status-text">Loading app...</p>;
  }

  return <Navigate to={user ? "/problems" : "/login"} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
