import {
  FolderKanban,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

function Sidebar({ darkMode, setDarkMode }: SidebarProps) {
  return (
    <aside className="hidden w-20 shrink-0 border-r border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-950 md:block">
      <div className="flex h-full flex-col p-3">

        <nav className="space-y-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg p-3 transition ${isActive
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={22} strokeWidth={1.8} />

            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
              Dashboard
            </span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `group relative flex items-center justify-center rounded-lg p-3 transition ${isActive
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              }`
            }
          >
            <FolderKanban size={22} strokeWidth={1.8} />

            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
              Projects
            </span>
          </NavLink>

        </nav>

        <div className="mt-auto flex justify-center">

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="group relative flex items-center justify-center rounded-lg p-3 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {darkMode ? (
              <Sun size={22} strokeWidth={1.8} />
            ) : (
              <Moon size={22} strokeWidth={1.8} />
            )}

            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>

        </div>

      </div>
    </aside>
  );
}

export default Sidebar;