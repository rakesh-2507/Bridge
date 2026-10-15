
import { useEffect, useMemo, useState } from "react";
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
  Users,
  Plus,
  Minus,
  Pencil,
  Trash2,
  CircleUser,
} from "lucide-react";
import {
  getProjects,
  getProject,
  getProjectFolderFiles,
  deleteProject,
  type Project,
  type ProjectFolder,
} from "../api/projects";
import { getUsers, type User } from "../api/users";
function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function addFolderFileCounts(
  folders: ProjectFolder[],
  projectId: number,
): Promise<ProjectFolder[]> {
  return Promise.all(
    folders.map(async (folder) => {
      const [response, children] = await Promise.all([
        getProjectFolderFiles(projectId, folder.fid) as Promise<{
          files?: unknown[];
        }>,
        addFolderFileCounts(folder.children ?? [], projectId),
      ]);

      return {
        ...folder,
        fileCount: response.files?.length ?? 0,
        children,
      };
    }),
  );
}

function FolderTree({
  folders,
  level = 0,
  onFolderClick,
}: {
  folders: ProjectFolder[];
  level?: number;
  onFolderClick: (folder: ProjectFolder) => void;
}) {
  return (
    <div>
      {folders.map((folder, index) => (
        <FolderTreeItem
          key={folder.pfid}
          folder={folder}
          level={level}
          isLast={index === folders.length - 1}
          onFolderClick={onFolderClick}
        />
      ))}
    </div>
  );
}

function folderContainsFiles(folder: ProjectFolder): boolean {
  if ((folder.fileCount ?? 0) > 0) {
    return true;
  }

  return (folder.children ?? []).some(folderContainsFiles);
}

function FolderTreeItem({
  folder,
  level,
  isLast,
  onFolderClick,
}: {
  folder: ProjectFolder;
  level: number;
  isLast: boolean;
  onFolderClick: (folder: ProjectFolder) => void;
}) {
  const children = folder.children ?? [];
  const hasChildren = children.length > 0;
  const hasFiles = folderContainsFiles(folder);

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <div
        className="relative flex min-h-12 items-center gap-2 rounded-lg py-2 pr-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
        style={{ paddingLeft: `${12 + level * 28}px` }}
      >
        {/* Tree connectors */}
        {level > 0 && (
          <>
            <span
              className={`absolute top-0 w-px ${
                hasFiles
                  ? "bg-orange-400 dark:bg-orange-500"
                  : "bg-slate-300 dark:bg-slate-700"
              } ${isLast ? "h-1/2" : "h-full"}`}
              style={{ left: `${level * 28 - 16}px` }}
            />

            <span
              className={`absolute h-px ${
                hasFiles
                  ? "bg-orange-400 dark:bg-orange-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
              style={{
                left: `${level * 28 - 16}px`,
                width: "16px",
                top: "50%",
              }}
            />
          </>
        )}

        {/* Expand / collapse button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((previous) => !previous)}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${folder.fname}`}
            aria-expanded={expanded}
            title={expanded ? "Collapse subfolders" : "Expand subfolders"}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 transition hover:border-primary hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {expanded ? (
              <Minus size={8} />
            ) : (
              <Plus size={8} />
            )}
          </button>
        ) : (
          // Keep folder icons aligned when no expand button exists
          <span className="w-6 shrink-0" />
        )}

        {/* Folder icon */}
        {hasChildren && expanded ? (
          <FolderOpen
            size={19}
            className={`shrink-0 ${
              hasFiles
                ? "text-blue-700 dark:text-blue-400"
                : "text-blue-700 dark:text-gray-400"
            }`}
          />
        ) : (
          <Folder
            size={19}
            className={`shrink-0 ${
              hasFiles
                ? "text-primary dark:text-green-500"
                : "text-gray-400 dark:text-gray-500"
            }`}
          />
        )}

        {/* Folder name */}
        <button
          type="button"
          onClick={() => onFolderClick(folder)}
          title={`Open files in ${folder.fname}`}
          className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="break-words text-sm font-medium text-slate-700 hover:text-blue-700 dark:text-slate-200 dark:hover:text-blue-400">
            {folder.fname}
          </span>
        </button>

        {/* Subfolder count */}
        {hasChildren && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {children.length}
          </span>
        )}
      </div>

      {/* Render child folders only when expanded */}
      {hasChildren && expanded && (
        <FolderTree
          folders={children}
          level={level + 1}
          onFolderClick={onFolderClick}
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
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.users);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };

    void loadUsers();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const response = await getProjects<Project[]>();

        if (cancelled) return;

        if (Array.isArray(response)) {
          setProjects(response);
        } else {
          setError("The projects API returned an unexpected response.");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to load projects."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedProjectId === null) return;

    let cancelled = false;
    const projectId = selectedProjectId;

    async function loadProjectDetails() {
      setDetailsLoading(true);
      setDetailsError("");
      setProjectDetails(null);
      setFolderModalOpen(false);

      try {
        const response = await getProject(projectId);

        const foldersWithCounts = await addFolderFileCounts(
          response.folders ?? [],
          projectId,
        );

        if (!cancelled) {
          setProjectDetails({
            ...response,
            folders: foldersWithCounts,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setDetailsError(
            getErrorMessage(err, "Failed to load project details.")
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
    } catch (err: unknown) {
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

      const foldersWithCounts = await addFolderFileCounts(
        response.folders ?? [],
        selectedProjectId,
      );

      setProjectDetails({
        ...response,
        folders: foldersWithCounts,
      });
    } catch (err: unknown) {
      setDetailsError(
        getErrorMessage(err, "Failed to load project details.")
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function openProject(projectId: number) {
    setSelectedProjectId(projectId);
    setProjectDetails(null);
    setDetailsError("");
    setFolderModalOpen(false);
  }

  function openFolderFiles(folder: ProjectFolder) {
    if (!projectDetails) return;

    setFolderModalOpen(false);

    navigate(
      `/dashboard/projects/${projectDetails.project_id}/folders/${folder.fid}`,
      {
        state: {
          project: projectDetails,
          folder,
          folderName: folder.fname,
        },
      }
    );
  }

  function backToProjects() {
    setSelectedProjectId(null);
    setProjectDetails(null);
    setDetailsError("");
    setFolderModalOpen(false);
  }

  async function handleDeleteProject() {
    if (selectedProjectId === null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete project ${projectDetails?.projectname ?? selectedProjectId
      }? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDetailsLoading(true);
    setDetailsError("");

    try {
      await deleteProject(selectedProjectId);

      setProjects((previous) =>
        previous.filter(
          (project) => project.project_id !== selectedProjectId
        )
      );

      backToProjects();
    } catch (err: unknown) {
      setDetailsError(
        getErrorMessage(err, "Failed to delete project.")
      );
    } finally {
      setDetailsLoading(false);
    }
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
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [projects, search]);

  if (selectedProjectId !== null) {
    return (
      <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
        <div className="mx-auto space-y-6">
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
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* Full-Width Header */}
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

                  {/* Project Icon and Name */}
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFolderModalOpen(true)}
                      aria-label={`View folders for ${projectDetails.projectname}`}
                      className="shrink-0 rounded-xl bg-primary/50 p-3 text-white/80 transition hover:bg-primary hover:text-white dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      <FolderKanban size={26} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setFolderModalOpen(true)}
                        className="break-words text-left text-xl font-bold text-slate-900 hover:text-primary dark:text-white dark:hover:text-blue-400"
                      >
                        {projectDetails.projectname}
                      </button>

                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        Project #{projectDetails.project_id}

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${Number(projectDetails.status) === 0
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                            : Number(projectDetails.status) === 1
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                              : Number(projectDetails.status) === 2
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                        >
                          {{
                            0: "Pending",
                            1: "In Progress",
                            2: "Completed",
                          }[Number(projectDetails.status)] ?? "Unknown"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/create?edit=${selectedProjectId}`)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/60 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary"
                    >
                      <Pencil size={16} />

                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteProject()}
                      disabled={detailsLoading}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={16} />

                    </button>

                    <button
                      type="button"
                      onClick={() => void refreshProjectDetails()}
                      disabled={detailsLoading}
                      title="Refresh project details"
                      aria-label="Refresh project details"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2.5 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <RefreshCw
                        size={16}
                        className={detailsLoading ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                {/* Content: 70% Left + 30% Right */}
                <div className="grid grid-cols-1 lg:grid-cols-10">

                  {/* Left: Project Description and Folders */}
                  <div className="min-w-0 lg:col-span-8">

                    {/* Description */}
                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                      <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                        Project Description
                      </h2>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {projectDetails.projectdesc || "No description provided."}
                      </p>
                    </div>

                    {/* Folder Cards */}
                    <div className="p-5">
                      {projectDetails.folders?.length ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                          {projectDetails.folders.map((folder) => (
                            <button
                              key={folder.pfid}
                              type="button"
                              onClick={() => openFolderFiles(folder)}
                              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-primary/10"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                                <Folder size={23} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {folder.fname}
                                </p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {folder.children?.length ?? 0} subfolders
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <Folder
                            size={34}
                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                          />
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            No folders available
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="min-w-0 border-t border-slate-200 dark:border-slate-800 lg:col-span-2 lg:border-l lg:border-t-0">

                    {/* Members Header */}
                    <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                      <div className="rounded-lg bg-primary p-2 text-white dark:bg-primary dark:text-white">
                        <CircleUser size={20} />
                      </div>

                      <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                          Project Members
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {projectDetails.member_ids?.length ?? 0} member(s)
                        </p>
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="p-5">
                      {projectDetails.member_ids?.length ? (
                        <div className="max-h-[460px] space-y-3 overflow-y-auto pr-2 scrollbar-hide">
                          {projectDetails.member_ids.map((memberId) => {
                            const user = users.find((u) => u.uid === memberId);

                            const fullName = user
                              ? [user.title, user.firstname, user.lastname]
                                .filter(Boolean)
                                .join(" ")
                              : `User ID: ${memberId}`;

                            return (
                              <div
                                key={memberId}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                  <CircleUser size={18} />
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col gap-1">

                                  <p className="break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                                    {fullName}
                                  </p>

                                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {user?.email || "Project member"}
                                  </p>

                                  <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                                    ID: {memberId}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <Users
                            size={32}
                            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
                          />
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            No members assigned
                          </p>
                        </div>
                      )}
                    </div>
                  </aside>

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
                <p className="font-medium">
                  Unable to display project details
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Check the error above and try again.
                </p>
                <button
                  type="button"
                  onClick={() => void refreshProjectDetails()}
                  disabled={detailsLoading}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Try again
                </button>
              </div>
            )
          )}
        </div>

        {folderModalOpen && projectDetails && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setFolderModalOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-folder-modal-title"
              onClick={(event) => event.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="border-b border-slate-200 p-1 dark:border-slate-800">
                {/* Top Row: Project Name and Close Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-xl bg-amber-100 p-1 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <FolderOpen size={18} />
                    </div>

                    <h2
                      id="project-folder-modal-title"
                      className="min-w-0 break-words text-lg font-bold text-slate-900 dark:text-slate-100"
                    >
                      {projectDetails.projectname}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFolderModalOpen(false)}
                    aria-label="Close folder tree"
                    className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <X size={20} />
                  </button>
                </div>

              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-2">
                {projectDetails.folders?.length ? (
                  <>
                    <div className="rounded-xl px-6 dark:border-slate-800">
                      <FolderTree
                        folders={projectDetails.folders}
                        onFolderClick={openFolderFiles}
                      />
                    </div>
                    <div className="flex justify-end">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-slate-100 px-2 dark:bg-slate-800">
                        <div className="flex items-center gap-1.5">
                          <FolderOpen
                            size={16}
                            className="shrink-0 text-blue-600 dark:text-blue-400"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Subfolders Exists
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Folder
                            size={16}
                            className="shrink-0 text-orange-500"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Files Exists
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Folder
                            size={16}
                            className="shrink-0 text-gray-400 dark:text-gray-500"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Empty folder
                          </span>
                        </div>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <Folder
                      size={38}
                      className="mb-3 text-slate-300 dark:text-slate-600"
                    />
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      No folders available
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      This project does not have any folders to display.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-md p-1 transition hover:bg-red-100 dark:hover:bg-red-900/50"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2 dark:border-slate-800">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Projects{" "}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  ({loading ? "..." : filteredProjects.length})
                </span>
              </h2>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-64 lg:w-72">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search projects..."
                    aria-label="Search projects"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-950"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void refreshProjects()}
                  disabled={loading}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 p-2 text-sm font-medium text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary/40 dark:hover:bg-primary/10"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/projects/create")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary p-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-90 focus:outline-none focus:ring-4 focus:ring-primary/20"
                >
                  <Plus size={17} />
                  Create Project
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 py-12">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Loading projects...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please wait while we fetch your projects.
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <FolderKanban size={32} className="text-primary" />
              </div>

              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {search.trim()
                  ? "No matching projects found"
                  : "No projects found"}
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {search.trim()
                  ? "Try a different search term or clear your search."
                  : "No projects were returned by the API."}
              </p>

              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-primary text-xs uppercase tracking-wider text-white dark:bg-slate-950/70 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Project ID
                    </th>
                    <th scope="col" className="px-5 py-4 font-semibold sm:px-6">
                      Project Name
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Template ID
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Project Type
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Company ID
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Coordinator
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      Start Date
                    </th>
                    <th scope="col" className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">
                      End Date
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
                      className="group cursor-pointer odd:bg-white even:bg-slate-100 transition-colors hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:odd:bg-slate-900 dark:even:bg-slate-800/50 dark:hover:bg-primary/10"
                    >
                      <td className="whitespace-nowrap p-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {project.project_id}
                        </span>
                      </td>

                      <td className="max-w-sm px-5 py-4 sm:px-6">
                        <p className="truncate font-semibold text-slate-800 transition-colors group-hover:text-primary dark:text-slate-100 dark:group-hover:text-primary">
                          {project.projectname || "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {project.tid ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                        {project.projecttype ? (
                          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {project.projecttype}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {project.cid ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {project.coordinator ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {project.start_date ?? "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">
                        {project.end_date ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredProjects.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing {filteredProjects.length} of {projects.length} projects
              </span>
              <span>Click a project row to view details</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
