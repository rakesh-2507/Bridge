import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Masters from "./pages/Masters";
import MainLayout from "./components/shared/MainLayout";

import UsersPage from "./pages/UsersPage";
import FolderPage from "./pages/Folder";
import Company from "./pages/Company";
import Projects from "./pages/Projects";
import CreateTemplate from "./pages/CreateTemplate";
import TemplatesPage from "./pages/TemplatesPage";
import CreateProject from "./pages/CreateProject";
import CoordinatorProjects from "./pages/CoordinatorProjects";
import WelcomePage from "./pages/Home";

import {
  getCurrentUser,
  isAuthenticated,
} from "./api/auth";

function getUserType(): string {
  const user = getCurrentUser();

  return String(user?.mtype ?? user?.role ?? "")
    .trim()
    .toLowerCase();
}

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function AdminRoute() {
  if (getUserType() === "sysadmin") {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
}

function HomeRedirect() {
  if (getUserType() === "sysadmin") {
    return <Navigate to="/masters" replace />;
  }

  // The welcome page checks assigned projects and redirects
  // users to the projects page when projects exist.
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/home" element={<WelcomePage />} />

          <Route
            path="/dashboard"
            element={<CoordinatorProjects />}
          />

          <Route element={<AdminRoute />}>
            <Route path="/masters" element={<Masters />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/folders" element={<FolderPage />} />
            <Route path="/companies" element={<Company />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/create" element={<CreateProject />} />
            <Route path="/templates/create" element={<CreateTemplate />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated() ? "/" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}
