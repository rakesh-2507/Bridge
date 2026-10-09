import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Loader2,
  Eye,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Hash,
} from "lucide-react";

import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
  type Project,
  type ProjectPayload,
} from "../api/projects";

import { getTemplates, type Template } from "../api/templates";
import { getCompanies } from "../api/companies";
import {
  getProjectTypes,
  type ProjectType,
} from "../api/projectTypes";

import type { Company } from "../api/companies";

interface ProjectForm {
  tid: string;
  cid: string;
  projectname: string;
  projectdesc: string;
  start_date: string;
  end_date: string;
  member_ids: string;
  coordinator: string;
  is_project_manage: string;
  projecttype: string;
  status: string;
}

const initialForm: ProjectForm = {
  tid: "",
  cid: "",
  projectname: "",
  projectdesc: "",
  start_date: "",
  end_date: "",
  member_ids: "",
  coordinator: "",
  is_project_manage: "0",
  projecttype: "",
  status: "0",
};

function toDateInput(value?: string | null): string {
  if (!value) return "";

  // Supports both YYYY-MM-DD and ISO date-time responses.
  return value.slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<Project | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(initialForm);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const [projectResponse, templateResponse, companyResponse, typeResponse] =
          await Promise.all([
            getProjects<{
              projects: Project[];
              total: number;
            }>(),
            getTemplates<{
              templates: Template[];
              total: number;
            }>(),
            getCompanies<{
              companies: Company[];
              total: number;
            }>(),
            getProjectTypes<{
              projecttypes: ProjectType[];
              total: number;
            }>(),
          ]);

        if (cancelled) return;

        setProjects(projectResponse.projects ?? []);
        setTemplates(templateResponse.templates ?? []);
        setCompanies(companyResponse.companies ?? []);
        setProjectTypes(typeResponse.projecttypes ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to load project data."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      const response = await getProjects<{
        projects: Project[];
        total: number;
      }>();

      setProjects(response.projects ?? []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load projects."));
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) => {
      const templateName =
        templates.find((template) => template.tid === project.tid)?.name ?? "";

      const companyName =
        companies.find((company) => company.cid === project.cid)
          ?.company_name ?? "";

      const projectTypeName =
        projectTypes.find((type) => type.ptypeid === project.projecttype)
          ?.projecttype ?? "";

      return (
        project.projectname.toLowerCase().includes(query) ||
        project.projectdesc.toLowerCase().includes(query) ||
        String(project.project_id).includes(query) ||
        templateName.toLowerCase().includes(query) ||
        companyName.toLowerCase().includes(query) ||
        projectTypeName.toLowerCase().includes(query)
      );
    });
  }, [projects, templates, companies, projectTypes, search]);

  function getTemplateName(tid: number) {
    return templates.find((template) => template.tid === tid)?.name ??
      `Template #${tid}`;
  }

  function getCompanyName(cid: number) {
    return companies.find((company) => company.cid === cid)?.company_name ??
      `Company #${cid}`;
  }

  function getProjectTypeName(ptypeid: number) {
    return projectTypes.find((type) => type.ptypeid === ptypeid)?.projecttype ??
      `Type #${ptypeid}`;
  }

  function openCreateModal() {
    setEditingProject(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function openEditModal(projectId: number) {
    setError("");
    setSuccess("");

    try {
      const project = await getProject<Project>(projectId);

      setEditingProject(project);
      setForm({
        tid: String(project.tid),
        cid: String(project.cid),
        projectname: project.projectname ?? "",
        projectdesc: project.projectdesc ?? "",
        start_date: toDateInput(project.start_date),
        end_date: toDateInput(project.end_date),
        // Member IDs aren't included in the documented project response.
        // Leave this blank unless the backend returns them elsewhere.
        member_ids: "",
        coordinator: String(project.coordinator ?? ""),
        is_project_manage: String(project.is_project_manage ?? 0),
        projecttype: String(project.projecttype),
        status: String(project.status ?? 0),
      });

      setIsModalOpen(true);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load project details."));
    }
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingProject(null);
    setForm(initialForm);
  }

  function updateForm<K extends keyof ProjectForm>(
    key: K,
    value: ProjectForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function parsePositiveInteger(value: string, label: string): number {
    const numberValue = Number(value);

    if (!value.trim() || !Number.isInteger(numberValue) || numberValue <= 0) {
      throw new Error(`${label} must be a positive integer.`);
    }

    return numberValue;
  }

  function parseMemberIds(value: string): number[] {
    if (!value.trim()) return [];

    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const ids = parts.map((part) => {
      const id = Number(part);

      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(
          "Member IDs must be positive integers separated by commas.",
        );
      }

      return id;
    });

    return [...new Set(ids)];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    let payload: ProjectPayload;

    try {
      const projectname = form.projectname.trim();

      if (!projectname) {
        throw new Error("Project name is required.");
      }

      if (form.start_date && form.end_date && form.end_date < form.start_date) {
        throw new Error("End date cannot be earlier than start date.");
      }

      const tid = parsePositiveInteger(form.tid, "Template");
      const cid = parsePositiveInteger(form.cid, "Company");
      const projecttype = parsePositiveInteger(form.projecttype, "Project type");
      const coordinator = parsePositiveInteger(
        form.coordinator,
        "Coordinator ID",
      );

      const status = Number(form.status);
      const isProjectManage = Number(form.is_project_manage);

      if (!Number.isInteger(status) || status < 0) {
        throw new Error("Status must be a non-negative integer.");
      }

      if (![0, 1].includes(isProjectManage)) {
        throw new Error("Project management flag must be 0 or 1.");
      }

      payload = {
        tid,
        cid,
        projectname,
        projectdesc: form.projectdesc.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        member_ids: parseMemberIds(form.member_ids),
        coordinator,
        is_project_manage: isProjectManage,
        projecttype,
        status,
      };
    } catch (err) {
      setError(getErrorMessage(err, "Please check the project details."));
      return;
    }

    setSaving(true);

    try {
      if (editingProject) {
        await updateProject(editingProject.project_id, payload);
        setSuccess("Project updated successfully.");
      } else {
        await createProject(payload);
        setSuccess("Project created successfully.");
      }

      setIsModalOpen(false);
      setEditingProject(null);
      setForm(initialForm);

      await loadProjects();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save project."));
    } finally {
      setSaving(false);
    }
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = Number(lookupId.trim());

    if (!lookupId.trim() || !Number.isInteger(id) || id <= 0) {
      setError("Enter a valid project ID.");
      return;
    }

    setLookupLoading(true);
    setError("");
    setSuccess("");
    setLookupResult(null);

    try {
      const project = await getProject<Project>(id);
      setLookupResult(project);
    } catch (err) {
      setError(getErrorMessage(err, "Project not found."));
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteProject(deleteTarget.project_id);

      setProjects((current) =>
        current.filter(
          (project) => project.project_id !== deleteTarget.project_id,
        ),
      );

      if (lookupResult?.project_id === deleteTarget.project_id) {
        setLookupResult(null);
      }

      setDeleteTarget(null);
      setSuccess("Project deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <FolderKanban size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create, view, and manage your projects.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Project
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={18} />
            <span className="min-w-0 flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Find by ID */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Hash size={19} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold">Find Project by ID</h2>
          </div>

          <form
            onSubmit={handleLookup}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              min="1"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="Enter project ID"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {lookupLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Find Project
            </button>
          </form>

          {lookupResult && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">{lookupResult.projectname}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Project ID: {lookupResult.project_id} ·{" "}
                  {getCompanyName(lookupResult.cid)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void openEditModal(lookupResult.project_id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(lookupResult)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Projects table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Project List</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredProjects.length} of {projects.length} projects
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <FolderKanban
                size={36}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="font-medium">
                {search ? "No matching projects" : "No projects found"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? "Try another search term."
                  : "Create your first project to get started."}
              </p>
              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Project
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">ID</th>
                    <th className="px-5 py-4 font-semibold">Project</th>
                    <th className="px-5 py-4 font-semibold">Company</th>
                    <th className="px-5 py-4 font-semibold">Template</th>
                    <th className="px-5 py-4 font-semibold">Project Type</th>
                    <th className="px-5 py-4 font-semibold">Dates</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.project_id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium dark:bg-slate-800">
                          {project.project_id}
                        </span>
                      </td>
                      <td className="max-w-xs px-5 py-4">
                        <p className="font-medium">{project.projectname}</p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {project.projectdesc || "No description"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {getCompanyName(project.cid)}
                      </td>
                      <td className="px-5 py-4">
                        {getTemplateName(project.tid)}
                      </td>
                      <td className="px-5 py-4">
                        {getProjectTypeName(project.projecttype)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <CalendarDays size={15} />
                          <span>
                            {toDateInput(project.start_date) || "—"} –{" "}
                            {toDateInput(project.end_date) || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            project.status === 1
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : project.status === 0
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {project.status === 1
                            ? "Active"
                            : project.status === 0
                              ? "Pending"
                              : `Status ${project.status}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="View project"
                            onClick={() => {
                              setLookupId(String(project.project_id));
                              setLookupResult(project);
                              setError("");
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            title="Edit project"
                            onClick={() => void openEditModal(project.project_id)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete project"
                            onClick={() => setDeleteTarget(project)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
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
      </div>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 id="project-modal-title" className="text-lg font-bold">
                  {editingProject ? "Edit Project" : "Create Project"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingProject
                    ? `Update project ID ${editingProject.project_id}.`
                    : "Fill in the project information."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="projectname" className="mb-2 block text-sm font-medium">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="projectname"
                    required
                    maxLength={200}
                    value={form.projectname}
                    onChange={(event) => updateForm("projectname", event.target.value)}
                    placeholder="Enter project name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="mb-2 block text-sm font-medium">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="company"
                    required
                    value={form.cid}
                    onChange={(event) => updateForm("cid", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option key={company.cid} value={company.cid}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="template" className="mb-2 block text-sm font-medium">
                    Template <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="template"
                    required
                    value={form.tid}
                    onChange={(event) => updateForm("tid", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  >
                    <option value="">Select template</option>
                    {templates.map((template) => (
                      <option key={template.tid} value={template.tid}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="projecttype" className="mb-2 block text-sm font-medium">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="projecttype"
                    required
                    value={form.projecttype}
                    onChange={(event) => updateForm("projecttype", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  >
                    <option value="">Select project type</option>
                    {projectTypes.map((type) => (
                      <option key={type.ptypeid} value={type.ptypeid}>
                        {type.projecttype}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="start_date" className="mb-2 block text-sm font-medium">
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    value={form.start_date}
                    onChange={(event) => updateForm("start_date", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="mb-2 block text-sm font-medium">
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    min={form.start_date || undefined}
                    value={form.end_date}
                    onChange={(event) => updateForm("end_date", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>

                <div>
                  <label htmlFor="coordinator" className="mb-2 block text-sm font-medium">
                    Coordinator User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="coordinator"
                    type="number"
                    min="1"
                    required
                    value={form.coordinator}
                    onChange={(event) => updateForm("coordinator", event.target.value)}
                    placeholder="Enter coordinator ID"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>

                <div>
                  <label htmlFor="member_ids" className="mb-2 block text-sm font-medium">
                    Member User IDs
                  </label>
                  <input
                    id="member_ids"
                    value={form.member_ids}
                    onChange={(event) => updateForm("member_ids", event.target.value)}
                    placeholder="e.g. 12, 15, 21"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Enter user IDs separated by commas.
                  </p>
                </div>

                <div>
                  <label htmlFor="is_project_manage" className="mb-2 block text-sm font-medium">
                    Project Management
                  </label>
                  <select
                    id="is_project_manage"
                    value={form.is_project_manage}
                    onChange={(event) => updateForm("is_project_manage", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  >
                    <option value="0">No (0)</option>
                    <option value="1">Yes (1)</option>
                  </select>
                </div>

                {editingProject && (
                  <div>
                    <label htmlFor="status" className="mb-2 block text-sm font-medium">
                      Status
                    </label>
                    <input
                      id="status"
                      type="number"
                      min="0"
                      value={form.status}
                      onChange={(event) => updateForm("status", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="projectdesc" className="mb-2 block text-sm font-medium">
                    Project Description
                  </label>
                  <textarea
                    id="projectdesc"
                    rows={3}
                    value={form.projectdesc}
                    onChange={(event) => updateForm("projectdesc", event.target.value)}
                    placeholder="Enter project description"
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-project-title" className="text-lg font-bold">
              Delete Project
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {deleteTarget.projectname}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                {deleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
