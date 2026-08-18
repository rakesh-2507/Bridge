import { Bell, MapPin, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white dark:bg-gray-950 dark:text-white dark:border-gray-700">
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
            aria-label="Notifications"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Location"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-white"
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