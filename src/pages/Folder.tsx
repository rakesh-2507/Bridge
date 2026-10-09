import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Folder as FolderIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
  getTemplateFolders,
  type Folder as FolderType,
  type FolderPayload,
} from "../api/folders";

import {
  getTemplates,
  type Template,
} from "../api/templates";

interface FolderFormState {
  fname: string;
  pid: string;
  tid: string;
  fnamedesc: string;
}

const initialForm: FolderFormState = {
  fname: "",
  pid: "0",
  tid: "",
  fnamedesc: "",
};

export default function FolderPage() {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FolderFormState>(initialForm);

  const [lookupId, setLookupId] = useState("");
  const [viewingFolder, setViewingFolder] =
    useState<FolderType | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Initial API loading
  useEffect(() => {
    let cancelled = false;

    async function initializePage() {
      try {
        const [folderResponse, templateResponse] = await Promise.all([
          getFolders(),
          getTemplates(),
        ]);

        if (cancelled) return;

        setFolders(
          Array.isArray(folderResponse.folders)
            ? folderResponse.folders
            : [],
        );

        setTemplates(
          Array.isArray(templateResponse.templates)
            ? templateResponse.templates
            : [],
        );
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load folders and templates.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initializePage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reload all folders
  async function loadFolders() {
    setLoading(true);
    setError("");

    try {
      const response = await getFolders();

      setFolders(
        Array.isArray(response.folders) ? response.folders : [],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load folders.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getTemplateName(tid: number) {
    return (
      templates.find((template) => template.tid === tid)?.name ??
      `Template ${tid}`
    );
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  // GET /getfolder/{fid}, then open the edit form
  async function openEditModal(fid: number) {
    setError("");
    setSuccess("");

    try {
      const folder = await getFolder(fid);

      setEditingId(folder.fid);
      setForm({
        fname: folder.fname,
        pid: String(folder.pid),
        tid: String(folder.tid),
        fnamedesc: folder.fnamedesc,
      });

      setModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch folder details.",
      );
    }
  }

  // POST /createfolder or PUT /updatefolder/{fid}
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fname.trim()) {
      setError("Folder name is required.");
      return;
    }

    if (!form.tid) {
      setError("Please select a template.");
      return;
    }

    const payload: FolderPayload = {
      fname: form.fname.trim(),
      pid: Number(form.pid),
      tid: Number(form.tid),
      fnamedesc: form.fnamedesc.trim(),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateFolder(editingId, payload);
        setSuccess("Folder updated successfully.");
      } else {
        await createFolder(payload);
        setSuccess("Folder created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(initialForm);

      await loadFolders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save folder.",
      );
    } finally {
      setSaving(false);
    }
  }

  // GET /getfolder/{fid}
  async function handleLookup() {
    const fid = Number(lookupId);

    if (!lookupId.trim() || !Number.isInteger(fid) || fid <= 0) {
      setError("Enter a valid folder ID.");
      return;
    }

    setLookupLoading(true);
    setError("");
    setSuccess("");

    try {
      const folder = await getFolder(fid);
      setViewingFolder(folder);
    } catch (err) {
      setViewingFolder(null);
      setError(
        err instanceof Error ? err.message : "Folder not found.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  // GET /gettemplatefolders/{tid}
  async function handleTemplateFilter(tid: string) {
    setSelectedTemplate(tid);
    setError("");
    setSuccess("");

    if (!tid) {
      await loadFolders();
      return;
    }

    setLoading(true);

    try {
      const response = await getTemplateFolders(Number(tid));

      setFolders(
        Array.isArray(response.folders) ? response.folders : [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load template folders.",
      );
    } finally {
      setLoading(false);
    }
  }

  // DELETE /deletefolder/{fid}
  async function handleDelete() {
    if (deleteId === null) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteFolder(deleteId);

      setFolders((current) =>
        current.filter((folder) => folder.fid !== deleteId),
      );

      if (viewingFolder?.fid === deleteId) {
        setViewingFolder(null);
      }

      setDeleteId(null);
      setSuccess("Folder deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete folder.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredFolders = folders.filter((folder) => {
    const query = search.toLowerCase();

    return (
      folder.fname.toLowerCase().includes(query) ||
      folder.fnamedesc.toLowerCase().includes(query) ||
      String(folder.fid).includes(query) ||
      getTemplateName(folder.tid).toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <FolderIcon size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Folders
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage folders associated with templates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedTemplate("");
              void loadFolders();
            }}
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
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Folder
          </button>
        </div>
      </div>

      {/* Alerts */}
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
          <button
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Find folder by ID */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
          Find Folder by ID
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
            placeholder="Enter folder ID"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            Find Folder
          </button>
        </form>

        {viewingFolder && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Folder #{viewingFolder.fid}
                </p>

                <h3 className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {viewingFolder.fname}
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {viewingFolder.fnamedesc || "No description"}
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Template: {getTemplateName(viewingFolder.tid)}
                  {" · "}Parent ID: {viewingFolder.pid}
                </p>
              </div>

              <button
                onClick={() => setViewingFolder(null)}
                aria-label="Close folder details"
                className="rounded-lg p-2 text-slate-500 hover:bg-white dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Folder list */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              All Folders
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filteredFolders.length} folder
              {filteredFolders.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={selectedTemplate}
                onChange={(event) =>
                  void handleTemplateFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-56"
              >
                <option value="">All templates</option>
                {templates.map((template) => (
                  <option key={template.tid} value={template.tid}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search folders..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            Loading folders...
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
            <FolderIcon
              size={32}
              className="mb-3 text-slate-300 dark:text-slate-600"
            />
            <p className="font-medium text-slate-700 dark:text-slate-200">
              No folders found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try changing your search or create a folder.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Folder Name</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4">Template</th>
                  <th className="px-5 py-4">Parent ID</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFolders.map((folder) => (
                  <tr
                    key={folder.fid}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">
                      #{folder.fid}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <FolderIcon
                          size={17}
                          className="shrink-0 text-blue-500"
                        />
                        {folder.fname}
                      </div>
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600 dark:text-slate-300">
                      <p className="line-clamp-2">
                        {folder.fnamedesc || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {getTemplateName(folder.tid)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {folder.pid}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          title="View folder"
                          aria-label={`View folder ${folder.fid}`}
                          onClick={() => {
                            setLookupId(String(folder.fid));
                            setViewingFolder(folder);
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit folder"
                          aria-label={`Edit folder ${folder.fid}`}
                          onClick={() => void openEditModal(folder.fid)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Delete folder"
                          aria-label={`Delete folder ${folder.fid}`}
                          onClick={() => setDeleteId(folder.fid)}
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
            aria-labelledby="folder-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h2
                  id="folder-modal-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  {editingId !== null ? "Edit Folder" : "Create Folder"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter the folder details below.
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
                  htmlFor="folder-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="folder-name"
                  required
                  maxLength={200}
                  value={form.fname}
                  onChange={(event) =>
                    setForm({ ...form, fname: event.target.value })
                  }
                  placeholder="Enter folder name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="folder-template"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Template <span className="text-red-500">*</span>
                </label>
                <select
                  id="folder-template"
                  required
                  value={form.tid}
                  onChange={(event) =>
                    setForm({ ...form, tid: event.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select template</option>
                  {templates.map((template) => (
                    <option key={template.tid} value={template.tid}>
                      {template.name}
                    </option>
                  ))}
                </select>

                {templates.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                    No templates found. Create a template first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="folder-parent"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Parent Folder ID
                </label>
                <input
                  id="folder-parent"
                  type="number"
                  min="0"
                  value={form.pid}
                  onChange={(event) =>
                    setForm({ ...form, pid: event.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Use 0 for a root folder if supported by your backend.
                </p>
              </div>

              <div>
                <label
                  htmlFor="folder-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Description
                </label>
                <textarea
                  id="folder-description"
                  rows={3}
                  maxLength={2000}
                  value={form.fnamedesc}
                  onChange={(event) =>
                    setForm({ ...form, fnamedesc: event.target.value })
                  }
                  placeholder="Enter folder description"
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
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
                  disabled={saving || templates.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingId !== null ? "Save Changes" : "Create Folder"}
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
            aria-labelledby="delete-folder-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <Trash2 size={22} />
            </div>

            <h2
              id="delete-folder-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              Delete Folder?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Are you sure you want to delete folder #{deleteId}? This
              action cannot be undone.
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
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
