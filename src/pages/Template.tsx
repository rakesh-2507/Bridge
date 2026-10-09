import { useEffect, useState } from "react";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Eye,
    RefreshCw,
    X,
    FileText,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

import {
    createTemplate,
    getTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    type Template,
    type TemplatePayload,
} from "../api/templates";

import {
    getProjectTypes,
    type ProjectType,
} from "../api/projectTypes";

import { useNavigate } from "react-router-dom";

interface TemplateFormState {
    name: string;
    name_desc: string;
    projecttype: string;
}

const initialForm: TemplateFormState = {
    name: "",
    name_desc: "",
    projecttype: "",
};

export default function TemplatePage() {
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewingTemplate, setViewingTemplate] =
        useState<Template | null>(null);

    const [form, setForm] = useState<TemplateFormState>(initialForm);

    const [lookupId, setLookupId] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    async function loadTemplates() {
        setLoading(true);
        setError("");

        try {
            const response = await getTemplates();

            setTemplates(
                Array.isArray(response.templates) ? response.templates : [],
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load templates.",
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function initializePage() {
            try {
                const [templatesResponse, projectTypesResponse] =
                    await Promise.all([
                        getTemplates(),
                        getProjectTypes(),
                    ]);

                if (cancelled) return;

                setTemplates(
                    Array.isArray(templatesResponse.templates)
                        ? templatesResponse.templates
                        : [],
                );

                setProjectTypes(
                    Array.isArray(projectTypesResponse.projecttypes)
                        ? projectTypesResponse.projecttypes
                        : [],
                );
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load template data.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void initializePage();

        return () => {
            cancelled = true;
        };
    }, []);

    // function openCreateModal() {
    //     setEditingId(null);
    //     setForm(initialForm);
    //     setError("");
    //     setSuccess("");
    //     setModalOpen(true);
    // }

    async function openEditModal(id: number) {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // GET /gettemplate/{tid}
            const template = await getTemplate(id);

            setEditingId(template.tid);
            setForm({
                name: template.name,
                name_desc: template.name_desc,
                projecttype: String(template.projecttype),
            });

            setModalOpen(true);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch template details.",
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Template name is required.");
            return;
        }

        if (!form.name_desc.trim()) {
            setError("Template description is required.");
            return;
        }

        if (!form.projecttype) {
            setError("Please select a project type.");
            return;
        }

        const payload: TemplatePayload = {
            name: form.name.trim(),
            name_desc: form.name_desc.trim(),
            projecttype: Number(form.projecttype),
        };

        setSaving(true);

        try {
            if (editingId !== null) {
                // PUT /updatetemplate/{tid}
                await updateTemplate(editingId, payload);
                setSuccess("Template updated successfully.");
            } else {
                // POST /createtemplate
                await createTemplate(payload);
                setSuccess("Template created successfully.");
            }

            setModalOpen(false);
            setForm(initialForm);
            setEditingId(null);
            await loadTemplates();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save template.",
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleLookup() {
        const id = Number(lookupId);

        if (!lookupId.trim() || !Number.isInteger(id) || id <= 0) {
            setError("Enter a valid template ID.");
            return;
        }

        setLookupLoading(true);
        setError("");
        setSuccess("");

        try {
            // GET /gettemplate/{tid}
            const template = await getTemplate(id);
            setViewingTemplate(template);
        } catch (err) {
            setViewingTemplate(null);
            setError(
                err instanceof Error
                    ? err.message
                    : "Template not found.",
            );
        } finally {
            setLookupLoading(false);
        }
    }

    async function handleDelete() {
        if (deleteId === null) return;

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            // DELETE /deletetemplate/{tid}
            await deleteTemplate(deleteId);

            setTemplates((current) =>
                current.filter((template) => template.tid !== deleteId),
            );

            if (viewingTemplate?.tid === deleteId) {
                setViewingTemplate(null);
            }

            setDeleteId(null);
            setSuccess("Template deleted successfully.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete template.",
            );
        } finally {
            setDeleting(false);
        }
    }

    const filteredTemplates = templates.filter((template) => {
        const query = search.toLowerCase();

        return (
            template.name.toLowerCase().includes(query) ||
            template.name_desc.toLowerCase().includes(query) ||
            String(template.tid).includes(query) ||
            String(template.projecttype).includes(query)
        );
    });

    function getProjectTypeName(projecttype: number) {
        return (
            projectTypes.find((item) => item.ptypeid === projecttype)
                ?.projecttype ?? `Project Type ${projecttype}`
        );
    }

    return (
        <div className="min-h-full space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <FileText size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Templates
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Create, view, update, and manage templates.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => void loadTemplates()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() => navigate("/templates/create")}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        Create Template
                    </button>

                </div>
            </div>

            {/* Feedback */}
            {error && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError("")} aria-label="Dismiss error">
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 size={18} />
                    <span className="flex-1">{success}</span>
                    <button onClick={() => setSuccess("")} aria-label="Dismiss success">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Get template by ID */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
                    Find Template by ID
                </h2>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleLookup();
                    }}
                    className="flex flex-col gap-3 sm:flex-row"
                >
                    <input
                        type="number"
                        min="1"
                        value={lookupId}
                        onChange={(event) => setLookupId(event.target.value)}
                        placeholder="Enter template ID"
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <button
                        type="submit"
                        disabled={lookupLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700"
                    >
                        {lookupLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                        Find Template
                    </button>
                </form>

                {viewingTemplate && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                    Template #{viewingTemplate.tid}
                                </p>
                                <h3 className="mt-1 font-semibold text-slate-900 dark:text-white">
                                    {viewingTemplate.name}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                    {viewingTemplate.name_desc}
                                </p>
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                    Project Type:{" "}
                                    {getProjectTypeName(viewingTemplate.projecttype)}
                                </p>
                            </div>

                            <button
                                onClick={() => setViewingTemplate(null)}
                                className="self-start rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                                aria-label="Close template details"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Templates table */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            All Templates
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {filteredTemplates.length} template
                            {filteredTemplates.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search templates..."
                            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 size={20} className="animate-spin" />
                        Loading templates...
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                        <FileText
                            size={32}
                            className="mb-3 text-slate-300 dark:text-slate-600"
                        />
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                            {search ? "No matching templates" : "No templates found"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {search
                                ? "Try a different search term."
                                : "Create your first template to get started."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">ID</th>
                                    <th className="px-5 py-4">Template Name</th>
                                    <th className="px-5 py-4">Description</th>
                                    <th className="px-5 py-4">Project Type</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredTemplates.map((template) => (
                                    <tr
                                        key={template.tid}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">
                                            #{template.tid}
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                                            {template.name}
                                        </td>

                                        <td className="max-w-xs px-5 py-4 text-slate-600 dark:text-slate-300">
                                            <p className="line-clamp-2">
                                                {template.name_desc}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                                {getProjectTypeName(template.projecttype)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    title="View template"
                                                    aria-label={`View template ${template.tid}`}
                                                    onClick={() => {
                                                        setLookupId(String(template.tid));
                                                        setViewingTemplate(template);
                                                    }}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                <button
                                                    title="Edit template"
                                                    aria-label={`Edit template ${template.tid}`}
                                                    onClick={() => void openEditModal(template.tid)}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    title="Delete template"
                                                    aria-label={`Delete template ${template.tid}`}
                                                    onClick={() => setDeleteId(template.tid)}
                                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Create / Edit modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="template-modal-title"
                        className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h2
                                    id="template-modal-title"
                                    className="text-lg font-semibold text-slate-900 dark:text-white"
                                >
                                    {editingId !== null
                                        ? "Edit Template"
                                        : "Create Template"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Enter the template details below.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalOpen(false)}
                                disabled={saving}
                                aria-label="Close modal"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            <div>
                                <label
                                    htmlFor="template-name"
                                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    Template Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="template-name"
                                    required
                                    maxLength={200}
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({ ...form, name: event.target.value })
                                    }
                                    placeholder="Enter template name"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="template-description"
                                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="template-description"
                                    required
                                    rows={4}
                                    maxLength={2000}
                                    value={form.name_desc}
                                    onChange={(event) =>
                                        setForm({ ...form, name_desc: event.target.value })
                                    }
                                    placeholder="Describe this template"
                                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="template-projecttype"
                                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                                >
                                    Project Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="template-projecttype"
                                    required
                                    value={form.projecttype}
                                    onChange={(event) =>
                                        setForm({ ...form, projecttype: event.target.value })
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                >
                                    <option value="">Select project type</option>
                                    {projectTypes.map((type) => (
                                        <option key={type.ptypeid} value={type.ptypeid}>
                                            {type.projecttype}
                                        </option>
                                    ))}
                                </select>

                                {projectTypes.length === 0 && (
                                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                        No project types loaded. Check the Project Types API.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={saving}
                                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving && (
                                        <Loader2 size={16} className="animate-spin" />
                                    )}
                                    {editingId !== null
                                        ? "Save Changes"
                                        : "Create Template"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-template-title"
                        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                            <Trash2 size={22} />
                        </div>

                        <h2
                            id="delete-template-title"
                            className="text-lg font-semibold text-slate-900 dark:text-white"
                        >
                            Delete Template?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Are you sure you want to delete template #{deleteId}?
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => void handleDelete()}
                                disabled={deleting}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting && (
                                    <Loader2 size={16} className="animate-spin" />
                                )}
                                Delete Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
