import { Link, NavLink, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/ProtectedRoute";
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
          <button type="button" className="ghost-btn" onClick={() => void signOutUser()}>
            Sign out
          </button>
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
