
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Masters from "./pages/Masters";
import MainLayout from "./components/shared/MainLayout";

// Basic authentication guard.
// Later, role-specific guards can be added here.
function ProtectedRoute() {
  const accessToken = localStorage.getItem("access_token");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      {/* Login is available without authentication */}
      <Route path="/login" element={<Login />} />

      {/* All workspace pages require a stored access token */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={<Navigate to="/masters" replace />}
          />
          <Route path="/masters" element={<Masters />} />
        </Route>
      </Route>

      {/* Unknown routes return to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}