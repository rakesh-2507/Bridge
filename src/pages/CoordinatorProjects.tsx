
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
    UserRoundCog,
    Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getCoordinatorProjects,
    type Project,
    type ProjectFolder,
    type CoordinatorProjectsResponse,
} from "../api/projects";

// ========================================
// Response Helpers
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

function isCoordinatorProject(project: Project): boolean {
    return project.view_type?.toLowerCase() === "coordinator";
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
    if (status === null || status === undefined || status === "") {
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
        return "bg-primary/5 text-primary ring-1 ring-inset ring-blue-600/20 dark:bg-primary/50/10 dark:text-primary dark:ring-blue-500/20";
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
                    className="animate-spin text-primary"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loading your projects...
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5 dark:bg-slate-900/50">
                {searching ? (
                    <Search
                        size={25}
                        className="text-primary dark:text-gray-400"
                    />
                ) : (
                    <BriefcaseBusiness
                        size={25}
                        className="text-primary dark:text-gray-400"
                    />
                )}
            </div>

            <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                {searching ? "No matching projects" : "No assigned projects"}
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
// Folder Tree
// ========================================

function FolderTree({
    folders,
    level = 0,
}: {
    folders: ProjectFolder[];
    level?: number;
}) {
    const [expanded, setExpanded] = useState<number[]>([]);

    if (folders.length === 0) {
        return (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No folders available for this project.
            </p>
        );
    }

    return (
        <div className="space-y-1">
            {folders.map((folder) => {
                const children = folder.children ?? [];
                const isExpanded = expanded.includes(folder.fid);
                const hasChildren = children.length > 0;

                return (
                    <div key={folder.pfid ?? folder.fid}>
                        <div
                            style={{
                                paddingLeft: `${12 + level * 22}px`,
                            }}
                            className="flex items-center gap-2 rounded-lg pr-3 transition hover:bg-primary/5 dark:hover:bg-gray-700/70"
                        >
                            <button
                                type="button"
                                disabled={!hasChildren}
                                onClick={() => {
                                    setExpanded((previous) =>
                                        isExpanded
                                            ? previous.filter(
                                                (id) => id !== folder.fid,
                                            )
                                            : [...previous, folder.fid],
                                    );
                                }}
                                aria-label={
                                    isExpanded
                                        ? `Collapse ${folder.fname}`
                                        : `Expand ${folder.fname}`
                                }
                                className="flex h-9 w-7 shrink-0 items-center justify-center text-gray-500 disabled:cursor-default"
                            >
                                {hasChildren ? (
                                    isExpanded ? (
                                        <ChevronDown size={15} />
                                    ) : (
                                        <ChevronRight size={15} />
                                    )
                                ) : null}
                            </button>

                            <Folder
                                size={17}
                                className="shrink-0 text-blue-500"
                            />

                            <span className="min-w-0 flex-1 truncate py-2 text-sm text-gray-700 dark:text-gray-200">
                                {folder.fname}
                            </span>

                            {hasChildren && (
                                <span className="text-xs text-gray-400">
                                    {children.length}
                                </span>
                            )}
                        </div>

                        {isExpanded && hasChildren && (
                            <FolderTree
                                folders={children}
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ========================================
// Project Row
// ========================================

function ProjectRow({
    project,
    openedProjectId,
    onSelect,
    // onToggleFolders,
}: {
    project: Project;
    openedProjectId: number | null;
    onSelect: (project: Project) => void;
    onToggleFolders: (project: Project) => void;
}) {
    // const [foldersExpanded, setFoldersExpanded] = useState(false);

    const isCoordinator = isCoordinatorProject(project);
    const isMemberOpen = openedProjectId === project.project_id;

    const folders = project.folders ?? [];
    const folderAccess = project.folder_access ?? [];

    // If the API provides an explicit folder-access list, use it
    // to select the accessible top-level folders. Keep each folder's
    // nested children intact.
    const visibleMemberFolders =
        folderAccess.length > 0
            ? folders.filter((folder) =>
                folderAccess.some((access) => access.fid === folder.fid),
            )
            : folders;

    // Some responses provide folder_access without a populated folders array.
    const memberFolders =
        visibleMemberFolders.length > 0
            ? visibleMemberFolders
            : folders.length === 0
                ? folderAccess.map(
                    (folder): ProjectFolder => ({
                        fid: folder.fid,
                        fname: folder.fname,
                        children: [],
                    }),
                )
                : visibleMemberFolders;

    const memberCount = project.member_ids?.length ?? 0;
    const roleLabel = isCoordinator ? "Coordinator" : "Member";

    return (
        <>

            <tr
                onClick={() => onSelect(project)}
                className="cursor-pointer transition-colors hover:bg-primary/5 dark:hover:bg-gray-700/40"
            >

                <td className="px-5 py-2 align-top">
                    <div className="flex min-w-[190px] items-start gap-3">
                        <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isCoordinator
                                ? "bg-green-50 dark:bg-green-900/30"
                                : "bg-primary/5 dark:bg-slate-900/50"
                                }`}
                        >
                            <Folder
                                size={18}
                                className={
                                    isCoordinator
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-primary dark:text-gray-400"
                                }
                            />
                        </div>

                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelect(project);
                                    }}
                                    className="text-left font-semibold text-gray-900 transition-colors hover:text-primary dark:text-white"
                                >
                                    {project.projectname || "Untitled Project"}
                                </button>

                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium ${isCoordinator
                                        ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                                        : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-orange-300"
                                        }`}
                                >
                                    {isCoordinator ? (
                                        <UserRoundCog size={10} />
                                    ) : (
                                        <Eye size={10} />
                                    )}
                                    {roleLabel}
                                </span>
                            </div>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                ID: {project.project_id}
                            </p>
                        </div>
                    </div>
                </td>

                <td className="max-w-[280px] px-5 py-2 align-top">
                    <p
                        title={project.projectdesc || ""}
                        className="line-clamp-2 min-w-[160px] text-sm leading-5 text-gray-600 dark:text-gray-300"
                    >
                        {project.projectdesc || "No description"}
                    </p>
                </td>

                <td className="whitespace-nowrap px-5 py-2 align-top">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            project.status,
                        )}`}
                    >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {getStatusLabel(project.status)}
                    </span>
                </td>

                <td className="whitespace-nowrap px-5 py-2 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.start_date)}
                    </div>
                </td>

                <td className="whitespace-nowrap px-5 py-2 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.end_date)}
                    </div>
                </td>

                <td className="whitespace-nowrap px-5 py-2 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users size={16} className="text-gray-400" />
                        <span>
                            {memberCount}{" "}
                            {memberCount === 1 ? "member" : "members"}
                        </span>
                    </div>
                </td>

                {/* <td className="px-5 py-2 align-top">
                    {isCoordinator ? (
                        <div className="flex flex-col items-start gap-2">
                            <button
                                type="button"
                                onClick={() => onSelect(project)}
                                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
                            >
                                <BriefcaseBusiness size={14} />
                                Manage project
                            </button>

                            {folders.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFoldersExpanded((previous) => !previous)
                                    }
                                    aria-expanded={foldersExpanded}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
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
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onToggleFolders(project)}
                            aria-expanded={isMemberOpen}
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/5 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                            <Folder size={14} />
                            {isMemberOpen ? "Hide folders" : "View Project"}
                            {isMemberOpen ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    )}
                </td> */}
            </tr>

            {/* {isCoordinator && foldersExpanded && (
                <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                    <td colSpan={7} className="px-5 py-2">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Project folders
                        </p>

                        <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                            <FolderTree folders={folders} />
                        </div>
                    </td>
                </tr>
            )} */}

            {/* Member Folder Browser */}
            {!isCoordinator && isMemberOpen && (
                <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                    <td colSpan={7} className="px-5 py-2">
                        <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {project.projectname} — Folders
                                </h3>

                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Browse the folders available in this project.
                                </p>
                            </div>

                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {memberFolders.length}{" "}
                                {memberFolders.length === 1 ? "folder" : "folders"}
                            </span>
                        </div>

                        <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                            <FolderTree folders={memberFolders} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ========================================
// My Projects Page
// ========================================

export default function CoordinatorProjects() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [openedProjectId, setOpenedProjectId] = useState<number | null>(
        null,
    );

    // ========================================
    // Fetch Projects
    // ========================================

    const fetchProjects = useCallback(async () => {
        setError("");

        try {
            const response = await getCoordinatorProjects();
            const projectList = normalizeProjects(response);

            console.log("Assigned projects API response:", response);
            console.log("Normalized assigned projects:", projectList);

            setProjects(projectList);

            setOpenedProjectId((previous) =>
                previous !== null &&
                    projectList.some(
                        (project) =>
                            project.project_id === previous &&
                            !isCoordinatorProject(project),
                    )
                    ? previous
                    : null,
            );
        } catch (err: unknown) {
            console.error("Failed to load assigned projects:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading your projects.",
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
    // Project Click
    // ========================================


    const handleProjectSelect = (project: Project) => {
        if (isCoordinatorProject(project)) {
            navigate(`/dashboard/projects/${project.project_id}/setup`);
            return;
        }

        navigate(`/dashboard/projects/${project.project_id}`, {
            state: { project },
        });
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
            project.view_type ?? "member",
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchableText.includes(normalizedSearch);
    });

    // const coordinatorCount = projects.filter(isCoordinatorProject).length;
    // const memberCount = projects.length - coordinatorCount;

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
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 dark:bg-slate-900/50">
                            <BriefcaseBusiness
                                size={23}
                                className="text-primary dark:text-gray-400"
                            />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                My Projects
                            </h1>

                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                View and manage your projects in one place.
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
                                Unable to load your projects
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

                {!error && (
                    <>
                        {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Total Projects
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {projects.length}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <UserRoundCog
                                        size={16}
                                        className="text-green-500"
                                    />
                                    Coordinator Projects
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {coordinatorCount}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Eye
                                        size={16}
                                        className="text-blue-500"
                                    />
                                    Member Projects
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                                    {memberCount}
                                </p>
                            </div>
                        </div> */}

                        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
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
                                    placeholder="Search projects by name, ID, status or role..."
                                    aria-label="Search projects"
                                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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

                        {/* Projects Table */}
                        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            {filteredProjects.length === 0 ? (
                                <NoProjects searching={projects.length > 0} />
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
                                                        // "Actions",
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
                                                {filteredProjects.map((project) => (
                                                    <ProjectRow
                                                        key={project.project_id}
                                                        project={project}
                                                        openedProjectId={openedProjectId}
                                                        onSelect={handleProjectSelect}
                                                        onToggleFolders={handleProjectSelect}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                                        <span>
                                            Total projects: {projects.length}
                                        </span>

                                        <span>
                                            {filteredProjects.length} project
                                            {filteredProjects.length === 1 ? "" : "s"} displayed
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
