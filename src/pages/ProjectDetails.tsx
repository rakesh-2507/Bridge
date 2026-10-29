import { useState } from "react";
import type { ReactNode } from "react";
import {
    Folder,
    BriefcaseBusiness,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    getProject,
    startProjectFolder,
    type Project,
    type ProjectFolder,
} from "../api/projects";

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

    const initialProject = (
        location.state as { project?: Project } | null
    )?.project;

    const [currentProject, setCurrentProject] = useState<
        Project | undefined
    >(initialProject);

    const [startingFolderId, setStartingFolderId] = useState<number | null>(
        null,
    );
    const [folderError, setFolderError] = useState("");

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

    // Show folders that can start or are already in progress.
    const visibleFolders: ProjectFolder[] = folders
        .filter(isVisibleFolder)
        .map((folder) => ({
            ...folder,
            children: folder.children?.filter(isVisibleFolder),
        }));


    const handleFolderClick = async (folder: ProjectFolder) => {
        const activeProject = currentProject;

        if (!activeProject) {
            setFolderError("Project details are unavailable.");
            return;
        }

        // Prevent duplicate requests.
        if (startingFolderId !== null) {
            return;
        }

        // Already started: open the folder without calling the start API.
        if (Number(folder.status) === 1) {
            navigate(
                `/dashboard/projects/${activeProject.project_id}/folders/${folder.fid}`,
                {
                    state: {
                        project: activeProject,
                        folderName: folder.fname,
                    },
                },
            );
            return;
        }

        // Only pending folders explicitly marked ready can be started.
        if (
            Number(folder.status) !== 0 ||
            folder.can_start !== true
        ) {
            return;
        }

        setStartingFolderId(folder.fid);
        setFolderError("");

        try {
            // This API is called only for pending folders.
            await startProjectFolder(
                activeProject.project_id,
                folder.fid,
            );

            const updatedProject = markFolderInProgress(
                activeProject,
                folder.fid,
            );

            setCurrentProject(updatedProject);

            let latestProject = updatedProject;

            // Refresh project statuses after starting the folder.
            try {
                const refreshedProject = await getProject<Project>(
                    activeProject.project_id,
                );

                if (refreshedProject) {
                    latestProject = markFolderInProgress(
                        refreshedProject,
                        folder.fid,
                    );

                    setCurrentProject(latestProject);
                }
            } catch {
                // Continue using the locally updated project.
            }

            navigate(
                `/dashboard/projects/${activeProject.project_id}/folders/${folder.fid}`,
                {
                    state: {
                        project: latestProject,
                        folderName: folder.fname,
                    },
                },
            );
        } catch (error: unknown) {
            setFolderError(
                error instanceof Error
                    ? error.message
                    : "Unable to start this folder.",
            );
        } finally {
            setStartingFolderId(null);
        }
    };

    const renderFolders = (
        items: ProjectFolder[],
        level = 0,
    ): ReactNode =>
        items.map((folder) => {
            const isStarting = startingFolderId === folder.fid;

            return (
                <div key={folder.fid}>
                    <button
                        type="button"
                        onClick={() => void handleFolderClick(folder)}
                        disabled={startingFolderId !== null}
                        style={{ marginLeft: `${level * 24}px` }}
                        className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-primary/5 disabled:cursor-wait disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <Folder
                            size={23}
                            className="shrink-0 text-primary dark:text-gray-400"
                        />

                        <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {folder.fname}
                        </span>

                        {isInProgress(folder) && (
                            <span className="shrink-0 text-xs text-green-600 dark:text-green-400">
                                In Progress
                            </span>
                        )}

                        {isStarting && (
                            <Loader2
                                size={18}
                                className="shrink-0 animate-spin text-primary"
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
                    className="ml-3 text-primary hover:underline"
                >
                    Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full w-full bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
            <div className="space-y-6">

                {/* Project header */}
                <div className="flex items-center gap-3">
                    <BriefcaseBusiness
                        size={30}
                        className="shrink-0 text-primary dark:text-gray-400"
                    />

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {project.projectname}
                    </h1>
                </div>

                {/* Folder start error */}
                {folderError && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    >
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />
                        <span>{folderError}</span>
                    </div>
                )}

                {/* Available folders */}
                <div className="space-y-3">
                    {visibleFolders.length > 0 ? (
                        renderFolders(visibleFolders)
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No folders available to start yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
