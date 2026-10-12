import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    BriefcaseBusiness,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Folder,
    RefreshCw,
    Search,
    Users,
} from "lucide-react";

import {
    getCoordinatorProjects,
    type Project,
    type CoordinatorProjectsResponse,
} from "../api/projects";

// ========================================
// Response Helper
// ========================================

function normalizeProjects(
    response: CoordinatorProjectsResponse,
): Project[] {
    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.projects)) {
        return response.projects;
    }

    return [];
}

// ========================================
// Formatting Helpers
// ========================================

function formatDate(date?: string | null): string {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getStatusLabel(
    status?: number | string | null,
): string {
    if (
        status === null ||
        status === undefined ||
        status === ""
    ) {
        return "Unknown";
    }

    const normalized = String(status).trim().toLowerCase();

    const labels: Record<string, string> = {
        "0": "Active",
        "1": "Active",
        "2": "Completed",
        "3": "Inactive",
        active: "Active",
        completed: "Completed",
        complete: "Completed",
        inactive: "Inactive",
        cancelled: "Cancelled",
        "in progress": "In Progress",
    };

    return labels[normalized] ?? String(status);
}

function getStatusClasses(
    status?: number | string | null,
): string {
    const normalized = String(status ?? "")
        .trim()
        .toLowerCase();

    if (["0", "1", "active", "in progress"].includes(normalized)) {
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";
    }

    if (["2", "completed", "complete"].includes(normalized)) {
        return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20";
    }

    if (["3", "inactive", "cancelled"].includes(normalized)) {
        return "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300";
    }

    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
}

// ========================================
// Loading State
// ========================================

function ProjectsLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <RefreshCw
                    size={30}
                    className="animate-spin text-blue-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading assigned projects...
                </p>
            </div>
        </div>
    );
}

// ========================================
// Empty State
// ========================================

function NoProjects({
    searching = false,
}: {
    searching?: boolean;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                {searching ? (
                    <Search
                        size={25}
                        className="text-blue-600 dark:text-blue-400"
                    />
                ) : (
                    <BriefcaseBusiness
                        size={25}
                        className="text-blue-600 dark:text-blue-400"
                    />
                )}
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                {searching
                    ? "No matching projects"
                    : "No assigned projects"}
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searching
                    ? "Try a different search term."
                    : "Projects assigned to your account will appear here."}
            </p>
        </div>
    );
}

// ========================================
// Project Table Row
// ========================================

function ProjectRow({
    project,
}: {
    project: Project;
}) {
    const [foldersExpanded, setFoldersExpanded] = useState(false);

    // Use only fields supported by the current Project type.
    const memberCount = Array.isArray(project.member_ids)
        ? project.member_ids.length
        : 0;

    const folders = Array.isArray(project.folders)
        ? project.folders
        : [];

    return (
        <>
            <tr className="transition-colors hover:bg-blue-50/50 dark:hover:bg-gray-700/40">
                {/* Project */}
                <td className="px-5 py-4 align-top">
                    <div className="flex min-w-[190px] items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                            <Folder
                                size={18}
                                className="text-blue-600 dark:text-blue-400"
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {project.projectname || "Untitled Project"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ID: {project.project_id}
                            </p>
                        </div>
                    </div>
                </td>

                {/* Description */}
                <td className="max-w-[280px] px-5 py-4 align-top">
                    <p
                        className="line-clamp-2 min-w-[160px] text-sm leading-5 text-gray-600 dark:text-gray-300"
                        title={project.projectdesc || ""}
                    >
                        {project.projectdesc || "No description"}
                    </p>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-5 py-4 align-top">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            project.status,
                        )}`}
                    >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {getStatusLabel(project.status)}
                    </span>
                </td>

                {/* Start Date */}
                <td className="whitespace-nowrap px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.start_date)}
                    </div>
                </td>

                {/* End Date */}
                <td className="whitespace-nowrap px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.end_date)}
                    </div>
                </td>

                {/* Members */}
                <td className="whitespace-nowrap px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users
                            size={16}
                            className="text-gray-400"
                        />
                        <span>
                            {memberCount}{" "}
                            {memberCount === 1 ? "member" : "members"}
                        </span>
                    </div>
                </td>

                {/* Folders */}
                <td className="px-5 py-4 align-top">
                    {folders.length > 0 ? (
                        <button
                            type="button"
                            onClick={() =>
                                setFoldersExpanded((previous) => !previous)
                            }
                            aria-expanded={foldersExpanded}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                        >
                            <Folder size={14} />
                            {folders.length}{" "}
                            {folders.length === 1 ? "folder" : "folders"}
                            {foldersExpanded ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    )}
                </td>
            </tr>

            {/* Expandable Folder Details */}
            {foldersExpanded && folders.length > 0 && (
                <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                    <td colSpan={7} className="px-5 py-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Folders in {project.projectname || "this project"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {folders.map((folder) => (
                                <span
                                    key={folder.pfid}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                >
                                    <Folder
                                        size={14}
                                        className="text-blue-500"
                                    />
                                    {folder.fname}
                                </span>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ========================================
// Assigned Projects Page
// ========================================

export default function CoordinatorProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // ========================================
    // Fetch Projects
    // ========================================

    const fetchProjects = useCallback(async () => {
        setError("");

        try {
            const response = await getCoordinatorProjects();
            const projectList = normalizeProjects(response);

            console.log("Coordinator projects API response:", response);
            console.log("Normalized projects:", projectList);

            setProjects(projectList);
        } catch (err: unknown) {
            console.error("Failed to load assigned projects:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading assigned projects.",
            );
        }
    }, []);

    // ========================================
    // Initial Load
    // ========================================

    useEffect(() => {
        const loadInitialProjects = async () => {
            try {
                await fetchProjects();
            } finally {
                setLoading(false);
            }
        };

        void loadInitialProjects();
    }, [fetchProjects]);

    // ========================================
    // Refresh
    // ========================================

    const loadProjects = async () => {
        setRefreshing(true);

        try {
            await fetchProjects();
        } finally {
            setRefreshing(false);
        }
    };

    // ========================================
    // Search
    // ========================================

    const normalizedSearch = search.trim().toLowerCase();

    const filteredProjects = projects.filter((project) => {
        const searchableText = [
            project.projectname,
            project.projectdesc,
            String(project.project_id),
            getStatusLabel(project.status),
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchableText.includes(normalizedSearch);
    });

    // ========================================
    // Loading UI
    // ========================================

    if (loading) {
        return <ProjectsLoading />;
    }

    // ========================================
    // Main UI
    // ========================================

    return (
        <div className="min-h-full w-full bg-gray-50 p-3 dark:bg-gray-900 sm:p-5 lg:p-6">
            <div className="w-full space-y-5">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                            <BriefcaseBusiness
                                size={23}
                                className="text-blue-600 dark:text-blue-400"
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                My Projects
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                View and track the projects assigned to you.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadProjects()}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                        />

                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-red-800 dark:text-red-300">
                                Unable to load assigned projects
                            </h2>
                            <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadProjects()}
                                disabled={refreshing}
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={15}
                                    className={refreshing ? "animate-spin" : ""}
                                />
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Search and Summary */}
                {!error && (
                    <>
                        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
                            <div className="relative w-full sm:max-w-md">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by project name, description, ID or status..."
                                    aria-label="Search projects"
                                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <BriefcaseBusiness
                                    size={16}
                                    className="text-gray-400"
                                />
                                <span>
                                    Showing{" "}
                                    <strong className="text-gray-900 dark:text-white">
                                        {filteredProjects.length}
                                    </strong>{" "}
                                    of{" "}
                                    <strong className="text-gray-900 dark:text-white">
                                        {projects.length}
                                    </strong>{" "}
                                    projects
                                </span>
                            </div>
                        </div>

                        {/* Full-Width Table */}
                        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            {filteredProjects.length === 0 ? (
                                <NoProjects
                                    searching={projects.length > 0}
                                />
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1100px] divide-y divide-gray-200 text-left dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-900/70">
                                                <tr>
                                                    {[
                                                        "Project",
                                                        "Description",
                                                        "Status",
                                                        "Start Date",
                                                        "End Date",
                                                        "Members",
                                                        "Folders",
                                                    ].map((heading) => (
                                                        <th
                                                            key={heading}
                                                            scope="col"
                                                            className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                                                        >
                                                            {heading}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredProjects.map(
                                                    (project) => (
                                                        <ProjectRow
                                                            key={project.project_id}
                                                            project={project}
                                                        />
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Table Footer */}
                                    <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                                        <span>
                                            Total projects: {projects.length}
                                        </span>
                                        <span>
                                            {filteredProjects.length} project
                                            {filteredProjects.length === 1
                                                ? ""
                                                : "s"} displayed
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
