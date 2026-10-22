import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
    Folder,
    FolderOpen,
    FileText,
    Users,
    ChevronRight,
    ChevronDown,
    Loader2,
    RefreshCw,
    AlertCircle,
    Layers,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getTemplates,
    getTemplateDetails,
    deleteTemplate,
    type TemplateListItem,
    type TemplateCompleteResponse,
    type CreatedTemplateFolder,
} from "../api/templateCreate";

type FolderKey = string;

type FolderNode = CreatedTemplateFolder & {
    children?: (FolderNode | string)[];
};

export default function TemplatesPage() {
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<TemplateListItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] =
        useState<TemplateCompleteResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState("");
    const [detailsError, setDetailsError] = useState("");
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(),
    );
    const [deleting, setDeleting] = useState(false);

    const detailsRequestId = useRef(0);
    const templatesRequestId = useRef(0);

    // Load templates and prevent stale requests from updating state.
    const loadTemplates = useCallback(async () => {
        const requestId = ++templatesRequestId.current;

        try {
            setLoading(true);
            setError("");

            const response = await getTemplates();

            if (requestId === templatesRequestId.current) {
                setTemplates(response ?? []);
            }
        } catch (err) {
            if (requestId === templatesRequestId.current) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load templates.",
                );
            }
        } finally {
            if (requestId === templatesRequestId.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchTemplates = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getTemplates();

                if (!cancelled) {
                    setTemplates(response ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load templates.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void fetchTemplates();

        return () => {
            cancelled = true;
        };
    }, []);

    // Delete the selected template after confirmation.
    const handleDeleteTemplate = async () => {
        if (!selectedTemplate || deleting) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete the template "${selectedTemplate.name}"?\n\nThis action cannot be undone.`,
        );

        if (!confirmed) return;

        const templateId = selectedTemplate.tid;

        detailsRequestId.current += 1;

        setDeleting(true);
        setError("");
        setDetailsError("");

        try {
            await deleteTemplate(templateId);

            setTemplates((previous) =>
                previous.filter((template) => template.tid !== templateId),
            );

            setSelectedTemplate(null);
            setExpandedFolders(new Set());
            setDetailsLoading(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete the template.",
            );
        } finally {
            setDeleting(false);
        }
    };

    // Load the selected template's folders and roles.
    const handleTemplateClick = async (template: TemplateListItem) => {
        const requestId = ++detailsRequestId.current;

        setDetailsLoading(true);
        setDetailsError("");
        setSelectedTemplate(null);
        setExpandedFolders(new Set());

        try {
            const details = await getTemplateDetails(template.tid);

            if (requestId === detailsRequestId.current) {
                setSelectedTemplate(details);
            }
        } catch (err) {
            if (requestId === detailsRequestId.current) {
                setDetailsError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load template details.",
                );
            }
        } finally {
            if (requestId === detailsRequestId.current) {
                setDetailsLoading(false);
            }
        }
    };

    // Navigate to CreateTemplate in edit mode.
    const handleEditTemplate = () => {
        if (!selectedTemplate) return;

        navigate("/templates/create", {
            state: {
                editTemplateId: selectedTemplate.tid,
            },
        });
    };

    const getFolderKey = (
        folder: FolderNode,
        path: string,
    ): FolderKey => {
        if (typeof folder.fid === "number") {
            return `fid-${folder.fid}`;
        }

        return path;
    };

    const toggleFolder = (folderKey: FolderKey) => {
        setExpandedFolders((previous) => {
            const next = new Set(previous);

            if (next.has(folderKey)) {
                next.delete(folderKey);
            } else {
                next.add(folderKey);
            }

            return next;
        });
    };

    // Render nested folders recursively.
    const renderFolder = (
        folder: FolderNode,
        path: string,
        depth = 0,
        ancestors: Set<FolderKey> = new Set(),
    ): ReactNode => {
        const folderKey = getFolderKey(folder, path);

        // Prevent infinite recursion if the API contains a cycle.
        if (ancestors.has(folderKey)) {
            return null;
        }

        const rawChildren = Array.isArray(folder.children)
            ? folder.children
            : [];

        const children: FolderNode[] = rawChildren.flatMap(
            (child): FolderNode[] => {
                if (typeof child === "string") {
                    return [
                        {
                            fname: child,
                            fnamedesc: "",
                            children: [],
                        },
                    ];
                }

                if (
                    child &&
                    typeof child === "object" &&
                    typeof child.fname === "string"
                ) {
                    return [child as FolderNode];
                }

                return [];
            },
        );

        const hasChildren = children.length > 0;
        const isExpanded = expandedFolders.has(folderKey);

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(folderKey);

        return (
            <div key={folderKey}>
                <button
                    type="button"
                    onClick={() => {
                        if (hasChildren) {
                            toggleFolder(folderKey);
                        }
                    }}
                    disabled={!hasChildren}
                    style={{
                        paddingLeft: `${16 + depth * 24}px`,
                    }}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 disabled:cursor-default disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-primary dark:text-gray-400" />
                        ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                        )
                    ) : (
                        <span className="w-4 shrink-0" />
                    )}

                    {isExpanded ? (
                        <FolderOpen className="h-5 w-5 shrink-0 text-primary dark:text-gray-400" />
                    ) : (
                        <Folder className="h-5 w-5 shrink-0 text-primary dark:text-gray-400" />
                    )}

                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {folder.fname}
                        </span>

                        {folder.fnamedesc && (
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                                {folder.fnamedesc}
                            </span>
                        )}
                    </span>

                    {hasChildren && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:text-gray-400">
                            {children.length}
                        </span>
                    )}
                </button>

                {isExpanded && hasChildren && (
                    <div className="border-l border-primary/20 dark:border-primary/30">
                        {children.map((child, index) =>
                            renderFolder(
                                child,
                                `${path}/${child.fid ?? child.fname}-${index}`,
                                depth + 1,
                                nextAncestors,
                            ),
                        )}
                    </div>
                )}
            </div>
        );
    };

    const folders = (selectedTemplate?.folders ?? []) as FolderNode[];
    const roles = selectedTemplate?.roles ?? [];

    // Support nested folder responses and flat responses with parent IDs.
    const getRootFolders = (items: FolderNode[]): FolderNode[] => {
        const hasNestedObjects = items.some(
            (folder) =>
                Array.isArray(folder.children) &&
                folder.children.some(
                    (child) =>
                        child !== null && typeof child === "object",
                ),
        );

        if (hasNestedObjects) {
            return items.filter(
                (folder) =>
                    folder.pid === null || folder.pid === undefined,
            );
        }

        const folderIds = new Set(
            items
                .map((folder) => folder.fid)
                .filter((id): id is number => typeof id === "number"),
        );

        return items.filter(
            (folder) =>
                folder.pid === null ||
                folder.pid === undefined ||
                !folderIds.has(folder.pid),
        );
    };

    return (
        <div className="min-h-[calc(100vh-90px)] bg-slate-50 p-4 transition-colors duration-200 dark:bg-slate-950 sm:p-6">
            <div className="mx-auto">
                {/* Page header */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Layers className="h-4 w-4 text-primary dark:text-gray-400" />
                            <span>Masters</span>
                            <ChevronRight className="h-4 w-4" />
                            <span>Templates</span>
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Templates
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Browse templates and view their folders and assigned roles.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/templates/create")}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                        >
                            <Plus className="h-4 w-4" />
                            Create Template
                        </button>

                        <button
                            type="button"
                            onClick={() => void loadTemplates()}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* General error */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Main content */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                    {/* Template list */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    All Templates
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Select a template to see its details
                                </p>
                            </div>

                            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary dark:text-gray-400">
                                {templates.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500 dark:text-slate-400">
                                <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-gray-400" />
                                Loading templates...
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                                <p className="font-medium text-slate-700 dark:text-slate-200">
                                    No templates found
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Create a template to see it here.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/templates/create")}
                                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Template
                                </button>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto p-2 scrollbar-hide">
                                {templates.map((template) => {
                                    const isSelected =
                                        selectedTemplate?.tid === template.tid;

                                    return (
                                        <button
                                            type="button"
                                            key={template.tid}
                                            onClick={() =>
                                                void handleTemplateClick(template)
                                            }
                                            aria-pressed={isSelected}
                                            className={`mb-1 flex w-full items-start gap-3 rounded-lg p-4 text-left transition-colors ${
                                                isSelected
                                                    ? "bg-primary/10 ring-1 ring-primary/30 dark:bg-primary/15 dark:ring-primary/40"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                            }`}
                                        >
                                            <div
                                                className={`rounded-lg p-2 ${
                                                    isSelected
                                                        ? "bg-primary/10 text-primary dark:bg-slate-800 dark:text-slate-300"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 "
                                                }`}
                                            >
                                                <FileText className="h-5 w-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                                    {template.name}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                    {template.name_desc ||
                                                        "No description available"}
                                                </p>
                                                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                                    Template ID: {template.tid}
                                                </p>
                                            </div>

                                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Template details */}
                    <section className="min-w-0">
                        {detailsLoading ? (
                            <div className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                                <div className="text-center">
                                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary dark:text-gray-300" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Loading template details...
                                    </p>
                                </div>
                            </div>
                        ) : detailsError ? (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900/70 dark:bg-slate-900"
                            >
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-5 w-5" />
                                    <p className="font-medium">
                                        Unable to load template
                                    </p>
                                </div>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    {detailsError}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const template = templates.find(
                                            (item) =>
                                                item.tid ===
                                                selectedTemplate?.tid,
                                        );
                                        if (template) {
                                            void handleTemplateClick(template);
                                        }
                                    }}
                                    className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : !selectedTemplate ? (
                            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-4 rounded-2xl bg-primary/10 p-4">
                                    <FolderOpen className="h-9 w-9 text-primary dark:text-gray-300" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                                    Select a Template
                                </h2>
                                <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                    Click any template from the list to explore its folder structure and configured roles.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Template overview */}
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className="shrink-0 rounded-xl bg-primary/10 p-3">
                                                <FileText className="h-7 w-7 text-primary dark:text-gray-300" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h2 className="break-words text-xl font-bold text-slate-900 dark:text-white">
                                                    {selectedTemplate.name}
                                                </h2>
                                                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                                    {selectedTemplate.name_desc ||
                                                        "No description available."}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        ID: {selectedTemplate.tid}
                                                    </span>
                                                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:text-gray-300">
                                                        Project Type: {selectedTemplate.projecttype}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleEditTemplate}
                                                disabled={deleting}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit Template
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleDeleteTemplate()
                                                }
                                                disabled={deleting}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus:ring-offset-slate-900"
                                            >
                                                {deleting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                {deleting
                                                    ? "Deleting..."
                                                    : "Delete Template"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Folder structure */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Folder className="h-5 w-5 text-primary dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    Folder Structure
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Expand folders to view child folders
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:text-gray-300">
                                            {getRootFolders(folders).length} root folders
                                        </span>
                                    </div>

                                    {folders.length > 0 ? (
                                        <div className="p-2">
                                            {getRootFolders(folders).map(
                                                (folder, index) =>
                                                    renderFolder(
                                                        folder,
                                                        `root-${folder.fid ?? folder.fname}-${index}`,
                                                    ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Folder className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                No folders configured for this template.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Template roles */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2">
                                                <Users className="h-5 w-5 text-primary dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                                    Template Roles
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    Roles configured for this template
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:text-gray-300">
                                            {roles.length} roles
                                        </span>
                                    </div>

                                    {roles.length > 0 ? (
                                        <div className="flex flex-wrap gap-3 p-5">
                                            {roles.map((role, index) => (
                                                <div
                                                    key={
                                                        role.roleid ??
                                                        `${role.rolename}-${index}`
                                                    }
                                                    className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 dark:border-primary/30 dark:bg-primary/10"
                                                >
                                                    <Users className="h-4 w-4 text-primary dark:text-gray-300" />
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                        {role.rolename}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                No roles configured for this template.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
