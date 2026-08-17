import { FolderKanban, LayoutDashboard} from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="hidden w-40 shrink-0 border-r border-gray-200 bg-white md:block">

      <div className="flex h-full flex-col p-4">

        <nav className="space-y-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <LayoutDashboard size={20} strokeWidth={1.8} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <FolderKanban size={20} strokeWidth={1.8} />
            <span>Projects</span>
          </NavLink>

        </nav>

      </div>

    </aside>
  );
}

export default Sidebar;