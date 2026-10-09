
import { useContext } from "react";
import {
  Bell,
  Menu,
  Layers3,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";
import { ThemeContext } from "./ThemeContext";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("Navbar must be used inside ThemeProvider");
  }

  const { theme, toggleTheme } = themeContext;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Layers3 size={21} />
        </div>

        <span className="text-lg font-bold text-slate-900 dark:text-white">
          Bridge
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === "light" ? <Moon size={21} /> : <Sun size={21} />}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-700">
          <UserCircle
            size={28}
            className="text-slate-600 dark:text-slate-300"
          />
          <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}