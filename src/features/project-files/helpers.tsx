import { FileImage, FileType, FileSpreadsheet, FileText, FileCode, FileArchive, File } from "lucide-react";

import type { FolderFile, ProjectFolder, FolderProgress, Project } from "../../api/projects";
import type { User } from "../../api/users";

export const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "svg":
        case "webp":
        case "bmp":
        case "avif":
            return <FileImage size={20} className="text-purple-500" />;

        case "doc":
        case "docx":
            return <FileType size={20} className="text-primary" />;

        case "xls":
        case "xlsx":
        case "csv":
            return <FileSpreadsheet size={20} className="text-green-600" />;

        case "pdf":
            return <FileText size={20} className="text-red-500" />;

        case "txt":
        case "md":
        case "rtf":
            return <FileText size={20} className="text-gray-500" />;

        case "js":
        case "jsx":
        case "ts":
        case "tsx":
        case "html":
        case "css":
        case "json":
        case "xml":
            return <FileCode size={20} className="text-orange-500" />;

        case "zip":
        case "rar":
        case "7z":
            return <FileArchive size={20} className="text-yellow-600" />;

        default:
            return <File size={20} className="text-primary" />;
    }
};

export function getFolderFileCount(folder: ProjectFolder): number {
    const data = folder as ProjectFolder & {
        file_count?: number;
        files_count?: number;
        files?: unknown[];
    };

    const count =
        data.fileCount ??
        data.file_count ??
        data.files_count ??
        data.files?.length ??
        0;

    return Math.max(0, Number(count) || 0);
}

export function normalizeFiles(response: unknown): FolderFile[] {
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

export function findProjectFolder(
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

export function normalizeFolderTree(
    folders: ProjectFolder[],
): ProjectFolder[] {
    if (!folders.length) return [];

    const isFlatResponse = folders.some((folder) =>
        Object.prototype.hasOwnProperty.call(folder, "parent_fid"),
    );

    // Admin response: already nested
    if (!isFlatResponse) {
        return folders.map((folder) => ({
            ...folder,
            fileCount: getFolderFileCount(folder),
            children: normalizeFolderTree(folder.children ?? []),
        }));
    }

    // Member response: flat list
    const folderMap = new Map<number, ProjectFolder>();

    folders.forEach((folder) => {
        folderMap.set(Number(folder.fid), {
            ...folder,
            fileCount: getFolderFileCount(folder),
            parent_fid:
                folder.parent_fid == null
                    ? null
                    : Number(folder.parent_fid),
            children: [],
        });
    });

    const roots: ProjectFolder[] = [];

    folders.forEach((folder) => {
        const node = folderMap.get(Number(folder.fid));
        if (!node) return;

        const parentId = node.parent_fid;

        const parent =
            parentId == null
                ? undefined
                : folderMap.get(parentId);

        if (parent && parent !== node) {
            parent.children = [...(parent.children ?? []), node];
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export function getProjectFolders(
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

    return Array.isArray(folders)
        ? normalizeFolderTree(folders)
        : [];
}

export function formatFileSize(
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

export function formatUploadedDate(date?: string | null): string {
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

export function normalizeFolderProgress(response: unknown): FolderProgress {
    if (!response || typeof response !== "object") {
        return {};
    }

    const result = response as Record<string, unknown>;

    const nested =
        result.data && typeof result.data === "object"
            ? (result.data as Record<string, unknown>)
            : result;

    const rawPercentage = nested.progress_percentage;
    const parsedPercentage =
        rawPercentage == null ? null : Number(rawPercentage);

    return {
        progress_percentage:
            parsedPercentage !== null && Number.isFinite(parsedPercentage)
                ? parsedPercentage
                : null,
        progress_notes:
            typeof nested.progress_notes === "string"
                ? nested.progress_notes
                : "",
        status: nested.status as number | string | null | undefined,
    };
}

export function isFolderCompleted(status: unknown): boolean {
    const value = String(status ?? "").trim().toLowerCase();
    return value === "2" || value === "completed";
}

export function getFolderProgressPercentage(
    folder: ProjectFolder | null | undefined,
    apiProgress?: FolderProgress | null,
): number {
    if (!folder) {
        return 0;
    }

    const percentage =
        apiProgress?.progress_percentage ?? folder.progress_percentage;

    const parsedPercentage = Number(percentage ?? 0);

    const savedPercentage = Number.isFinite(parsedPercentage)
        ? Math.min(100, Math.max(0, parsedPercentage))
        : 0;

    const status = String(apiProgress?.status ?? folder.status ?? "")
        .trim()
        .toLowerCase();

    if (status === "2" || status === "completed") {
        return 100;
    }

    if (
        status === "1" ||
        status === "in progress" ||
        status === "in_progress"
    ) {
        return Math.max(1, savedPercentage);
    }

    return savedPercentage;
}

export function getFolderProgressLabel(percentage: number): string {
    if (percentage >= 100) {
        return "Completed";
    }

    if (percentage > 0) {
        return `${percentage}% Complete`;
    }

    return "Not Started";
}

export function getFolderProgressClass(percentage: number): string {
    if (percentage >= 100) {
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    }

    if (percentage > 0) {
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    }

    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

export function getFileName(file: FolderFile): string {
    return file.filename ?? file.file_name ?? file.name ?? "Unnamed file";
}

export function getFileKey(file: FolderFile, index: number): string {
    return String(file.file_id ?? file.id ?? `file-${index}`);
}

export function getUploaderName(file: FolderFile, users: User[]): string {
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

    return fullName || uploader.loginname || `User ID: ${file.createduid}`;
}
