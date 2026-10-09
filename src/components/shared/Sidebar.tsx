
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    Users,
    Building2,
    X,
    LogOut,
} from "lucide-react";

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const navigation = [
    { name: "Masters", path: "/masters", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: FolderKanban },
    { name: "Templates", path: "/templates", icon: FileText },
    { name: "Users", path: "/users", icon: Users },
    { name: "Companies", path: "/companies", icon: Building2 },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
    const navigate = useNavigate();


    const handleLogout = () => {
        localStorage.removeItem("login_user");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("jwt_token");

        onClose();
        navigate("/login", { replace: true });
    };

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close sidebar overlay"
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex h-screen w-20 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"
                    } lg:relative lg:inset-auto lg:z-30 lg:h-full lg:min-h-0 lg:translate-x-0`}
            >
                {/* Mobile close button */}
                <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-100 dark:border-slate-800 lg:hidden">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sidebar"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation icons */}
                <div className="min-h-0 flex-1 overflow-hidden px-3 py-5">
                    <nav className="flex flex-col items-center gap-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end
                                    onClick={onClose}
                                    title={item.name}
                                    aria-label={item.name}
                                    className={({ isActive }) =>
                                        `group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isActive
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                        }`
                                    }
                                >
                                    <Icon size={21} />

                                    {/* Tooltip */}
                                    <span className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        {item.name}
                                    </span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Logout icon */}
                <div className="flex h-16 shrink-0 items-center justify-center border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                        className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                        <LogOut size={21} />

                        <span className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}