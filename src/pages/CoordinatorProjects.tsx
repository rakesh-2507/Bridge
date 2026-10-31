
import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    BriefcaseBusiness,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    CircleUser,
    Eye,
    Folder,
    FolderKanban,
    FolderOpen,
    Loader2,
    Pencil,
    RefreshCw,
    Search,
    Users,
    UserRoundCog,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getCoordinatorProjects,
    getProject,
    getProjectFolderFiles,
    type Project,
    type ProjectFolder,
} from "../api/projects";

import { getUsers, type User } from "../api/users";

import mrImage from "../assets/mr.png";
import mrsImage from "../assets/mrs.png";

import Modal from "../components/models/Modal";
import { formatDate } from "../utils/dates";
import { getErrorMessage } from "../utils/errors";
import { normalizeCoordinatorProjects } from "../utils/projects";
import { getUserPhotoUrl } from "../utils/users";

// ========================================
// Response Helpers
// ========================================

function isCoordinatorProject(project: Project): boolean {
    return project.view_type?.toLowerCase() === "coordinator";
}

// ========================================
// Folder File Count Helper
// ========================================

async function addFolderFileCounts(
    folders: ProjectFolder[],
    projectId: number,
): Promise<ProjectFolder[]> {
    return Promise.all(
        folders.map(async (folder) => {
            const children = await addFolderFileCounts(
                folder.children ?? [],
                projectId,
            );

            try {
                const response = (await getProjectFolderFiles(
                    projectId,
                    folder.fid,
                )) as {
                    files?: unknown[];
                };

                return {
                    ...folder,
                    fileCount: response.files?.length ?? 0,
                    children,
                };
            } catch (error) {
                console.warn(
                    `Unable to retrieve files for folder ${folder.fid}:`,
                    error,
                );

                return {
                    ...folder,
                    fileCount: 0,
                    children,
                };
            }
        }),
    );
}

// ========================================
// Formatting Helpers
// ========================================

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
        return "bg-primary/5 text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/10 dark:text-primary dark:ring-primary/20";
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
            <div className="flex h-14 w-14 items-center justify-center  rounded-tl-xl rounded-br-xl   bg-primary/5 dark:bg-slate-900/50">
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
// Member Folder Tree
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
                            className="flex items-center gap-2  rounded-tl-xl rounded-br-xl   pr-3 transition hover:bg-primary/5 dark:hover:bg-gray-700/70"
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
                                className="shrink-0 text-primary"
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
// =====================================`===

function ProjectRow({
    project,
    openedProjectId,
    onSelect,
    // onToggleFolders,
    // onViewGantt,
    // onSetup,
}: {
    project: Project;
    openedProjectId: number | null;
    onSelect: (project: Project) => void;
    onToggleFolders: (project: Project) => void;
    onViewGantt: (project: Project) => void;
    onSetup: (project: Project) => void;
}) {
    const isCoordinator = isCoordinatorProject(project);
    const isMemberOpen = openedProjectId === project.project_id;

    const folders = project.folders ?? [];
    const folderAccess = project.folder_access ?? [];

    const visibleMemberFolders =
        folderAccess.length > 0
            ? folders.filter((folder) =>
                folderAccess.some(
                    (access) => access.fid === folder.fid,
                ),
            )
            : folders;

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
                <td className="px-5 py-3 align-top">
                    <div className="flex min-w-[190px] items-start gap-3">
                        <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center  rounded-tl-xl rounded-br-xl   ${isCoordinator
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
                            <div className="mb-1 flex flex-wrap items-center gap-2">
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
                                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${isCoordinator
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

                            {/* <div className="mt-2 flex flex-wrap items-center gap-2">
                                {isCoordinator ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onSetup(project);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition hover:brightness-90"
                                        >
                                            <Pencil size={13} />
                                            Setup
                                        </button>

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onViewGantt(project);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
                                            title="View project Gantt chart"
                                        >
                                            <CalendarDays size={13} />
                                            View Gantt
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onToggleFolders(project);
                                        }}
                                        aria-expanded={isMemberOpen}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-gray-600 dark:text-gray-300"
                                    >
                                        <Folder size={13} />
                                        {isMemberOpen
                                            ? "Hide folders"
                                            : "View folders"}
                                        {isMemberOpen ? (
                                            <ChevronDown size={13} />
                                        ) : (
                                            <ChevronRight size={13} />
                                        )}
                                    </button>
                                )}
                            </div> */}
                        </div>
                    </div>
                </td>

                <td className="max-w-[280px] px-5 py-3 align-top">
                    <p
                        title={project.projectdesc || ""}
                        className="line-clamp-2 min-w-[160px] text-sm leading-5 text-gray-600 dark:text-gray-300"
                    >
                        {project.projectdesc || "No description"}
                    </p>
                </td>

                <td className="whitespace-nowrap px-5 py-3 align-top">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            project.status,
                        )}`}
                    >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {getStatusLabel(project.status)}
                    </span>
                </td>

                <td className="whitespace-nowrap px-5 py-3 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.start_date)}
                    </div>
                </td>

                <td className="whitespace-nowrap px-5 py-3 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays
                            size={15}
                            className="shrink-0 text-gray-400"
                        />
                        {formatDate(project.end_date)}
                    </div>
                </td>

                <td className="whitespace-nowrap px-5 py-3 align-top">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Users size={16} className="text-gray-400" />
                        <span>
                            {memberCount}{" "}
                            {memberCount === 1 ? "member" : "members"}
                        </span>
                    </div>
                </td>
            </tr>

            {/* Member Folder Browser */}
            {!isCoordinator && isMemberOpen && (
                <tr className="bg-gray-50/80 dark:bg-gray-900/40">
                    <td colSpan={6} className="px-5 py-4">
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
                                {memberFolders.length === 1
                                    ? "folder"
                                    : "folders"}
                            </span>
                        </div>

                        <div className="max-w-3xl  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                            <FolderTree folders={memberFolders} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ========================================
// Coordinator Projects Page
// ========================================

export default function CoordinatorProjects() {
    const navigate = useNavigate();

    // ----------------------------------------
    // Projects list state
    // ----------------------------------------

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [openedProjectId, setOpenedProjectId] =
        useState<number | null>(null);

    // ----------------------------------------
    // Project details state
    // ----------------------------------------

    const [selectedProjectId, setSelectedProjectId] =
        useState<number | null>(null);

    const [projectDetails, setProjectDetails] =
        useState<Project | null>(null);

    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    // ----------------------------------------
    // Fetch projects
    // ----------------------------------------

    const fetchProjects = useCallback(async () => {
        setError("");

        try {
            const response = await getCoordinatorProjects();
            const projectList = normalizeCoordinatorProjects(response);

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
                getErrorMessage(
                    err,
                    "Something went wrong while loading your projects.",
                ),
            );
        }
    }, []);

    // ----------------------------------------
    // Initial projects load
    // ----------------------------------------

    useEffect(() => {
        let cancelled = false;

        async function loadInitialProjects() {
            try {
                await fetchProjects();
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadInitialProjects();

        return () => {
            cancelled = true;
        };
    }, [fetchProjects]);

    // ----------------------------------------
    // Load users for project member information
    // ----------------------------------------

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                const response = await getUsers();

                if (!cancelled) {
                    setUsers(response.users ?? []);
                }
            } catch (err) {
                console.error("Failed to load users:", err);
            }
        }

        void loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    // ----------------------------------------
    // Load selected project details
    // ----------------------------------------

    useEffect(() => {
        if (selectedProjectId === null) return;

        let cancelled = false;
        const projectId = selectedProjectId;

        async function loadProjectDetails() {
            setDetailsLoading(true);
            setDetailsError("");
            setProjectDetails(null);
            setFolderModalOpen(false);

            try {
                const response = await getProject(projectId);

                const folders = await addFolderFileCounts(
                    response.folders ?? [],
                    projectId,
                );

                if (!cancelled) {
                    setProjectDetails({
                        ...response,
                        folders,
                    });
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setDetailsError(
                        getErrorMessage(
                            err,
                            "Failed to load project details.",
                        ),
                    );
                }
            } finally {
                if (!cancelled) {
                    setDetailsLoading(false);
                }
            }
        }

        void loadProjectDetails();

        return () => {
            cancelled = true;
        };
    }, [selectedProjectId]);

    // ----------------------------------------
    // Refresh projects list
    // ----------------------------------------

    const loadProjects = async () => {
        setRefreshing(true);

        try {
            await fetchProjects();
        } finally {
            setRefreshing(false);
        }
    };

    // ----------------------------------------
    // Refresh selected project details
    // ----------------------------------------

    const refreshProjectDetails = async () => {
        if (selectedProjectId === null) return;

        setDetailsLoading(true);
        setDetailsError("");

        try {
            const response = await getProject(selectedProjectId);

            const folders = await addFolderFileCounts(
                response.folders ?? [],
                selectedProjectId,
            );

            setProjectDetails({
                ...response,
                folders,
            });
        } catch (err: unknown) {
            setDetailsError(
                getErrorMessage(
                    err,
                    "Failed to refresh project details.",
                ),
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // ----------------------------------------
    // Project navigation handlers
    // ----------------------------------------

    const handleProjectSelect = (project: Project) => {
        if (isCoordinatorProject(project)) {
            setSelectedProjectId(project.project_id);
            setProjectDetails(null);
            setDetailsError("");
            setFolderModalOpen(false);
            return;
        }

        navigate(`/dashboard/projects/${project.project_id}`, {
            state: { project },
        });
    };

    const handleSetup = (project: Project) => {
        navigate(`/dashboard/projects/${project.project_id}/setup`);
    };

    const handleViewGantt = (project: Project) => {
        navigate(`/dashboard/projects/${project.project_id}/gantt`);
    };

    const handleToggleFolders = (project: Project) => {
        setOpenedProjectId((previous) =>
            previous === project.project_id
                ? null
                : project.project_id,
        );
    };

    // const openFolderFiles = (folder: ProjectFolder) => {
    //     if (!projectDetails) return;

    //     setFolderModalOpen(false);

    //     navigate(
    //         `/dashboard/projects/${projectDetails.project_id}/folders/${folder.fid}`,
    //         {
    //             state: {
    //                 project: projectDetails,
    //                 folder,
    //                 folderName: folder.fname,
    //             },
    //         },
    //     );
    // };

    // ----------------------------------------
    // Search and derived values
    // ----------------------------------------

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

    const selectedProjectSummary =
        selectedProjectId === null
            ? undefined
            : projects.find(
                (project) =>
                    project.project_id === selectedProjectId,
            );

    const selectedIsCoordinator = selectedProjectSummary
        ? isCoordinatorProject(selectedProjectSummary)
        : projectDetails
            ? isCoordinatorProject(projectDetails)
            : false;

    // ========================================
    // PROJECT DETAILS VIEW
    // ========================================

    if (selectedProjectId !== null) {
        return (
            <div className="min-h-full bg-slate-50 p-3 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-5 lg:p-6">
                <div className="mx-auto space-y-5">

                    {/* Details error */}
                    {detailsError && (
                        <div
                            role="alert"
                            className="flex items-start gap-2  rounded-tl-xl rounded-br-xl   border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                        >
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            <span className="flex-1">
                                {detailsError}
                            </span>

                            <button
                                type="button"
                                onClick={() => setDetailsError("")}
                                aria-label="Dismiss error"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Details loading */}
                    {detailsLoading && !projectDetails ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <Loader2
                                size={22}
                                className="animate-spin text-primary"
                            />
                            Loading project details...
                        </div>
                    ) : projectDetails ? (
                        <section className="overflow-hidden  rounded-tl-xl rounded-br-xl   border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            {/* Project header */}
                            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFolderModalOpen(true)
                                        }
                                        aria-label={`View folders for ${projectDetails.projectname}`}
                                        className="shrink-0  rounded-tl-xl rounded-br-xl   bg-primary p-3 text-white transition hover:brightness-90"
                                    >
                                        <FolderKanban size={26} />
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFolderModalOpen(true)
                                            }
                                            className="break-words text-left text-xl font-bold text-slate-900 hover:text-primary dark:text-white"
                                        >
                                            {projectDetails.projectname}
                                        </button>

                                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                            Project #{projectDetails.project_id}

                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${Number(projectDetails.status) === 0
                                                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                                    : Number(projectDetails.status) === 1
                                                        ? "border-primary/30 bg-primary/10 text-primary"
                                                        : Number(projectDetails.status) === 2
                                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                    }`}
                                            >
                                                {{
                                                    0: "Pending",
                                                    1: "In Progress",
                                                    2: "Completed",
                                                }[
                                                    Number(projectDetails.status)
                                                ] ?? getStatusLabel(projectDetails.status)}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Header actions */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedIsCoordinator && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSetup(
                                                    selectedProjectSummary ??
                                                    projectDetails,
                                                )
                                            }
                                            className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-90"
                                        >
                                            <Pencil size={16} />
                                            Setup Project
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/dashboard/projects/${selectedProjectId}/gantt`,
                                            )
                                        }
                                        title="View Gantt Chart"
                                        className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
                                    >
                                        <CalendarDays size={16} />
                                        <span>View Gantt Chart</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void refreshProjectDetails()
                                        }
                                        disabled={detailsLoading}
                                        title="Refresh project details"
                                        aria-label="Refresh project details"
                                        className="inline-flex items-center justify-center  rounded-tl-xl rounded-br-xl   border border-slate-300 bg-white p-2.5 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                                    >
                                        <RefreshCw
                                            size={16}
                                            className={
                                                detailsLoading
                                                    ? "animate-spin"
                                                    : ""
                                            }
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Project content and members */}
                            <div className="grid grid-cols-1 lg:grid-cols-10">
                                {/* Description and folders */}
                                <div className="min-w-0 lg:col-span-8">
                                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                                        <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                                            Project Description
                                        </h2>

                                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {projectDetails.projectdesc ||
                                                "No description provided."}
                                        </p>

                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Start Date
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                                    {formatDate(projectDetails.start_date)}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    End Date
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                                                    {formatDate(projectDetails.end_date)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Folder cards */}
                                    <div className="p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Project Folders
                                            </h2>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFolderModalOpen(true)
                                                }
                                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                            >
                                                <FolderOpen size={15} />
                                                View folder tree
                                            </button>
                                        </div>

                                        {projectDetails.folders?.length ? (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                {projectDetails.folders.map(
                                                    (folder) => (
                                                        <button
                                                            key={
                                                                folder.pfid ??
                                                                folder.fid
                                                            }
                                                            type="button"
                                                            // onClick={() =>
                                                            //     openFolderFiles(folder)
                                                            // }
                                                            className="flex min-w-0 items-center gap-3  rounded-tl-xl rounded-br-xl   border border-slate-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-primary/10"
                                                        >
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center  rounded-tl-xl rounded-br-xl   bg-primary/10 text-primary">
                                                                <Folder
                                                                    size={23}
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                                    {folder.fname}
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {folder.children?.length ?? 0}{" "}
                                                                    subfolders
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    {folder.fileCount ?? 0}{" "}
                                                                    files
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center">
                                                <Folder
                                                    size={34}
                                                    className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                                />

                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    No folders available
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Members sidebar */}
                                <aside className="min-w-0 border-t border-slate-200 dark:border-slate-800 lg:col-span-2 lg:border-l lg:border-t-0">
                                    <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                                        <div className="rounded-lg bg-primary p-2 text-white">
                                            <CircleUser size={20} />
                                        </div>

                                        <div>
                                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                                Project Members
                                            </h2>

                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {projectDetails.member_ids?.length ?? 0}{" "}
                                                member(s)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5">
                                        {projectDetails.member_ids?.length ? (
                                            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-2">
                                                {projectDetails.member_ids.map(
                                                    (memberId) => {
                                                        const user = users.find(
                                                            (item) =>
                                                                String(item.uid) ===
                                                                String(memberId),
                                                        );

                                                        const normalizedTitle = user?.title?.trim().toLowerCase();

                                                        const isMr = ["mr", "mr."].includes(normalizedTitle ?? "");

                                                        const isMrs = [
                                                            "ms",
                                                            "mrs",
                                                            "miss",
                                                            "ms.",
                                                            "mrs.",
                                                            "miss.",
                                                        ].includes(normalizedTitle ?? "");

                                                        const defaultAvatar = isMr
                                                            ? mrImage
                                                            : isMrs
                                                                ? mrsImage
                                                                : null;

                                                        const profileImage = getUserPhotoUrl(user);

                                                        const fullName = user
                                                            ? [
                                                                user.title,
                                                                user.firstname,
                                                                user.lastname,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ")
                                                            : `User ID: ${memberId}`;

                                                        return (
                                                            <div
                                                                key={memberId}
                                                                className="flex min-w-0 items-center gap-3  rounded-tl-xl rounded-br-xl   border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                                                            >
                                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-primary/10">
                                                                    <img
                                                                        src={profileImage || defaultAvatar || undefined}
                                                                        alt={`${fullName}'s avatar`}
                                                                        className="h-full w-full object-cover"
                                                                        onError={(event) => {
                                                                            const image = event.currentTarget;

                                                                            if (defaultAvatar && image.src !== new URL(defaultAvatar, window.location.href).href) {
                                                                                image.onerror = null;
                                                                                image.src = defaultAvatar;
                                                                            } else {
                                                                                image.style.display = "none";
                                                                            }
                                                                        }}
                                                                    />

                                                                    {!profileImage && !defaultAvatar && (
                                                                        <CircleUser
                                                                            size={24}
                                                                            className="text-primary"
                                                                            aria-label="Default user avatar"
                                                                        />
                                                                    )}
                                                                </div>

                                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                                    <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                        {fullName}
                                                                    </p>

                                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        {user?.email ||
                                                                            "Project member"}
                                                                    </p>

                                                                    <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                                                                        ID: {memberId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center">
                                                <Users
                                                    size={32}
                                                    className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                                                />

                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    No members assigned
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </aside>
                            </div>
                        </section>
                    ) : (
                        !detailsLoading && (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                                <AlertCircle
                                    size={32}
                                    className="mx-auto mb-3 text-slate-400"
                                />

                                <p className="font-medium">
                                    Unable to display project details
                                </p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Check the error above and try again.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void refreshProjectDetails()
                                    }
                                    disabled={detailsLoading}
                                    className="mt-4  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2 text-sm font-medium text-white hover:brightness-90 disabled:opacity-50"
                                >
                                    Try again
                                </button>
                            </div>
                        )
                    )}
                </div>

        <Modal
          isOpen={folderModalOpen && !!projectDetails}
          onClose={() => setFolderModalOpen(false)}
          title={projectDetails?.projectname ?? "Project Folders"}
          size="2xl"
        >
          {projectDetails &&
            (projectDetails.folders?.length ? (
              <>
                <div className="rounded-xl px-2">
                  <FolderTree
                    folders={projectDetails?.folders ?? []}
                  />
                </div>

                {/* Folder legend */}
                <div className="mt-5 flex flex-wrap justify-end gap-x-4 gap-y-2  rounded-tl-xl rounded-br-xl   bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen
                      size={16}
                      className="shrink-0 text-primary"
                    />

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Subfolders Exist
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Folder
                      size={16}
                      className="shrink-0 text-primary"
                    />

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Files Exist
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Folder
                      size={16}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Empty Folder
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Folder
                  size={38}
                  className="mb-3 text-slate-300 dark:text-slate-600"
                />

                <p className="font-medium text-slate-700 dark:text-slate-200">
                  No folders available
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  This project does not have any folders to display.
                </p>
              </div>
            ))}
        </Modal>
            </div>
        );
    }

    // ========================================
    // PROJECTS LIST VIEW
    // ========================================

    if (loading) {
        return <ProjectsLoading />;
    }

    return (
        <div className="min-h-full w-full bg-gray-50 p-3 dark:bg-gray-900 sm:p-5 lg:p-6">
            <div className="w-full space-y-5">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center  rounded-tl-xl rounded-br-xl   bg-primary/5 dark:bg-slate-900/50">
                            <BriefcaseBusiness
                                size={23}
                                className="text-primary"
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
                        className="inline-flex items-center justify-center gap-2  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* List error */}
                {error && (
                    <div className="flex items-start gap-3  rounded-tl-xl rounded-br-xl   border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
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
                                className="mt-3 inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={15}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Search and count */}
                <div className="flex flex-col gap-4  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
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
                            className="w-full  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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

                {/* Projects table */}
                <div className="w-full overflow-hidden  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {error ? null : filteredProjects.length === 0 ? (
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
                                                onToggleFolders={handleToggleFolders}
                                                onViewGantt={handleViewGantt}
                                                onSetup={handleSetup}
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
                                    {filteredProjects.length === 1 ? "" : "s"}{" "}
                                    displayed
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
