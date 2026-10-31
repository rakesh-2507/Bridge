
import { useMemo, useState } from "react";
import {
    ChevronDown,
    ChevronRight,
    File,
    FileImage,
    FileText,
    Folder,
    FolderOpen,
    X,
} from "lucide-react";

export interface UploadProgressItem {
    id: string;
    name: string;
    relativePath: string;
    size: number;
    loaded: number;
    percentage: number;
    status: "waiting" | "uploading" | "completed" | "failed";
    error?: string;
}

interface FolderNode {
    name: string;
    path: string;
    files: UploadProgressItem[];
    children: Map<string, FolderNode>;
}

interface Props {
    rootName: string;
    items: UploadProgressItem[];
    uploading: boolean;
    onClear?: () => void;
}

function formatSize(bytes: number) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatus(items: UploadProgressItem[]) {
    if (items.some((item) => item.status === "failed")) return "failed";
    if (items.some((item) => item.status === "uploading")) return "uploading";
    if (items.every((item) => item.status === "completed")) return "completed";
    return "waiting";
}

function getFolderPercentage(items: UploadProgressItem[]) {
    const total = items.reduce((sum, item) => sum + item.size, 0);
    const loaded = items.reduce((sum, item) => sum + item.loaded, 0);

    return total ? Math.round((loaded / total) * 100) : 0;
}

function getFileIcon(name: string) {
    const extension = name.split(".").pop()?.toLowerCase();

    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension ?? "")) {
        return <FileImage size={16} />;
    }

    if (["pdf", "doc", "docx", "txt", "csv", "xls", "xlsx"].includes(extension ?? "")) {
        return <FileText size={16} />;
    }

    return <File size={16} />;
}

function buildTree(items: UploadProgressItem[]) {
    const root: FolderNode = {
        name: "",
        path: "",
        files: [],
        children: new Map(),
    };

    for (const item of items) {
        const parts = item.relativePath
            .replace(/\\/g, "/")
            .split("/")
            .filter(Boolean);

        // The first part is the selected main folder name.
        const folderParts = parts.length > 1 ? parts.slice(1, -1) : [];
        let current = root;
        let currentPath = "";

        for (const part of folderParts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!current.children.has(part)) {
                current.children.set(part, {
                    name: part,
                    path: currentPath,
                    files: [],
                    children: new Map(),
                });
            }

            current = current.children.get(part)!;
        }

        current.files.push(item);
    }

    return root;
}

function collectFiles(node: FolderNode): UploadProgressItem[] {
    return [
        ...node.files,
        ...Array.from(node.children.values()).flatMap(collectFiles),
    ];
}

export default function UploadProgressPanel({
    rootName,
    items,
    uploading,
    onClear,
}: Props) {
    const [expanded, setExpanded] = useState<Set<string>>(
        new Set([""]),
    );

    const tree = useMemo(() => buildTree(items), [items]);

    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    const loadedSize = items.reduce((sum, item) => sum + item.loaded, 0);
    const percentage = totalSize
        ? Math.round((loadedSize / totalSize) * 100)
        : 0;

    const completed = items.filter((item) => item.status === "completed").length;
    const failed = items.filter((item) => item.status === "failed").length;

    const toggleFolder = (path: string) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const renderFolder = (node: FolderNode, depth = 0): React.ReactNode => {
        const folderFiles = collectFiles(node);
        const status = getStatus(folderFiles);
        const folderPercentage = getFolderPercentage(folderFiles);
        const isExpanded = expanded.has(node.path);

        return (
            <div key={node.path || "root"} className="min-w-0">
                {node.path && (
                    <button
                        type="button"
                        onClick={() => toggleFolder(node.path)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    >
                        {isExpanded
                            ? <ChevronDown size={15} />
                            : <ChevronRight size={15} />}

                        {isExpanded
                            ? <FolderOpen size={17} className="shrink-0 text-primary" />
                            : <Folder size={17} className="shrink-0 text-primary" />}

                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {node.name}
                        </span>

                        <span className="text-xs text-gray-500">
                            {folderFiles.filter((file) => file.status === "completed").length}/{folderFiles.length}
                        </span>

                        <span className="w-10 text-right text-xs font-semibold">
                            {folderPercentage}%
                        </span>
                    </button>
                )}

                {(!node.path || isExpanded) && (
                    <div className="space-y-1">
                        {node.path && (
                            <div
                                className="mx-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                                style={{ marginLeft: `${depth * 16 + 32}px` }}
                            >
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        status === "failed" ? "bg-red-500" :
                                        status === "completed" ? "bg-emerald-500" :
                                        "bg-primary"
                                    }`}
                                    style={{ width: `${folderPercentage}%` }}
                                />
                            </div>
                        )}

                        {node.files.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-lg px-2 py-2"
                                style={{ paddingLeft: `${depth * 16 + 30}px` }}
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="shrink-0 text-gray-500">
                                        {getFileIcon(item.name)}
                                    </span>

                                    <span
                                        className="min-w-0 flex-1 truncate text-xs"
                                        title={item.relativePath}
                                    >
                                        {item.name}
                                    </span>

                                    <span className="shrink-0 text-xs text-gray-500">
                                        {item.status === "completed"
                                            ? "100%"
                                            : `${item.percentage}%`}
                                    </span>
                                </div>

                                <div className="ml-6 mt-1.5 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            item.status === "failed" ? "bg-red-500" :
                                            item.status === "completed" ? "bg-emerald-500" :
                                            "bg-primary"
                                        }`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>

                                {item.error && (
                                    <p className="ml-6 mt-1 break-words text-xs text-red-500">
                                        {item.error}
                                    </p>
                                )}
                            </div>
                        ))}

                        {Array.from(node.children.values()).map((child) =>
                            renderFolder(child, depth + (node.path ? 1 : 0)),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <section className="overflow-hidden rounded-xl border border-primary/20 bg-white shadow-sm dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <FolderOpen size={19} className="shrink-0 text-primary" />
                        <h3 className="truncate text-sm font-semibold">
                            {uploading ? "Uploading" : failed ? "Upload finished with errors" : "Upload summary"}
                            : {rootName}
                        </h3>
                    </div>

                    {!uploading && onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Close upload panel"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                        {completed} of {items.length} files completed
                        {failed > 0 ? ` · ${failed} failed` : ""}
                    </span>
                    <strong className="text-primary">{percentage}%</strong>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <p className="mt-2 text-right text-xs text-gray-500">
                    {formatSize(loadedSize)} / {formatSize(totalSize)}
                </p>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-2">
                {renderFolder(tree)}
            </div>
        </section>
    );
}
