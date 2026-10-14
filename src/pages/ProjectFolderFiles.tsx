
import { useEffect, useState } from "react";
import {
    // ArrowLeft,
    Folder,
    FileText,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

import {
    getProjectFolderFiles,
    type Project,
} from "../api/projects";

interface FolderFile {
    file_id?: number;
    id?: number;
    filename?: string;
    file_name?: string;
    name?: string;
    [key: string]: unknown;
}

interface FolderNavigationState {
    project?: Project;
    folderName?: string;
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

export default function ProjectFolderFiles() {
    // const navigate = useNavigate();
    const location = useLocation();
    const { projectId, folderId } = useParams<{
        projectId: string;
        folderId: string;
    }>();

    const navigationState =
        location.state as FolderNavigationState | null;

    const project = navigationState?.project;
    const folderName = navigationState?.folderName ?? "Folder files";

    const [files, setFiles] = useState<FolderFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadFiles = async () => {
        if (!projectId || !folderId) {
            setError("Project or folder ID is missing.");
            setLoading(false);
            return;
        }

        const parsedProjectId = Number(projectId);
        const parsedFolderId = Number(folderId);

        if (
            !Number.isInteger(parsedProjectId) ||
            !Number.isInteger(parsedFolderId) ||
            parsedProjectId <= 0 ||
            parsedFolderId <= 0
        ) {
            setError("Invalid project or folder ID.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getProjectFolderFiles(
                parsedProjectId,
                parsedFolderId,
            );

            setFiles(normalizeFiles(response));
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load folder files.",
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        let cancelled = false;

        const loadFiles = async () => {
            if (!projectId || !folderId) {
                setError("Project or folder ID is missing.");
                setLoading(false);
                return;
            }

            const parsedProjectId = Number(projectId);
            const parsedFolderId = Number(folderId);

            if (
                !Number.isInteger(parsedProjectId) ||
                !Number.isInteger(parsedFolderId) ||
                parsedProjectId <= 0 ||
                parsedFolderId <= 0
            ) {
                setError("Invalid project or folder ID.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await getProjectFolderFiles(
                    parsedProjectId,
                    parsedFolderId,
                );

                if (!cancelled) {
                    setFiles(normalizeFiles(response));
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load folder files.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadFiles();

        return () => {
            cancelled = true;
        };
    }, [projectId, folderId]);


    // const handleBack = () => {
    //     navigate(
    //         project
    //             ? `/dashboard/projects/${projectId}`
    //             : "/dashboard/projects",
    //         project ? { state: { project } } : undefined,
    //     );
    // };

    const getFileName = (file: FolderFile) =>
        file.filename ?? file.file_name ?? file.name ?? "Unnamed file";

    return (
        <div className="min-h-full w-full bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
            <div className="mx-auto w-full max-w-5xl space-y-6">
                {/* Back navigation */}
                {/* <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                    <ArrowLeft size={18} />
                    Back to folders
                </button> */}

                {/* Folder heading */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Folder
                            size={26}
                            className="text-blue-600 dark:text-blue-400"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">
                            {folderName}
                        </h1>

                        {project?.projectname && (
                            <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                                {project.projectname}
                            </p>
                        )}
                    </div>

                    {!loading && !error && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {files.length}{" "}
                            {files.length === 1 ? "file" : "files"}
                        </span>
                    )}
                </div>

                {/* Files */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-sm text-gray-500 dark:text-gray-400">
                            <Loader2
                                size={30}
                                className="animate-spin text-blue-600"
                            />
                            Loading files...
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                            <AlertCircle
                                size={32}
                                className="text-red-500"
                            />

                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => void loadFiles()}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                                <RefreshCw size={16} />
                                Try again
                            </button>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <FileText
                                    size={28}
                                    className="text-gray-400"
                                />
                            </div>

                            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                No files yet
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                There are no files in this folder.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {files.map((file, index) => {
                                const fileName = getFileName(file);

                                return (
                                    <div
                                        key={
                                            file.file_id ??
                                            file.id ??
                                            index
                                        }
                                        className="flex items-center gap-3 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:px-5"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                            <FileText
                                                size={21}
                                                className="text-blue-600 dark:text-blue-400"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p
                                                title={fileName}
                                                className="truncate text-sm font-medium text-gray-800 dark:text-gray-100"
                                            >
                                                {fileName}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
