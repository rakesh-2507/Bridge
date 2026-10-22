import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <div className="relative z-40 h-16 shrink-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
      </div>

      {/* Main Content Area */}
      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Outlet */}
        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
          <main className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            <Outlet />
          </main>

          {/* Footer */}
          <div className="mt-auto shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
