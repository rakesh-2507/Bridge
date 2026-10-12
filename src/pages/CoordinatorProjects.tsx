import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Folder,
    FolderOpen,
    Loader2,
    RefreshCw,
    Users,
    BriefcaseBusiness,
} from "lucide-react";

import { getCoordinatorProjects } from "../api/projects";

// ========================================
// Types
// ========================================

interface ProjectFolder {
    folder_id?: number;
    fid?: number;
    fname?: string;
    folder_name?: string;
    fnamedesc?: string;
    description?: string;
    children?: ProjectFolder[];
    [key: string]: unknown;
}

interface AssignedProject {
    project_id: number;
    projectname: string;
    projectdesc?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: number | string | null;
    coordinator?: number | null;
    member_ids?: number[];
    folders?: ProjectFolder[];
}

type ApiResponse = unknown;

// ========================================
// Normalize API Response
// ========================================

function normalizeProjects(response: ApiResponse): AssignedProject[] {
    let result: unknown = response;

    // Handle common response shapes:
    // [...]
    // { projects: [...] }
    // { data: [...] }
    // { data: { projects: [...] } }
    // { data: { data: [...] } }

    for (let depth = 0; depth < 3; depth += 1) {
        if (Array.isArray(result)) {
            return result.filter(
                (item): item is AssignedProject =>
                    typeof item === "object" &&
                    item !== null &&
                    typeof (item as Record<string, unknown>).project_id === "number",
            );
        }

        if (!result || typeof result !== "object") {
            return [];
        }

        const record = result as Record<string, unknown>;

        if (Array.isArray(record.projects)) {
            result = record.projects;
            continue;
        }

        if ("data" in record) {
            result = record.data;
            continue;
        }

        return [];
    }

    return Array.isArray(result)
        ? result.filter(
            (item): item is AssignedProject =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as Record<string, unknown>).project_id === "number",
        )
        : [];
}

// ========================================
// Formatting Helpers
// ========================================

function formatDate(date?: string | null): string {
    if (!date) {
        return "Not set";
    }

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

function getStatusLabel(status?: number | string | null): string {
    if (status === null || status === undefined || status === "") {
        return "Unknown";
    }

    if (typeof status === "string") {
        const normalized = status.trim().toLowerCase();

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

        return labels[normalized] ?? status;
    }

    const labels: Record<number, string> = {
        0: "Active",
        1: "Active",
        2: "Completed",
        3: "Inactive",
    };

    return labels[status] ?? `Status ${status}`;
}

function getStatusClasses(status?: number | string | null): string {
    const normalized = String(status ?? "").trim().toLowerCase();

    if (
        normalized === "0" ||
        normalized === "1" ||
        normalized === "active" ||
        normalized === "in progress"
    ) {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    }

    if (
        normalized === "2" ||
        normalized === "completed" ||
        normalized === "complete"
    ) {
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }

    if (
        normalized === "3" ||
        normalized === "inactive" ||
        normalized === "cancelled"
    ) {
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }

    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
}

// ========================================
// Folder Tree
// ========================================

interface FolderTreeProps {
    folders: ProjectFolder[];
    level?: number;
}

function FolderTree({ folders, level = 0 }: FolderTreeProps) {
    const [expandedFolders, setExpandedFolders] = useState<
        Record<string, boolean>
    >({});

    if (folders.length === 0) {
        return (
            <p className="py-3 text-sm text-gray-500 dark:text-gray-400">
                No folders available for this project.
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {folders.map((folder, index) => {
                const folderName =
                    folder.fname ||
                    folder.folder_name ||
                    `Folder ${index + 1}`;

                const folderKey = `${folder.folder_id ?? folder.fid ?? index}-${folderName}`;

                const children = Array.isArray(folder.children)
                    ? folder.children
                    : [];

                const hasChildren = children.length > 0;
                const isExpanded = Boolean(expandedFolders[folderKey]);

                return (
                    <div key={folderKey}>
                        <div
                            className="flex min-w-0 items-start gap-2 rounded-lg px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                            style={{ paddingLeft: `${8 + level * 16}px` }}
                        >
                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpandedFolders((previous) => ({
                                            ...previous,
                                            [folderKey]: !previous[folderKey],
                                        }))
                                    }
                                    aria-label={
                                        isExpanded ? "Collapse folder" : "Expand folder"
                                    }
                                    aria-expanded={isExpanded}
                                    className="mt-0.5 shrink-0 rounded p-0.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={15} />
                                    ) : (
                                        <ChevronRight size={15} />
                                    )}
                                </button>
                            ) : (
                                <span className="w-5 shrink-0" />
                            )}

                            {isExpanded ? (
                                <FolderOpen
                                    size={17}
                                    className="mt-0.5 shrink-0 text-blue-500"
                                />
                            ) : (
                                <Folder
                                    size={17}
                                    className="mt-0.5 shrink-0 text-blue-500"
                                />
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="break-words text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {folderName}
                                </p>

                                {(folder.fnamedesc || folder.description) && (
                                    <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                                        {folder.fnamedesc || folder.description}
                                    </p>
                                )}
                            </div>

                            {hasChildren && (
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                    {children.length}
                                </span>
                            )}
                        </div>

                        {hasChildren && isExpanded && (
                            <FolderTree folders={children} level={level + 1} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ========================================
// Loading State
// ========================================

function ProjectsLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2
                    size={34}
                    className="animate-spin text-blue-600"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading your projects...
                </p>
            </div>
        </div>
    );
}

// ========================================
// Empty Projects State
// ========================================

function NoProjects() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-lg text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                    <BriefcaseBusiness
                        size={32}
                        className="text-blue-600 dark:text-blue-400"
                    />
                </div>

                <h2 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome to BridgeWorkflow!
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                    You don't have any projects assigned yet. Once a project
                    is assigned to you, it will appear here automatically.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Folder size={16} />
                    Waiting for project assignment
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/home", { replace: true })}
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

// ========================================
// Assigned Projects Page
// ========================================

export default function CoordinatorProjects() {
    const [projects, setProjects] = useState<AssignedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [expandedProjects, setExpandedProjects] = useState<
        Record<number, boolean>
    >({});

    const hasLoadedInitially = useRef(false);

    const loadProjects = useCallback(async (isInitialLoad = false) => {
        if (!isInitialLoad) {
            setLoading(true);
        }

        setError("");

        try {
            // The backend identifies the logged-in user from the auth token.
            const response: unknown = await getCoordinatorProjects();
            const fetchedProjects = normalizeProjects(response);

            setProjects(fetchedProjects);
        } catch (err: unknown) {
            console.error("Failed to load assigned projects:", err);

            setProjects([]);

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading your projects.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hasLoadedInitially.current) {
            return;
        }

        hasLoadedInitially.current = true;
        void loadProjects(true);
    }, [loadProjects]);

    const toggleProject = (projectId: number) => {
        setExpandedProjects((previous) => ({
            ...previous,
            [projectId]: !previous[projectId],
        }));
    };

    if (loading) {
        return <ProjectsLoading />;
    }

    if (error) {
        return (
            <div className="min-h-full bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
                <div className="mx-auto max-w-3xl">
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                        <AlertCircle
                            size={20}
                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                        />

                        <div className="min-w-0 flex-1">
                            <h2 className="font-semibold text-red-800 dark:text-red-300">
                                Unable to load your projects
                            </h2>

                            <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadProjects()}
                                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                <RefreshCw size={15} />
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (projects.length === 0) {
        return <NoProjects />;
    }

    const totalFolders = projects.reduce(
        (total, project) =>
            total +
            (Array.isArray(project.folders)
                ? project.folders.length
                : 0),
        0,
    );

    return (
        <div className="min-h-full bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <BriefcaseBusiness
                                size={25}
                                className="text-blue-600 dark:text-blue-400"
                            />

                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                My Projects
                            </h1>
                        </div>

                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            View your assigned projects, project details, and folders.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadProjects()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Assigned projects
                                </p>

                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {projects.length}
                                </p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/30">
                                <BriefcaseBusiness
                                    size={24}
                                    className="text-blue-600 dark:text-blue-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total folders
                                </p>

                                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                                    {totalFolders}
                                </p>
                            </div>

                            <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/30">
                                <Folder
                                    size={24}
                                    className="text-indigo-600 dark:text-indigo-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project List */}
                <div className="space-y-4">
                    {projects.map((project) => {
                        const folders = Array.isArray(project.folders)
                            ? project.folders
                            : [];

                        const isExpanded = Boolean(
                            expandedProjects[project.project_id],
                        );

                        return (
                            <section
                                key={project.project_id}
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                                {/* Project Header */}
                                <button
                                    type="button"
                                    onClick={() => toggleProject(project.project_id)}
                                    aria-expanded={isExpanded}
                                    className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:p-5"
                                >
                                    <div className="mt-0.5 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/30">
                                        {isExpanded ? (
                                            <FolderOpen
                                                size={22}
                                                className="text-blue-600 dark:text-blue-400"
                                            />
                                        ) : (
                                            <Folder
                                                size={22}
                                                className="text-blue-600 dark:text-blue-400"
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="break-words text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                                                {project.projectname || "Untitled Project"}
                                            </h2>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                                    project.status,
                                                )}`}
                                            >
                                                {getStatusLabel(project.status)}
                                            </span>
                                        </div>

                                        <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                                            {project.projectdesc || "No project description"}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Folder size={14} />
                                                {folders.length}{" "}
                                                {folders.length === 1 ? "folder" : "folders"}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5">
                                                <Users size={14} />
                                                {project.member_ids?.length ?? 0}{" "}
                                                {(project.member_ids?.length ?? 0) === 1
                                                    ? "member"
                                                    : "members"}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarDays size={14} />
                                                Start: {formatDate(project.start_date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-1 shrink-0 text-gray-400">
                                        {isExpanded ? (
                                            <ChevronDown size={20} />
                                        ) : (
                                            <ChevronRight size={20} />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 dark:bg-gray-900/40 sm:grid-cols-2 sm:p-5">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Project ID
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {project.project_id}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Coordinator ID
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {project.coordinator ?? "Not assigned"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    Start date
                                                </p>

                                                <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                                                    {formatDate(project.start_date)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                    End date
                                                </p>

                                                <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                                                    {formatDate(project.end_date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5">
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    Project folders
                                                </h3>

                                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    {folders.length}
                                                </span>
                                            </div>

                                            <div className="rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                                                <FolderTree folders={folders} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
