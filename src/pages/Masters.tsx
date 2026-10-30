import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Building2,
} from "lucide-react";

const masterCards = [
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

export default function Masters() {
  return (
    <div className=" bg-slate-50 dark:bg-slate-950 ">
      <div className="mx-auto w-full">

        {/* Breadcrumb Header */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
          <h1 className="text-l font-semibold text-slate-800 dark:text-white">
            Masters
          </h1>
        </div>

        {/* Master Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-6 p-6">
          {masterCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                to={card.path}
                className="group flex flex-col items-center justify-center  rounded-tl-xl rounded-br-xl   border-2 border-[var(--color-primary-light)] bg-white p-8 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)] dark:bg-slate-900 dark:hover:shadow-black/20"
              >
                <div className="flex h-12 w-12 items-center justify-center text-[var(--color-primary-light)] transition-transform duration-200 group-hover:scale-110">
                  <Icon size={30} strokeWidth={1.5} />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                  {card.title}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}