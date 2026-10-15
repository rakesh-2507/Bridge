import { useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Settings,
  FolderOpen,
  X,
  LogOut,
  BriefcaseBusiness,
} from "lucide-react";

import { getCurrentUser } from "../../api/auth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

const adminNavigation = [
  { name: "Masters", path: "/masters", icon: Settings },
  { name: "Projects", path: "/projects", icon: FolderOpen },
];

const coordinatorNavigation = [
  {
    name: "Coordinator Projects",
    path: "/dashboard",
    icon: BriefcaseBusiness,
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const user = getCurrentUser();

  const userType = String(user?.mtype ?? user?.role ?? "")
    .trim()
    .toLowerCase();

  const visibleNavigation =
    userType === "sysadmin"
      ? adminNavigation
      : coordinatorNavigation;

  const showTooltip = (text: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();

    setTooltip({
      text,
      x: rect.right + 12,
      y: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const handleLogout = () => {
    hideTooltip();

    localStorage.removeItem("login_user");
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("jwt_token");

    onClose();
    navigate("/login", { replace: true });
  };

  const handleNavigation = () => {
    hideTooltip();
    onClose();
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => {
            hideTooltip();
            onClose();
          }}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseLeave={hideTooltip}
        className={`fixed inset-y-0 left-0 flex h-screen w-20 shrink-0 flex-col overflow-visible border-r-2 border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"
          } lg:relative lg:inset-auto lg:h-full lg:min-h-0 lg:translate-x-0`}
      >
        {/* Mobile close button */}
        <div className="flex h-16 shrink-0 items-center justify-center border-b-2 border-slate-100 dark:border-slate-800 lg:hidden">
          <button
            type="button"
            onClick={() => {
              hideTooltip();
              onClose();
            }}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/15 dark:hover:text-primary-light"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role-based navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5">
          <nav className="flex flex-col items-center gap-2">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={handleNavigation}
                  onMouseEnter={(event) =>
                    showTooltip(item.name, event.currentTarget)
                  }
                  onFocus={(event) =>
                    showTooltip(item.name, event.currentTarget)
                  }
                  onBlur={hideTooltip}
                  aria-label={item.name}
                  className={({ isActive }) =>
                    `group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive
                      ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light"
                      : "text-slate-600 hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/15 dark:hover:text-primary-light"
                    }`
                  }
                >
                  <Icon
                    size={21}
                    strokeWidth={3}
                  />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="flex h-16 shrink-0 items-center justify-center border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={(event) =>
              showTooltip("Logout", event.currentTarget)
            }
            onFocus={(event) =>
              showTooltip("Logout", event.currentTarget)
            }
            onBlur={hideTooltip}
            aria-label="Logout"
            className="flex h-12 w-12 items-center justify-center rounded-xl text-primary transition hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary/15"
          >
            <LogOut size={21} />
          </button>
        </div>
      </aside>

      {/* Tooltip rendered directly inside document.body */}
      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translateY(-50%)",
              zIndex: 99999,
            }}
          >
            {tooltip.text}
          </div>,
          document.body
        )}
    </>
  );
}
