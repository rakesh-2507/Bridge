
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Fixed navbar */}
      <div className="fixed inset-x-0 top-0 z-40 h-16">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      {/* Content area between navbar and footer */}
      <div className="fixed inset-x-0 bottom-0 top-16 flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="min-h-0 min-w-0 flex-1 bg-slate-50 dark:bg-slate-950">
          <main>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Fixed footer; starts after sidebar on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-40 h-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:left-20">
        <Footer />
      </div>    </div>
  );
}