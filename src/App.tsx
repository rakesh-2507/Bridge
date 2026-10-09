
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Masters from "./pages/Masters";
import MainLayout from "./components/shared/MainLayout";


import UsersPage from "./pages/UsersPage";
import FolderPage from "./pages/Folder";
import Company from "./pages/Company";
import Projects from "./pages/Projects";
import CreateTemplate from "./pages/CreateTemplate";
import TemplatesPage from "./pages/TemplatesPage";

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
          <Route path="/users" element={<UsersPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/folders" element={<FolderPage />} />
          <Route path="/companies" element={<Company />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/templates/create" element={<CreateTemplate />} />

        </Route>
      </Route>

      {/* Unknown routes return to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}