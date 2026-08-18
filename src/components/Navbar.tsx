import { Bell, MapPin, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">

        {/* Logo */}
        <Link
          to="/"
          className="text-3xl text-gray-900"
          style={{ fontFamily: "'Norican', cursive" }}
        >
          Bridge
        </Link>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2">

          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Bell size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Location"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <MapPin size={20} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label="Profile"
            className="ml-2 rounded-full text-gray-600 transition hover:text-gray-900"
          >
            <UserCircle size={32} strokeWidth={1.6} />
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navbar;