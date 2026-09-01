import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import MembersList from "./pages/MembersList";

import ProjectTypes from "./pages/ProjectTypes";
import Templates from "./pages/Templates";
import Folders from "./pages/Folders";
import Companies from "./pages/Companies";
import CreateProjectTemplate from "./pages/CreateProjectTemplate"
import ProjectCreation from "./pages/CreateProject";
import TasksPage from "./pages/tasks/TasksPage";
import TodayTasksPage from "./pages/tasks/TodayTasksPage";
import CreateTaskPage from "./pages/tasks/CreateTaskPage";
import EditTaskPage from "./pages/tasks/EditTaskPage";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    );
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTE
        ========================== */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* =========================
            PROTECTED ROUTES
        ========================== */}
        <Route element={<ProtectedRoute />}>

          <Route
            element={
              <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-white">

                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />

                <div className="flex flex-1">

                  <Sidebar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />

                  <main className="flex-1 bg-gray-50 transition-colors dark:bg-gray-950">
                    <Outlet />
                  </main>

                </div>

                <Footer />

              </div>
            }
          >

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/tasks"
              element={<TasksPage />}
            />

            <Route
              path="/tasks/today"
              element={<TodayTasksPage />}
            />

            <Route
              path="/tasks/create"
              element={<CreateTaskPage />}
            />

            <Route
              path="/tasks/:taskId/edit"
              element={<EditTaskPage />}
            />

            <Route
              path="/projects"
              element={<Projects />}
            />

            <Route
              path="/projects/:id"
              element={<ProjectDetails />}
            />

            <Route
              path="/members"
              element={<MembersList />}
            />

            <Route
              path="/project-types"
              element={<ProjectTypes />}
            />

            <Route
              path="/templates"
              element={<Templates />}
            />

            <Route
              path="/folders"
              element={<Folders />}
            />

            <Route
              path="/companies"
              element={<Companies />}
            />

            <Route
              path="/projecttemplate"
              element={<CreateProjectTemplate />}
            />

            <Route
              path="/project-create"
              element={<ProjectCreation />}
            />

          </Route>

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;