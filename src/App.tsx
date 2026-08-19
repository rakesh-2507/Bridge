import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import MembersList from "./pages/MembersList";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
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

          <main className="flex-1 bg-gray-50 p-2 transition-colors dark:bg-gray-950 lg:p-4">

            <Routes>

              <Route path="/" element={<Home />} />

              <Route path="/projects" element={<Projects />} />

              <Route
                path="/projects/:id"
                element={<ProjectDetails />}
              />
              <Route path="/members" element={<MembersList />} />

            </Routes>

          </main>

        </div>

        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;