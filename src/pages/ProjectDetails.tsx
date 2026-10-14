
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    ArrowLeft,
    Folder,
    BriefcaseBusiness,
    FileText,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    getProject,
    getProjectFolderFiles,
    startProjectFolder,
    type Project,
    type ProjectFolder,
} from "../api/projects";

interface FolderFile {
    file_id?: number;
    id?: number;
    filename?: string;
    file_name?: string;
    name?: string;
    [key: string]: unknown;
}

function normalizeFiles(response: unknown): FolderFile[] {
    if (Array.isArray(response)) {
        return response as FolderFile[];
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    const data = response as Record<string, unknown>;

    if (Array.isArray(data.files)) {
        return data.files as FolderFile[];
    }

    if (Array.isArray(data.folder_files)) {
        return data.folder_files as FolderFile[];
    }

    if (Array.isArray(data.data)) {
        return data.data as FolderFile[];
    }

    if (data.data && typeof data.data === "object") {
        const nested = data.data as Record<string, unknown>;

        if (Array.isArray(nested.files)) {
            return nested.files as FolderFile[];
        }

        if (Array.isArray(nested.folder_files)) {
            return nested.folder_files as FolderFile[];
        }
    }

    return [];
}

function isInProgress(folder: ProjectFolder): boolean {
    return Number(folder.status) === 1;
}

function isReadyToStart(folder: ProjectFolder): boolean {
    return folder.can_start === true && Number(folder.status) === 0;
}

function isVisibleFolder(folder: ProjectFolder): boolean {
    return isInProgress(folder) || isReadyToStart(folder);
}

function markFolderInProgress(
    project: Project,
    folderId: number,
): Project {
    const updateFolder = (folder: ProjectFolder): ProjectFolder => ({
        ...folder,
        ...(folder.fid === folderId
            ? { status: 1, can_start: false }
            : {}),
        ...(folder.children
            ? { children: folder.children.map(updateFolder) }
            : {}),
    });

    return {
        ...project,
        folders: project.folders?.map(updateFolder),
    };
}

export default function ProjectDetails() {
    const navigate = useNavigate();
    const location = useLocation();

    const initialProject = location.state?.project as Project | undefined;

    const [currentProject, setCurrentProject] = useState<Project | undefined>(
        initialProject,
    );

    const [selectedFolder, setSelectedFolder] =
        useState<ProjectFolder | null>(null);

    const [folderFiles, setFolderFiles] = useState<FolderFile[]>([]);
    const [loadingFolder, setLoadingFolder] = useState(false);
    const [folderError, setFolderError] = useState("");

    const autoLoadedFolders = useRef<Set<number>>(new Set());

    const project = currentProject;

    const folders: ProjectFolder[] = project?.folders?.length
        ? project.folder_access?.length
            ? project.folders.filter((folder) =>
                project.folder_access!.some(
                    (access) => access.fid === folder.fid,
                ),
            )
            : project.folders
        : (project?.folder_access ?? []).map((folder) => ({
            fid: folder.fid,
            fname: folder.fname,
            can_start: false,
            status: 0,
            children: [],
        }));

    // Only show folders that can start or are already in progress.
    const visibleFolders: ProjectFolder[] = folders
        .filter(isVisibleFolder)
        .map((folder) => ({
            ...folder,
            children: folder.children?.filter(isVisibleFolder),
        }));

    const loadFolderFiles = useCallback(
        async (folder: ProjectFolder) => {
            if (!project) return;

            setSelectedFolder(folder);
            setFolderFiles([]);
            setFolderError("");
            setLoadingFolder(true);

            try {
                const response = await getProjectFolderFiles(
                    project.project_id,
                    folder.fid,
                );

                setFolderFiles(normalizeFiles(response));
            } catch (error: unknown) {
                setFolderError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load files for this folder.",
                );
            } finally {
                setLoadingFolder(false);
            }
        },
        [project],
    );

    // Automatically load files for an already in-progress folder.
    useEffect(() => {
        if (!project) return;

        const inProgressFolder = visibleFolders.find(
            (folder) =>
                isInProgress(folder) &&
                !autoLoadedFolders.current.has(folder.fid),
        );

        if (inProgressFolder) {
            autoLoadedFolders.current.add(inProgressFolder.fid);
            void loadFolderFiles(inProgressFolder);
        }
    }, [project, loadFolderFiles, visibleFolders]);

    const handleFolderClick = async (folder: ProjectFolder) => {
        if (!project) return;

        // In-progress folders only need their files loaded.
        if (isInProgress(folder)) {
            navigate(
                `/dashboard/projects/${project.project_id}/folders/${folder.fid}`,
                {
                    state: {
                        project,
                        folderName: folder.fname,
                    },
                },
            );
            return;
        }

        // Do not start folders that are not ready.
        if (!isReadyToStart(folder)) {
            return;
        }

        setSelectedFolder(folder);
        setFolderFiles([]);
        setFolderError("");
        setLoadingFolder(true);

        try {
            // Start the folder only when the API says it can start.
            await startProjectFolder(project.project_id, folder.fid);

            autoLoadedFolders.current.add(folder.fid);

            // Optimistically update the local status so the folder remains
            // visible after can_start becomes false.
            setCurrentProject((previous) =>
                previous
                    ? markFolderInProgress(previous, folder.fid)
                    : previous,
            );

            // Refresh project details to retrieve the latest folder statuses.
            try {
                const refreshedProject = await getProject<Project>(
                    project.project_id,
                );

                if (refreshedProject) {
                    setCurrentProject(
                        markFolderInProgress(
                            refreshedProject,
                            folder.fid,
                        ),
                    );
                }
            } catch {
                // Keep the locally updated status if refreshing fails.
            }

            // Starting succeeded, so load this folder's files.
            const response = await getProjectFolderFiles(
                project.project_id,
                folder.fid,
            );

            setFolderFiles(normalizeFiles(response));
        } catch (error: unknown) {
            setFolderError(
                error instanceof Error
                    ? error.message
                    : "Unable to start the folder or load its files.",
            );
        } finally {
            setLoadingFolder(false);
        }
    };

    const renderFolders = (
        items: ProjectFolder[],
        level = 0,
    ): ReactNode =>
        items.map((folder) => {
            const isSelected = selectedFolder?.fid === folder.fid;

            return (
                <div key={folder.pfid ?? folder.fid}>
                    <button
                        type="button"
                        onClick={() => void handleFolderClick(folder)}
                        style={{ marginLeft: `${level * 24}px` }}
                        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${isSelected
                                ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                            }`}
                    >
                        <Folder
                            size={23}
                            className="shrink-0 text-blue-600 dark:text-blue-400"
                        />

                        <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {folder.fname}
                        </span>

                        {isInProgress(folder) && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                                In Progress
                            </span>
                        )}

                        {isSelected && loadingFolder && (
                            <Loader2
                                size={17}
                                className="animate-spin text-blue-600"
                            />
                        )}
                    </button>

                    {folder.children?.length
                        ? renderFolders(folder.children, level + 1)
                        : null}
                </div>
            );
        });

    if (!project) {
        return (
            <div className="p-6 text-gray-600 dark:text-gray-300">
                Project details unavailable.
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/projects")}
                    className="ml-3 text-blue-600 hover:underline"
                >
                    Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
            <div className="space-y-6">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/projects")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400"
                >
                    <ArrowLeft size={17} />
                    Back
                </button>

                {/* Project header */}
                <div className="flex items-center gap-3">
                    <BriefcaseBusiness
                        size={30}
                        className="shrink-0 text-blue-600 dark:text-blue-400"
                    />

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {project.projectname}
                    </h1>
                </div>

                {/* Folders that are ready to start or already in progress */}
                <div className="space-y-3">
                    {visibleFolders.length > 0 ? (
                        renderFolders(visibleFolders)
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No folders available to start yet.
                        </p>
                    )}
                </div>

                {/* Selected folder files */}
                {selectedFolder && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <Folder
                                size={22}
                                className="shrink-0 text-blue-600 dark:text-blue-400"
                            />

                            <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                                {selectedFolder.fname}
                            </h2>
                        </div>

                        {loadingFolder ? (
                            <div className="flex items-center gap-2 py-5 text-sm text-gray-500 dark:text-gray-400">
                                <Loader2
                                    size={18}
                                    className="animate-spin"
                                />
                                Loading files...
                            </div>
                        ) : folderError ? (
                            <div className="flex items-start gap-2 py-3 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle
                                    size={18}
                                    className="mt-0.5 shrink-0"
                                />
                                <span>{folderError}</span>
                            </div>
                        ) : folderFiles.length === 0 ? (
                            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                No files present in this folder.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {folderFiles.map((file, index) => (
                                    <div
                                        key={file.file_id ?? file.id ?? index}
                                        className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                                    >
                                        <FileText
                                            size={20}
                                            className="shrink-0 text-blue-600 dark:text-blue-400"
                                        />

                                        <span className="min-w-0 truncate text-sm text-gray-800 dark:text-gray-200">
                                            {file.filename ??
                                                file.file_name ??
                                                file.name ??
                                                "Unnamed file"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
