import { useContext } from "react";
import {
  Bell,
  Menu,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";
import { ThemeContext } from "./ThemeContext";
import { getCurrentUser } from "../../api/auth";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("Navbar must be used inside ThemeProvider");
  }

  const { theme, toggleTheme } = themeContext;

  // Read the current user's stored profile.
  const currentUser = getCurrentUser();

  const fullName = [
    currentUser?.firstname,
    currentUser?.lastname,
  ]
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    )
    .join(" ");

  const displayName =
    fullName ||
    (typeof currentUser?.loginname === "string"
      ? currentUser.loginname.trim()
      : "") ||
    "User";

  return (
    <header className="flex h-16 items-center justify-between border-b border-primary-light bg-primary px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          className="rounded-lg p-2 text-white transition hover:bg-primary-light lg:hidden"
        >
          <Menu size={22} />
        </button>

        <span className="bridge-logo text-4xl text-white">
          Bridge
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="rounded-xl p-2 text-white transition hover:bg-primary-light"
        >
          {theme === "light" ? (
            <Moon size={21} />
          ) : (
            <Sun size={21} />
          )}
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl p-2 text-white transition hover:bg-primary-light"
        >
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2 border-l border-primary-light pl-3">
          <UserCircle size={28} className="text-white" />

          <span
            className="max-w-40 truncate text-sm font-medium text-white"
            title={displayName}
          >
            {displayName}
          </span>
        </div>
      </div>
    </header>
  );
}
