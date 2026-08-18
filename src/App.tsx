import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-gray-50">

        <Navbar />

        <div className="flex flex-1">

          <Sidebar />

          <main className="flex-1 p-2 lg:p-4">

            <Routes>

              <Route path="/" element={<Home />} />

              <Route path="/projects" element={<Projects />} />

              <Route path="/projects/:id" element={<ProjectDetails />} />

            </Routes>

          </main>

        </div>

        <Footer />

      </div>
    </BrowserRouter>
  );
}

export default App;