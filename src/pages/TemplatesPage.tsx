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

export default function TemplatesPage() {
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<TemplateListItem[]>([]);
    const [selectedTemplate, setSelectedTemplate] =
        useState<TemplateCompleteResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState("");
    const [detailsError, setDetailsError] = useState("");

    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
        new Set(),
    );

    const [deleting, setDeleting] = useState(false);

    // Prevent stale API requests from overwriting newer selections.
    const detailsRequestId = useRef(0);

    // Load all templates.
    const loadTemplates = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getTemplates();
            setTemplates(response ?? []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load templates.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchTemplates = async () => {
            try {
                const response = await getTemplates();

                if (!cancelled) {
                    setTemplates(response ?? []);
                    setError("");
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

        // Invalidate any pending template-details request.
        detailsRequestId.current += 1;

        setDeleting(true);
        setError("");
        setDetailsError("");

        try {
            await deleteTemplate(templateId);

            // Remove the deleted template from the list.
            setTemplates((previous) =>
                previous.filter((template) => template.tid !== templateId),
            );

            // Clear the selected template and its folder state.
            setSelectedTemplate(null);
            setExpandedFolders(new Set());
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

    // Navigate to the existing CreateTemplate page in edit mode.
    const handleEditTemplate = () => {
        if (!selectedTemplate) return;

        navigate("/templates/create", {
            state: {
                editTemplateId: selectedTemplate.tid,
            },
        });
    };

    // Expand or collapse a folder with a valid numeric ID.
    const toggleFolder = (fid: number) => {
        setExpandedFolders((previous) => {
            const next = new Set(previous);

            if (next.has(fid)) {
                next.delete(fid);
            } else {
                next.add(fid);
            }

            return next;
        });
    };

    // Generate a stable key for rendering, including folders with missing IDs.
    const getFolderKey = (
        folder: CreatedTemplateFolder,
        folders: CreatedTemplateFolder[],
    ): FolderKey => {
        if (typeof folder.fid === "number") {
            return `fid-${folder.fid}`;
        }

        return `index-${folders.indexOf(folder)}`;
    };

    // Determine whether a folder belongs to another folder.
    const isChildOf = (
        folder: CreatedTemplateFolder,
        parent: CreatedTemplateFolder,
    ): boolean => {
        if (folder === parent) {
            return false;
        }

        const matchesParentId =
            typeof folder.pid === "number" &&
            typeof parent.fid === "number" &&
            folder.pid === parent.fid;

        const matchesChildName =
            typeof folder.fname === "string" &&
            (parent.children ?? []).includes(folder.fname);

        return matchesParentId || matchesChildName;
    };

    // Get the child folders of a parent.
    const getChildFolders = (
        parent: CreatedTemplateFolder,
        folders: CreatedTemplateFolder[],
    ): CreatedTemplateFolder[] => {
        return folders.filter((folder) => isChildOf(folder, parent));
    };

    // Find folders without a parent.
    const getRootFolders = (
        folders: CreatedTemplateFolder[],
    ): CreatedTemplateFolder[] => {
        return folders.filter(
            (folder) =>
                !folders.some((parent) => isChildOf(folder, parent)),
        );
    };

    // Render the folder hierarchy recursively.
    const renderFolder = (
        folder: CreatedTemplateFolder,
        folders: CreatedTemplateFolder[],
        depth = 0,
        ancestors: Set<FolderKey> = new Set(),
    ): ReactNode => {
        const folderKey = getFolderKey(folder, folders);

        // Avoid infinite recursion if the API contains a cycle.
        if (ancestors.has(folderKey)) {
            return null;
        }

        const children = getChildFolders(folder, folders);
        const hasChildren = children.length > 0;

        // The API's fid is optional, so only numeric IDs are expandable.
        const folderId =
            typeof folder.fid === "number" ? folder.fid : null;

        const isExpanded =
            folderId !== null && expandedFolders.has(folderId);

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(folderKey);

        return (
            <div key={folderKey}>
                <button
                    type="button"
                    onClick={() => {
                        if (folderId !== null && hasChildren) {
                            toggleFolder(folderId);
                        }
                    }}
                    disabled={folderId === null || !hasChildren}
                    style={{
                        paddingLeft: `${16 + depth * 24}px`,
                    }}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left transition hover:bg-slate-100 disabled:cursor-default dark:hover:bg-slate-800 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                        )
                    ) : (
                        <span className="w-4 shrink-0" />
                    )}

                    {isExpanded ? (
                        <FolderOpen className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                        <Folder className="h-5 w-5 shrink-0 text-amber-500" />
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {children.length}
                        </span>
                    )}
                </button>

                {isExpanded && hasChildren && (
                    <div>
                        {children.map((child) =>
                            renderFolder(
                                child,
                                folders,
                                depth + 1,
                                nextAncestors,
                            ),
                        )}
                    </div>
                )}
            </div>
        );
    };

    const folders = selectedTemplate?.folders ?? [];
    const roles = selectedTemplate?.roles ?? [];

    return (
        <div className="min-h-[calc(100vh-90px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
            <div className="mx-auto">
                {/* Page header */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Layers className="h-4 w-4" />
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
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
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

                {/* Template list error */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Main content */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                    {/* Template list */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    All Templates
                                </h2>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Select a template to see its details
                                </p>
                            </div>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {templates.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500 dark:text-slate-400">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Loading templates...
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />

                                <p className="font-medium text-slate-700 dark:text-slate-200">
                                    No templates found
                                </p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Create a template to see it here.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate("/templates/create")}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
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
                                            className={`mb-1 flex w-full items-start gap-3 rounded-lg p-4 text-left transition ${isSelected
                                                ? "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:ring-blue-900"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                                }`}
                                        >
                                            <div
                                                className={`rounded-lg p-2 ${isSelected
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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

                                                <p className="mt-2 text-xs text-slate-400">
                                                    Template ID: {template.tid}
                                                </p>
                                            </div>

                                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
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
                                    <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />

                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Loading template details...
                                    </p>
                                </div>
                            </div>
                        ) : detailsError ? (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900"
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
                            </div>
                        ) : !selectedTemplate ? (
                            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-4 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950">
                                    <FolderOpen className="h-9 w-9 text-blue-600 dark:text-blue-400" />
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
                                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        <div className="flex min-w-0 flex-1 items-start gap-4">
                                            <div className="shrink-0 rounded-xl bg-blue-50 p-3 dark:bg-blue-950">
                                                <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
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

                                                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        Project Type:{" "}
                                                        {selectedTemplate.projecttype}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleEditTemplate}
                                                disabled={deleting}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit Template
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleDeleteTemplate()}
                                                disabled={deleting}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950 dark:focus:ring-offset-slate-900"
                                            >
                                                {deleting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                {deleting ? "Deleting..." : "Delete Template"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Folder structure */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                                                <Folder className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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

                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            {folders.length} folders
                                        </span>
                                    </div>

                                    {folders.length > 0 ? (
                                        <div className="p-2">
                                            {getRootFolders(folders).map((folder) =>
                                                renderFolder(folder, folders),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Folder className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                No folders configured for this template.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Template roles */}
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                                                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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

                                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                            {roles.length} roles
                                        </span>
                                    </div>

                                    {roles.length > 0 ? (
                                        <div className="flex flex-wrap gap-3 p-5">
                                            {roles.map((role, index) => (
                                                <div
                                                    key={role.roleid ?? `${role.rolename}-${index}`}
                                                    className="flex items-center gap-2 rounded-lg border border-purple-100 bg-purple-50/70 px-4 py-3 dark:border-purple-900 dark:bg-purple-950/40"
                                                >
                                                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />

                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                        {role.rolename}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />

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