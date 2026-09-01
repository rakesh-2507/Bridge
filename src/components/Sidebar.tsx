import {
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

type SidebarProps = {
  darkMode: boolean;
  setDarkMode: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

function Sidebar({
  darkMode,
  setDarkMode,
}: SidebarProps) {
  const navigate = useNavigate();

  const loginType =
    localStorage
      .getItem("login_type")
      ?.trim()
      .toLowerCase() ?? "";

  const isAdmin =
    loginType === "admin" ||
    loginType === "sysadmin" ||
    loginType === "administrator";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("login_type");

    navigate("/login", {
      replace: true,
    });
  };

  const navigationItems = isAdmin
    ? [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          to: "/",
        },
      ]
    : [
        {
          label: "Tasks",
          icon: CheckSquare,
          to: "/tasks",
        },
        {
          label: "Today Tasks",
          icon: CalendarDays,
          to: "/tasks/today",
        },
      ];

  return (
    <aside className="hidden w-20 shrink-0 border-r border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-950 md:block">
      <div className="flex h-full flex-col p-3">

        <nav className="space-y-2">
          {navigationItems.map(
            ({
              label,
              icon: Icon,
              to,
            }) => (
              <NavLink
                key={label}
                to={to}
                end
                className={({ isActive }) =>
                  `group relative flex items-center justify-center rounded-lg p-3 transition ${
                    isActive
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                  }`
                }
              >
                <Icon
                  size={22}
                  strokeWidth={1.8}
                />

                {/* Tooltip */}

                <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">

          <button
            type="button"
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className="group relative flex items-center justify-center rounded-lg p-3 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {darkMode ? (
              <Sun
                size={22}
                strokeWidth={1.8}
              />
            ) : (
              <Moon
                size={22}
                strokeWidth={1.8}
              />
            )}

            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity dark:bg-white dark:text-gray-900">
              {darkMode
                ? "Light Mode"
                : "Dark Mode"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="group relative flex items-center justify-center rounded-lg p-3 text-gray-600 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <LogOut
              size={22}
              strokeWidth={1.8}
            />

            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-md bg-red-600 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Logout
            </span>
          </button>

        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
