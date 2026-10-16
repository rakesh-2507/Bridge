import { useEffect, useState } from "react";
import {
    Folder,
    Loader2,
    AlertCircle,
    RefreshCw,
    ChevronRight,
    Trash2,
    X,
    ExternalLink,
    Download,
    Upload,
    File,
    FileImage,
    FileText,
    FileSpreadsheet,
    FileCode,
    FileArchive,
    FileType,
} from "lucide-react";

import {
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getProject,
    getProjectFolderFiles,
    uploadProjectFolderFiles,
    deleteProjectFolderFile,
    type Project,
} from "../api/projects";

import { getUsers, type User } from "../api/users";

interface FolderFile {
    file_id?: number;
    id?: number;
    filename?: string;
    file_name?: string;
    name?: string;
    createduid?: number | string | null;
    createddate?: string | null;
    filesize?: number | string | null;
    mime_type?: string | null;

    file_url?: string;
    download_url?: string;
    url?: string;
    path?: string;

    [key: string]: unknown;
}

interface ProjectFolder {
    fid: number;
    fname: string;
    children?: ProjectFolder[];
}

interface FolderNavigationState {
    project?: Project;
    folder?: ProjectFolder;
    folderName?: string;
}


const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
        // Images
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "svg":
        case "webp":
        case "bmp":
            return <FileImage size={20} className="text-purple-500" />;

        // Word documents
        case "doc":
        case "docx":
            return <FileType size={20} className="text-blue-600" />;

        // Excel spreadsheets
        case "xls":
        case "xlsx":
        case "csv":
            return (
                <FileSpreadsheet size={20} className="text-green-600" />
            );

        // PDF documents
        case "pdf":
            return <FileText size={20} className="text-red-500" />;

        // Text files
        case "txt":
        case "md":
        case "rtf":
            return <FileText size={20} className="text-gray-500" />;

        // Code files
        case "js":
        case "jsx":
        case "ts":
        case "tsx":
        case "html":
        case "css":
        case "json":
        case "xml":
            return <FileCode size={20} className="text-orange-500" />;

        // Archives
        case "zip":
        case "rar":
        case "7z":
            return <FileArchive size={20} className="text-yellow-600" />;

        // Default icon
        default:
            return <File size={20} className="text-primary" />;
    }
};

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

function findProjectFolder(
    folders: ProjectFolder[] | undefined,
    targetId: number,
): ProjectFolder | undefined {
    for (const folder of folders ?? []) {
        if (Number(folder.fid) === targetId) {
            return folder;
        }

        const found = findProjectFolder(folder.children, targetId);

        if (found) {
            return found;
        }
    }

    return undefined;
}

function getProjectFolders(
    project: Project | null | undefined,
): ProjectFolder[] {
    if (!project) {
        return [];
    }

    const folders = (
        project as Project & {
            folders?: ProjectFolder[];
        }
    ).folders;

    return Array.isArray(folders) ? folders : [];
}

function formatFileSize(
    bytes: number | string | null | undefined,
): string {
    if (bytes == null || bytes === "") {
        return "Unknown size";
    }

    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) {
        return "Unknown size";
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatUploadedDate(date?: string | null): string {
    if (!date) {
        return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Unknown date";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getProjectStatus(status: unknown) {
    const value = String(status ?? "").trim().toLowerCase();

    if (value === "0" || value === "pending") {
        return {
            label: "Pending",
            className:
                "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        };
    }

    if (
        value === "1" ||
        value === "in progress" ||
        value === "in_progress"
    ) {
        return {
            label: "In Progress",
            className:
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        };
    }

    if (value === "2" || value === "completed") {
        return {
            label: "Completed",
            className:
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        };
    }

    return {
        label: value ? String(status) : "Unknown",
        className:
            "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    };
}

function getFileName(file: FolderFile): string {
    return (
        file.filename ??
        file.file_name ??
        file.name ??
        "Unnamed file"
    );
}

function getFileKey(file: FolderFile, index: number): string {
    return String(file.file_id ?? file.id ?? `file-${index}`);
}

function getUploaderName(
    file: FolderFile,
    users: User[],
): string {
    if (file.createduid == null || file.createduid === "") {
        return "Unknown user";
    }

    const uploader = users.find(
        (user) => Number(user.uid) === Number(file.createduid),
    );

    if (!uploader) {
        return `User ID: ${file.createduid}`;
    }

    const fullName = [
        uploader.title,
        uploader.firstname,
        uploader.lastname,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        fullName ||
        uploader.loginname ||
        `User ID: ${file.createduid}`
    );
}

export default function ProjectFolderFiles() {
    const navigate = useNavigate();
    const location = useLocation();

    const { projectId, folderId } = useParams<{
        projectId: string;
        folderId: string;
    }>();

    const navigationState =
        location.state as FolderNavigationState | null;

    const [project, setProject] = useState<Project | null>(
        navigationState?.project ?? null,
    );

    const [currentFolder, setCurrentFolder] =
        useState<ProjectFolder | null>(
            navigationState?.folder ?? null,
        );

    const [files, setFiles] = useState<FolderFile[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
        new Set(),
    );

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [folderError, setFolderError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const parsedProjectId = Number(projectId);
    const parsedFolderId = Number(folderId);

    const currentFolderName =
        currentFolder?.fname ??
        navigationState?.folderName ??
        "Folder files";

    const subfolders = currentFolder?.children ?? [];
    const [previewFile, setPreviewFile] = useState<FolderFile | null>(null);
    const [previewText, setPreviewText] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const allFilesSelected =
        files.length > 0 &&
        files.every((file, index) =>
            selectedFiles.has(getFileKey(file, index)),
        );


    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState("");
    const handleUploadFiles = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const input = event.currentTarget;
        const selectedFiles = Array.from(input.files ?? []);

        if (selectedFiles.length === 0) {
            return;
        }

        if (
            !Number.isInteger(parsedProjectId) ||
            parsedProjectId <= 0 ||
            !Number.isInteger(parsedFolderId) ||
            parsedFolderId <= 0
        ) {
            setUploadError("Invalid project or folder ID.");
            input.value = "";
            return;
        }

        setUploading(true);
        setUploadError("");
        setUploadSuccess("");

        try {
            await uploadProjectFolderFiles(
                parsedProjectId,
                parsedFolderId,
                selectedFiles,
            );

            setUploadSuccess(
                `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"
                } uploaded successfully.`,
            );

            setSelectedFiles(new Set());

            // Reload the folder's file list.
            setReloadKey((key) => key + 1);
        } catch (err: unknown) {
            setUploadError(
                err instanceof Error
                    ? err.message
                    : "Unable to upload files. Please try again.",
            );
        } finally {
            setUploading(false);
            input.value = "";
        }
    };

    function getFileExtension(file: FolderFile): string {
        const name = getFileName(file);
        return name.split(".").pop()?.toLowerCase() ?? "";
    }

    function getFilePreviewUrl(file: FolderFile): string | null {
        const value =
            file.file_url ??
            file.download_url ??
            file.url ??
            file.path;

        if (typeof value !== "string" || !value.trim()) {
            return null;
        }

        // Do not assume that a relative path is a complete URL.
        return value;
    }

    function isImageFile(file: FolderFile): boolean {
        const mime = file.mime_type?.toLowerCase() ?? "";

        return (
            mime.startsWith("image/") ||
            ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"].includes(
                getFileExtension(file),
            )
        );
    }

    function isTextFile(file: FolderFile): boolean {
        const extension = getFileExtension(file);
        const mime = file.mime_type?.toLowerCase() ?? "";

        return (
            mime.startsWith("text/") ||
            mime === "application/json" ||
            mime === "application/xml" ||
            [
                "txt", "md", "markdown", "json", "xml", "csv",
                "log", "html", "css", "js", "jsx", "ts", "tsx",
                "py", "java", "c", "cpp", "h", "sql", "yaml", "yml",
                "ini", "toml", "sh", "bat", "env",
            ].includes(extension)
        );
    }

    const handleOpenFile = async (file: FolderFile) => {
        setPreviewFile(file);
        setPreviewText("");
        setPreviewError("");
        setPreviewLoading(false);

        const url = getFilePreviewUrl(file);

        if (!url) {
            setPreviewError(
                "The file URL is unavailable. Please provide a file download or preview endpoint from your backend.",
            );
            return;
        }

        if (isTextFile(file)) {
            setPreviewLoading(true);

            try {
                const response = await fetch(url, {
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    throw new Error("Unable to load the file content.");
                }

                setPreviewText(await response.text());
            } catch (err: unknown) {
                setPreviewError(
                    err instanceof Error
                        ? err.message
                        : "Unable to preview this file.",
                );
            } finally {
                setPreviewLoading(false);
            }
        }
    };

    // Load users for resolving file uploader IDs.
    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                const response = await getUsers();

                if (!cancelled) {
                    setUsers(response.users);
                }
            } catch (err: unknown) {
                if (!cancelled) {
                    console.error("Failed to load users:", err);
                }
            }
        }

        void loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    // Load project, folder details, and files.
    useEffect(() => {
        let cancelled = false;

        async function loadFolderContents() {
            if (
                !projectId ||
                !folderId ||
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
            setFolderError("");

            try {
                const activeProject =
                    navigationState?.project ??
                    project ??
                    (await getProject(parsedProjectId));

                if (cancelled) return;

                setProject(activeProject);

                const folder = findProjectFolder(
                    getProjectFolders(activeProject),
                    parsedFolderId,
                );

                if (cancelled) return;

                if (folder) {
                    setCurrentFolder(folder);
                } else {
                    const stateFolder =
                        navigationState?.folder &&
                            Number(navigationState.folder.fid) ===
                            parsedFolderId
                            ? navigationState.folder
                            : null;

                    setCurrentFolder(stateFolder);

                    setFolderError(
                        "Folder details are unavailable in the project folder tree.",
                    );
                }

                const response = await getProjectFolderFiles(
                    parsedProjectId,
                    parsedFolderId,
                );

                if (cancelled) return;

                setFiles(normalizeFiles(response));
            } catch (err: unknown) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load folder contents.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadFolderContents();

        return () => {
            cancelled = true;
        };
    }, [
        projectId,
        folderId,
        parsedProjectId,
        parsedFolderId,
        project,
        navigationState?.project,
        navigationState?.folder,
        navigationState?.folderName,
        reloadKey,
    ]);

    // Select or deselect one file.
    const toggleFileSelection = (fileKey: string) => {
        setSelectedFiles((previous) => {
            const updated = new Set(previous);

            if (updated.has(fileKey)) {
                updated.delete(fileKey);
            } else {
                updated.add(fileKey);
            }

            return updated;
        });
    };

    // Select or deselect all files in this folder.
    const toggleSelectAll = () => {
        if (allFilesSelected) {
            setSelectedFiles(new Set());
            return;
        }

        setSelectedFiles(
            new Set(
                files.map((file, index) =>
                    getFileKey(file, index),
                ),
            ),
        );
    };

    const handleOpenSubfolder = (folder: ProjectFolder) => {
        setSelectedFiles(new Set());

        navigate(
            `/dashboard/projects/${projectId}/folders/${folder.fid}`,
            {
                state: {
                    project: project ?? undefined,
                    folder,
                    folderName: folder.fname,
                } satisfies FolderNavigationState,
            },
        );
    };


    const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");

    const handleDeleteFile = async (file: FolderFile) => {
        const fileId = Number(file.file_id ?? file.id);

        if (!Number.isInteger(fileId) || fileId <= 0) {
            setDeleteError("Cannot delete file: invalid file ID.");
            return;
        }

        const fileName = getFileName(file);

        if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return;
        }

        setDeletingFileId(fileId);
        setDeleteError("");
        setDeleteSuccess("");

        try {
            await deleteProjectFolderFile(
                parsedProjectId,
                parsedFolderId,
                fileId,
            );

            setSelectedFiles((previous) => {
                const updated = new Set(previous);
                updated.delete(getFileKey(file, files.indexOf(file)));
                return updated;
            });

            setDeleteSuccess(`"${fileName}" deleted successfully.`);

            // Refresh the file list from the backend.
            setReloadKey((key) => key + 1);
        } catch (err: unknown) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete the file. Please try again.",
            );
        } finally {
            setDeletingFileId(null);
        }
    };


    const projectStatus = getProjectStatus(project?.status);

    return (
        <div className="min-h-full w-full bg-gray-50 p-4 text-gray-800 dark:bg-gray-900 dark:text-gray-100 sm:p-6">
            <div className="mx-auto w-full space-y-6">
                {/* Project header */}
                <div className="flex w-full flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:p-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary dark:bg-blue-900/30">
                            <Folder
                                size={26}
                                className="text-white dark:text-blue-400"
                            />
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                                {project?.projectname || "Project"}
                            </h1>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                                    {currentFolderName}
                                </span>

                                {project && (
                                    <span
                                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${projectStatus.className}`}
                                    >
                                        {projectStatus.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {!loading && !error && (
                        <div className="flex shrink-0 items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 dark:bg-blue-900/40">
                                <FileText
                                    size={21}
                                    className="text-primary/90 dark:text-blue-400"
                                />
                            </div>

                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {files.length}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {files.length === 1 ? "File" : "Files"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading and error states */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-16 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <Loader2
                            size={30}
                            className="animate-spin text-primary"
                        />
                        Loading folder contents...
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-12 text-center dark:border-gray-700 dark:bg-gray-800">
                        <AlertCircle
                            size={32}
                            className="text-red-500"
                        />

                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setReloadKey((key) => key + 1)
                            }
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            <RefreshCw size={16} />
                            Try again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Subfolders */}
                        {subfolders.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Subfolders ({subfolders.length})
                                </h2>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    {subfolders.map((folder) => (
                                        <button
                                            key={folder.fid}
                                            type="button"
                                            onClick={() =>
                                                handleOpenSubfolder(folder)
                                            }
                                            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary/60 hover:bg-primary/10 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition group-hover:bg-primary/20 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/60">
                                                <Folder
                                                    size={23}
                                                    className="text-primary/70 dark:text-blue-400"
                                                />
                                            </div>

                                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                                                {folder.fname}
                                            </span>

                                            <ChevronRight
                                                size={18}
                                                className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Files table */}
                        <section className="space-y-3">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Files ({files.length})
                                </h2>

                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedFiles.size} selected
                                    </span>

                                    {selectedFiles.size > 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedFiles(new Set())
                                            }
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Clear selection
                                        </button>
                                    )}

                                    {/* Upload files action */}
                                    <label
                                        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 ${uploading
                                            ? "pointer-events-none cursor-not-allowed opacity-60"
                                            : ""
                                            }`}
                                    >
                                        {uploading ? (
                                            <Loader2 size={17} className="animate-spin" />
                                        ) : (
                                            <Upload size={17} />
                                        )}

                                        {uploading ? "Uploading..." : "Upload Files"}

                                        <input
                                            type="file"
                                            multiple
                                            disabled={uploading}
                                            onChange={handleUploadFiles}
                                            className="hidden"
                                            aria-label="Choose files to upload"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Upload feedback */}
                            {uploadError && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
                                >
                                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    <span>{uploadError}</span>

                                    <button
                                        type="button"
                                        onClick={() => setUploadError("")}
                                        className="ml-auto shrink-0"
                                        aria-label="Dismiss upload error"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {uploadSuccess && (
                                <div
                                    role="status"
                                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300"
                                >
                                    {uploadSuccess}
                                </div>
                            )}

                            {deleteError && (
                                <div
                                    role="alert"
                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300"
                                >
                                    {deleteError}
                                    <button
                                        type="button"
                                        onClick={() => setDeleteError("")}
                                        className="ml-3 font-semibold"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {deleteSuccess && (
                                <div
                                    role="status"
                                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300"
                                >
                                    {deleteSuccess}
                                </div>
                            )}

                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                {files.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                            <FileText
                                                size={28}
                                                className="text-gray-400"
                                            />
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                                            No files yet
                                        </h3>

                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            There are no files in this folder.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[1050px] text-left text-sm">
                                            <thead className="bg-primary text-white dark:bg-slate-950">
                                                <tr>
                                                    <th className="w-12 px-4 py-4">
                                                        <input
                                                            type="checkbox"
                                                            aria-label="Select all files"
                                                            checked={allFilesSelected}
                                                            onChange={toggleSelectAll}
                                                            className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-white"
                                                        />
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                                                        FID
                                                    </th>

                                                    <th className="px-4 py-4 font-semibold">
                                                        File Name
                                                    </th>

                                                    <th className="px-4 py-4 font-semibold">
                                                        Uploaded By
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                                                        File Size
                                                    </th>

                                                    <th className="whitespace-nowrap px-4 py-4 font-semibold">
                                                        Uploaded Date
                                                    </th>

                                                    <th className="px-4 py-4 text-center font-semibold">
                                                        Delete
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {files.map((file, index) => {
                                                    const fileKey =
                                                        getFileKey(file, index);

                                                    const isSelected =
                                                        selectedFiles.has(fileKey);

                                                    const fileName =
                                                        getFileName(file);

                                                    const uploaderName =
                                                        getUploaderName(
                                                            file,
                                                            users,
                                                        );

                                                    return (
                                                        <tr
                                                            key={fileKey}
                                                            className={`transition ${isSelected
                                                                ? "bg-blue-50 dark:bg-blue-900/20"
                                                                : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                                                }`}
                                                        >
                                                            {/* Select */}
                                                            <td className="px-4 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={`Select ${fileName}`}
                                                                    checked={isSelected}
                                                                    onChange={() =>
                                                                        toggleFileSelection(
                                                                            fileKey,
                                                                        )
                                                                    }
                                                                    className="h-4 w-4 cursor-pointer rounded border-white accent-primary"
                                                                />
                                                            </td>

                                                            {/* FID */}
                                                            <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                                                                {file.file_id ??
                                                                    file.id ??
                                                                    "—"}
                                                            </td>

                                                            {/* File name */}
                                                            <td className="max-w-[280px] px-4 py-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void handleOpenFile(file)}
                                                                    className="group flex w-full min-w-0 items-center gap-3 rounded-lg text-left"
                                                                    title={`Preview ${fileName}`}
                                                                >

                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition group-hover:bg-primary/10 dark:bg-gray-700/50 dark:group-hover:bg-primary/20">
                                                                        {getFileIcon(fileName)}
                                                                    </div>


                                                                    <div className="min-w-0">
                                                                        <p className="break-words font-semibold text-gray-700 group-hover:underline dark:text-blue-400">
                                                                            {fileName}
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            {file.mime_type || getFileExtension(file).toUpperCase() || "Unknown file type"}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            </td>

                                                            {/* Uploaded by */}
                                                            <td className="px-4 py-4">
                                                                <span
                                                                    title={uploaderName}
                                                                    className="block max-w-[180px] truncate text-gray-700 dark:text-gray-300"
                                                                >
                                                                    {uploaderName}
                                                                </span>
                                                            </td>

                                                            {/* File size */}
                                                            <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-gray-300">
                                                                {formatFileSize(
                                                                    file.filesize,
                                                                )}
                                                            </td>

                                                            {/* Uploaded date */}
                                                            <td className="whitespace-nowrap px-4 py-4 text-gray-700 dark:text-gray-300">
                                                                {formatUploadedDate(
                                                                    file.createddate,
                                                                )}
                                                            </td>

                                                            {/* Delete */}
                                                            <td className="px-4 py-4 text-center">

                                                                <button
                                                                    type="button"
                                                                    title={
                                                                        deletingFileId === Number(file.file_id ?? file.id)
                                                                            ? "Deleting file..."
                                                                            : "Delete file"
                                                                    }
                                                                    aria-label={`Delete ${fileName}`}
                                                                    disabled={deletingFileId !== null}
                                                                    onClick={() => void handleDeleteFile(file)}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                                                >
                                                                    {deletingFileId === Number(file.file_id ?? file.id) ? (
                                                                        <Loader2 size={18} className="animate-spin" />
                                                                    ) : (
                                                                        <Trash2 size={18} />
                                                                    )}
                                                                </button>

                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Folder tree warning */}
                        {folderError && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                {folderError} Files are still displayed if
                                the files API returns them. To show
                                subfolders after a refresh, make sure
                                getProject() returns the nested folders.
                            </p>
                        )}
                    </>
                )}
            </div>
            {previewFile && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
                    onClick={() => setPreviewFile(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Preview ${getFileName(previewFile)}`}
                        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                    <FileText className="text-blue-600 dark:text-blue-400" />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                                        {getFileName(previewFile)}
                                    </h2>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {previewFile.mime_type ||
                                            getFileExtension(previewFile).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {getFilePreviewUrl(previewFile) && (
                                    <a
                                        href={getFilePreviewUrl(previewFile)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                        title="Open in new tab"
                                        aria-label="Open file in new tab"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setPreviewFile(null)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                    title="Close preview"
                                    aria-label="Close preview"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Preview content */}
                        <div className="min-h-[300px] flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 sm:min-h-[500px]">
                            {previewLoading ? (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                    Loading file preview...
                                </div>
                            ) : previewError ? (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
                                    <AlertCircle size={40} className="text-amber-500" />

                                    <p className="max-w-xl text-sm text-gray-600 dark:text-gray-300">
                                        {previewError}
                                    </p>

                                    {getFilePreviewUrl(previewFile) && (
                                        <a
                                            href={getFilePreviewUrl(previewFile)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            <Download size={16} />
                                            Open or download file
                                        </a>
                                    )}
                                </div>
                            ) : isImageFile(previewFile) ? (
                                <div className="flex min-h-[400px] items-center justify-center p-4">
                                    <img
                                        src={getFilePreviewUrl(previewFile)!}
                                        alt={getFileName(previewFile)}
                                        className="max-h-[75vh] max-w-full rounded-lg object-contain"
                                    />
                                </div>
                            ) : isTextFile(previewFile) ? (
                                <pre className="min-h-[400px] whitespace-pre-wrap break-words p-5 font-mono text-sm leading-6 text-gray-800 dark:text-gray-200 sm:p-8">
                                    {previewText}
                                </pre>
                            ) : getFileExtension(previewFile) === "pdf" ||
                                previewFile.mime_type === "application/pdf" ? (
                                <iframe
                                    title={`PDF preview: ${getFileName(previewFile)}`}
                                    src={getFilePreviewUrl(previewFile)!}
                                    className="h-[70vh] min-h-[500px] w-full border-0"
                                />
                            ) : ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
                                getFileExtension(previewFile),
                            ) ? (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
                                    <FileText size={48} className="text-blue-500" />

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Office document
                                    </h3>

                                    <p className="max-w-lg text-sm text-gray-500 dark:text-gray-400">
                                        This file requires an Office-compatible preview
                                        service or a document conversion library to render
                                        its contents inside the modal.
                                    </p>

                                    <a
                                        href={getFilePreviewUrl(previewFile)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        <ExternalLink size={16} />
                                        Open document
                                    </a>
                                </div>
                            ) : (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
                                    <FileText size={48} className="text-gray-400" />

                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Preview unavailable
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        This file format cannot be rendered directly in the browser.
                                    </p>

                                    {getFilePreviewUrl(previewFile) && (
                                        <a
                                            href={getFilePreviewUrl(previewFile)!}
                                            download={getFileName(previewFile)}
                                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            <Download size={16} />
                                            Download file
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
