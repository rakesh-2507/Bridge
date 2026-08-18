import {
  Bell,
  MapPin,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

type NavbarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-950 dark:text-white">
      <div className="flex h-full items-center justify-between px-6">

        <Link
          to="/"
          className="text-3xl text-gray-900 dark:text-white"
          style={{ fontFamily: "'Norican', cursive" }}
        >
          Bridge
        </Link>

        <div className="flex items-center gap-2">

          <button
            type="button"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white md:hidden"
          >
            {darkMode ? (
              <Sun size={20} strokeWidth={1.8} />
            ) : (
              <Moon size={20} strokeWidth={1.8} />
            )}
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Location"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <MapPin size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Profile"
            className="ml-2 rounded-full text-gray-600 transition hover:text-gray-900 dark:text-white"
          >
            <UserCircle size={32} strokeWidth={1.6} />
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navbar;