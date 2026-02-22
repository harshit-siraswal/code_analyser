import { Link, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/ProtectedRoute";
import { ThemeToggleButton } from "./components/ThemeToggleButton";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProblemWorkspacePage } from "./pages/ProblemWorkspacePage";
import { ProblemsPage } from "./pages/ProblemsPage";
import { RegisterPage } from "./pages/RegisterPage";

function AppShell() {
  const { user, signOutUser } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Code Analyser
        </Link>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/problems">Problems</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <div className="topbar-actions">
          <span className="user-email">{user?.email}</span>
          <div className="topbar-icon-actions">
            <ThemeToggleButton compact />
            <button
              type="button"
              className="ghost-btn icon-action-btn compact"
              title="Sign out"
              aria-label="Sign out"
              onClick={() => void signOutUser()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10M15 16l5-4-5-4M20 12H9"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problems/:slug" element={<ProblemWorkspacePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
