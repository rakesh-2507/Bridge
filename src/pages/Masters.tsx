
import { Link } from "react-router-dom";
import {
  FolderKanban,
  FileText,
  Users,
  Building2,
  ArrowUpRight,
} from "lucide-react";

const masterCards = [
  {
    title: "Projects",
    description: "Create, view, and manage all projects.",
    path: "/projects",
    icon: FolderKanban,
    color: "blue",
    countLabel: "Project Management",
  },
  {
    title: "Templates",
    description: "Manage project templates and folder structures.",
    path: "/templates",
    icon: FileText,
    color: "violet",
    countLabel: "Template Management",
  },
  {
    title: "Users",
    description: "Manage users, accounts, and user assignments.",
    path: "/users",
    icon: Users,
    color: "emerald",
    countLabel: "User Management",
  },
  {
    title: "Companies",
    description: "Manage company details and organization records.",
    path: "/companies",
    icon: Building2,
    color: "amber",
    countLabel: "Company Management",
  },
];

const iconColors: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
};

export default function Masters() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto w-full">

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {masterCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                to={card.path}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:shadow-black/20"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconColors[card.color]}`}
                  >
                    <Icon size={24} />
                  </div>

                  <ArrowUpRight
                    size={20}
                    className="text-slate-400 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-600"
                  />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
                  {card.title}
                </h3>

                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {card.countLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}