import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Folder,
  FolderOpen,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronRight,
  CalendarDays,
  Users,
  Building2,
  UserRound,
  FileText,
  Hash,
  Plus,
} from "lucide-react";

import {
  getProjects,
  getProject,
  type Project,
  type ProjectFolder,
} from "../api/projects";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <div className="break-words text-base font-semibold text-slate-900 dark:text-slate-100">
        {value ?? "—"}
      </div>
    </div>
  );
}

function FolderTree({
  folders,
  level = 0,
}: {
  folders: ProjectFolder[];
  level?: number;
}) {
  if (folders.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
        No folders available for this project.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder.pfid}
          folder={folder}
          level={level}
        />
      ))}
    </div>
  );
}

function FolderTreeItem({
  folder,
  level,
}: {
  folder: ProjectFolder;
  level: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className="flex items-start gap-2 rounded-lg py-3 pr-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
        style={{ paddingLeft: `${16 + level * 24}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          disabled={!hasChildren}
          aria-label={
            hasChildren
              ? expanded
                ? `Collapse ${folder.fname}`
                : `Expand ${folder.fname}`
              : `${folder.fname} has no subfolders`
          }
          className="mt-0.5 shrink-0 rounded p-0.5 text-slate-500 disabled:cursor-default disabled:opacity-40"
        >
          {hasChildren ? (
            <ChevronRight
              size={16}
              className={`transition-transform ${expanded ? "rotate-90" : ""
                }`}
            />
          ) : (
            <span className="inline-block w-4" />
          )}
        </button>

        {hasChildren && expanded ? (
          <FolderOpen
            size={19}
            className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
          />
        ) : (
          <Folder
            size={19}
            className="mt-0.5 shrink-0 text-amber-500"
          />
        )}

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-100">
            {folder.fname}
          </p>

          {folder.fdesc && (
            <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
              {folder.fdesc}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Folder ID: {folder.fid}</span>
            <span>•</span>
            <span>
              {hasChildren
                ? `${folder.children.length} subfolder(s)`
                : "No subfolders"}
            </span>
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <FolderTree
          folders={folder.children}
          level={level + 1}
        />
      )}
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedProjectId, setSelectedProjectId] =
    useState<number | null>(null);
  const [projectDetails, setProjectDetails] =
    useState<Project | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Load all projects for the table.
  useEffect(() => {
    let cancelled = false;

    async function initializeProjects() {
      try {
        const response = await getProjects<Project[]>();

        if (!cancelled) {
          if (Array.isArray(response)) {
            setProjects(response);
          } else {
            setError("The projects API returned an unexpected response.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to load projects."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load a single project's complete details.


  useEffect(() => {
    if (selectedProjectId === null) {
      return;
    }

    // TypeScript now knows this is a number.
    const projectId: number = selectedProjectId;

    let cancelled = false;

    async function loadProjectDetails() {
      setDetailsLoading(true);
      setDetailsError("");
      setProjectDetails(null);

      try {
        const response = await getProject(projectId);

        if (!cancelled) {
          setProjectDetails(response);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setDetailsError(
            getErrorMessage(
              err,
              "Failed to load project details.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    }

    void loadProjectDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);


  async function refreshProjects() {
    setLoading(true);
    setError("");

    try {
      const response = await getProjects<Project[]>();

      if (Array.isArray(response)) {
        setProjects(response);
      } else {
        setError("The projects API returned an unexpected response.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load projects."));
    } finally {
      setLoading(false);
    }
  }

  async function refreshProjectDetails() {
    if (selectedProjectId === null) return;

    setDetailsLoading(true);
    setDetailsError("");

    try {
      const response = await getProject(selectedProjectId);
      setProjectDetails(response);
    } catch (err) {
      setDetailsError(
        getErrorMessage(err, "Failed to load project details."),
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function openProject(projectId: number) {
    setSelectedProjectId(projectId);
    setProjectDetails(null);
    setDetailsError("");
  }

  function backToProjects() {
    setSelectedProjectId(null);
    setProjectDetails(null);
    setDetailsError("");
  }

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) =>
      [
        project.project_id,
        project.projectname,
        project.tid,
        project.projecttype,
        project.cid,
        project.coordinator,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [projects, search]);

  // Project details view.
  if (selectedProjectId !== null) {
    return (
      <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
        <div className="mx-auto space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={backToProjects}
                className="mt-1 rounded-lg border border-slate-300 bg-white p-2 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                aria-label="Back to projects"
              >
                <ArrowLeft size={19} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <FolderKanban
                    size={23}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <h1 className="text-2xl font-bold tracking-tight">
                    Project Details
                  </h1>
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Project ID: {selectedProjectId}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void refreshProjectDetails()}
              disabled={detailsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={detailsLoading ? "animate-spin" : ""}
              />
              Refresh Details
            </button>
          </div>

          {detailsError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="flex-1">{detailsError}</span>
              <button
                type="button"
                onClick={() => setDetailsError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {detailsLoading && !projectDetails ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={22} className="animate-spin" />
              Loading project details...
            </div>
          ) : projectDetails ? (
            <>
              {/* Main project information */}
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <FolderKanban size={26} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-xl font-bold">
                        {projectDetails.projectname}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Project #{projectDetails.project_id}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Status: {projectDetails.status}
                    </span>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {projectDetails.projectdesc || "No description provided."}
                  </p>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoCard
                    icon={<Hash size={17} />}
                    label="Project ID"
                    value={projectDetails.project_id}
                  />

                  <InfoCard
                    icon={<FileText size={17} />}
                    label="Template ID"
                    value={projectDetails.tid}
                  />

                  <InfoCard
                    icon={<Building2 size={17} />}
                    label="Company ID"
                    value={projectDetails.cid}
                  />

                  <InfoCard
                    icon={<FolderKanban size={17} />}
                    label="Project Type"
                    value={projectDetails.projecttype ?? "—"}
                  />

                  <InfoCard
                    icon={<UserRound size={17} />}
                    label="Coordinator ID"
                    value={projectDetails.coordinator ?? "—"}
                  />

                  <InfoCard
                    icon={<Users size={17} />}
                    label="Project Management"
                    value={
                      projectDetails.is_project_manage === 1
                        ? "Enabled"
                        : "Disabled"
                    }
                  />

                  <InfoCard
                    icon={<CalendarDays size={17} />}
                    label="Start Date"
                    value={formatDate(projectDetails.start_date)}
                  />

                  <InfoCard
                    icon={<CalendarDays size={17} />}
                    label="End Date"
                    value={formatDate(projectDetails.end_date)}
                  />

                  <InfoCard
                    icon={<CalendarDays size={17} />}
                    label="Created Date"
                    value={formatDate(projectDetails.created_date)}
                  />

                  <InfoCard
                    icon={<CalendarDays size={17} />}
                    label="Updated Date"
                    value={formatDate(projectDetails.updated_date)}
                  />
                </div>
              </section>

              {/* Project members */}
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                  <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    <Users size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold">Project Members</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {projectDetails.member_ids?.length ?? 0} member(s)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 p-5">
                  {projectDetails.member_ids?.length ? (
                    projectDetails.member_ids.map((memberId) => (
                      <span
                        key={memberId}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        User ID: {memberId}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No members assigned.
                    </p>
                  )}
                </div>
              </section>

              {/* Nested folder hierarchy */}
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                  <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    <FolderOpen size={20} />
                  </div>

                  <div>
                    <h2 className="font-semibold">Project Folders</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Folder hierarchy and subfolders
                    </p>
                  </div>
                </div>

                <div className="p-3 sm:p-5">
                  <FolderTree folders={projectDetails.folders ?? []} />
                </div>
              </section>
            </>
          ) : (
            !detailsLoading && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <AlertCircle
                  size={32}
                  className="mx-auto mb-3 text-slate-400"
                />
                <p className="font-medium">Unable to display project details</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Check the error above and try again.
                </p>

                <button
                  type="button"
                  onClick={() => void refreshProjectDetails()}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Try again
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Projects list view.
  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <FolderKanban size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View, search, and open project details.
              </p>
            </div>
          </div>

          
<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <button
    type="button"
    onClick={() => navigate("/projects/create")}
    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    <Plus size={17} />
    Create Project
  </button>

  <button
    type="button"
    onClick={() => void refreshProjects()}
    disabled={loading}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
  >
    <RefreshCw
      size={16}
      className={loading ? "animate-spin" : ""}
    />
    Refresh
  </button>
</div>
        </div>

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

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Project List</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loading
                  ? "Loading projects..."
                  : `${filteredProjects.length} of ${projects.length} projects`}
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={21} className="animate-spin" />
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <FolderKanban
                size={36}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />

              <p className="font-medium">
                {search.trim()
                  ? "No matching projects found"
                  : "No projects found"}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search.trim()
                  ? "Try a different search term."
                  : "No projects were returned by the API."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Project ID
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Project Name
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Template ID
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Project Type
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Company ID
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold">
                      Coordinator
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.project_id}
                      onClick={() => openProject(project.project_id)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          openProject(project.project_id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open project ${project.projectname}`}
                      className="cursor-pointer transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-blue-950/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium dark:bg-slate-800">
                          {project.project_id}
                        </span>
                      </td>

                      <td className="max-w-sm px-5 py-4">
                        <p className="font-medium text-blue-700 dark:text-blue-400">
                          {project.projectname || "—"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {project.projectdesc || "No description"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {project.tid ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {project.projecttype ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {project.cid ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {project.coordinator ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
