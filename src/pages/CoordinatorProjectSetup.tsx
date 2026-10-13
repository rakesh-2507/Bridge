import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    Loader2,
    Save,
    Users,
    X,
    AlertCircle,
    Folder,
} from "lucide-react";

import {
    getCoordinatorProjects,
    setupCoordinatorProject,
    type Project,
    type ProjectAssignment,
    type ProjectMember,
    type ProjectRole,
    type CoordinatorProjectsResponse,
} from "../api/projects";

// ========================================
// Helpers
// ========================================

function normalizeProjects(
    response: CoordinatorProjectsResponse,
): Project[] {
    return Array.isArray(response) ? response : response.projects ?? [];
}

function getProjectMembers(project: Project | null): ProjectMember[] {
    if (!project) return [];

    if (project.members?.length) {
        return project.members;
    }

    return (project.member_ids ?? []).map((memberid) => ({
        memberid,
        assigned_role_ids: [],
    }));
}

// ========================================
// Component
// ========================================

export default function CoordinatorProjectSetup() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // const [startDate, setStartDate] = useState("");
    // const [endDate, setEndDate] = useState("");

    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [assignmentsByMember, setAssignmentsByMember] = useState<
        Record<number, number[]>
    >({});

    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ========================================
    // Load project
    // ========================================

    const loadProject = useCallback(async () => {
        if (!projectId || !Number.isFinite(Number(projectId))) {
            setProject(null);
            setError("Invalid project ID.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await getCoordinatorProjects();
            const projects = normalizeProjects(response);

            const foundProject =
                projects.find(
                    (item) => String(item.project_id) === String(projectId),
                ) ?? null;

            if (!foundProject) {
                setProject(null);
                setError(
                    "Project not found in your assigned projects. Please return to the projects list.",
                );
                return;
            }

            setProject(foundProject);
            // setStartDate(foundProject.start_date ?? "");
            // setEndDate(foundProject.end_date ?? "");

            const initialAssignments: Record<number, number[]> = {};
            const initialSelected: number[] = [];

            getProjectMembers(foundProject).forEach((member) => {
                const roleIds = member.assigned_role_ids ?? [];

                initialAssignments[member.memberid] = [...roleIds];

                if (roleIds.length > 0) {
                    initialSelected.push(member.memberid);
                }
            });

            setAssignmentsByMember(initialAssignments);
            setSelectedMembers(initialSelected);
        } catch (err) {
            console.error("Failed to load coordinator project:", err);

            setProject(null);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load project details. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        let cancelled = false;

        async function fetchProject() {
            if (!projectId || !Number.isFinite(Number(projectId))) {
                if (!cancelled) {
                    setProject(null);
                    setError("Invalid project ID.");
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await getCoordinatorProjects();

                if (cancelled) return;

                const projects = normalizeProjects(response);
                const foundProject =
                    projects.find(
                        (item) => String(item.project_id) === String(projectId),
                    ) ?? null;

                if (!foundProject) {
                    setProject(null);
                    setError(
                        "Project not found in your assigned projects. Please return to the projects list.",
                    );
                    return;
                }

                setProject(foundProject);
                // setStartDate(foundProject.start_date ?? "");
                // setEndDate(foundProject.end_date ?? "");

                const initialAssignments: Record<number, number[]> = {};
                const initialSelected: number[] = [];

                getProjectMembers(foundProject).forEach((member) => {
                    const roleIds = member.assigned_role_ids ?? [];

                    initialAssignments[member.memberid] = [...roleIds];

                    if (roleIds.length > 0) {
                        initialSelected.push(member.memberid);
                    }
                });

                setAssignmentsByMember(initialAssignments);
                setSelectedMembers(initialSelected);
            } catch (err) {
                if (cancelled) return;

                console.error("Failed to load coordinator project:", err);

                setProject(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load project details. Please try again.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchProject();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    // ========================================
    // Derived data
    // ========================================

    const members = getProjectMembers(project);
    const roles: ProjectRole[] = project?.available_roles ?? [];

    const filteredMembers = members.filter((member) =>
        String(member.memberid).includes(search.trim()),
    );

    const selectedMemberDetails = members.filter((member) =>
        selectedMembers.includes(member.memberid),
    );

    // ========================================
    // Navigation
    // ========================================

    const handleBack = () => {
        navigate("/dashboard");
    };

    // ========================================
    // Member and role selection
    // ========================================

    const toggleMember = (memberId: number) => {
        setError("");
        setSuccess("");

        setSelectedMembers((previous) =>
            previous.includes(memberId)
                ? previous.filter((id) => id !== memberId)
                : [...previous, memberId],
        );
    };

    const toggleRole = (memberId: number, roleId: number) => {
        setError("");
        setSuccess("");

        setAssignmentsByMember((previous) => {
            const currentRoles = previous[memberId] ?? [];

            return {
                ...previous,
                [memberId]: currentRoles.includes(roleId)
                    ? currentRoles.filter((id) => id !== roleId)
                    : [...currentRoles, roleId],
            };
        });
    };

    const toggleAllVisible = () => {
        const visibleIds = filteredMembers.map(
            (member) => member.memberid,
        );

        const allSelected =
            visibleIds.length > 0 &&
            visibleIds.every((id) => selectedMembers.includes(id));

        setSelectedMembers((previous) =>
            allSelected
                ? previous.filter((id) => !visibleIds.includes(id))
                : [...new Set([...previous, ...visibleIds])],
        );

        setError("");
        setSuccess("");
    };

    const removeMember = (memberId: number) => {
        setSelectedMembers((previous) =>
            previous.filter((id) => id !== memberId),
        );

        setError("");
        setSuccess("");
    };

    // ========================================
    // Save setup
    // ========================================

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!project) {
            setError("Project details are not available.");
            return;
        }

        // if (!startDate || !endDate) {
        //     setError("Please select both start and end dates.");
        //     return;
        // }

        // if (endDate < startDate) {
        //     setError("End date cannot be earlier than start date.");
        //     return;
        // }

        if (selectedMembers.length === 0) {
            setError("Please select at least one member.");
            return;
        }

        if (roles.length === 0) {
            setError("No roles are available for this project.");
            return;
        }

        const assignments: ProjectAssignment[] = [];

        for (const memberId of selectedMembers) {
            const roleIds = assignmentsByMember[memberId] ?? [];

            if (roleIds.length === 0) {
                setError(
                    `Please assign at least one role to Member ID ${memberId}.`,
                );
                return;
            }

            roleIds.forEach((rollid) => {
                assignments.push({
                    memberid: memberId,
                    rollid,
                });
            });
        }

        setSaving(true);

        try {
            await setupCoordinatorProject(project.project_id, {
                // start_date: startDate,
                // end_date: endDate,
                assignments,
            });

            setSuccess("Project setup saved successfully.");
        } catch (err) {
            console.error("Failed to save project setup:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to save project setup. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================
    // Loading state
    // ========================================

    if (loading) {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-blue-600"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Loading project details...
                    </p>
                </div>
            </div>
        );
    }

    // ========================================
    // Missing project state
    // ========================================

    if (!project) {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
                <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                    <AlertCircle
                        size={32}
                        className="mx-auto mb-3 text-red-500"
                    />

                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Unable to Open Project
                    </h1>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {error || "The requested project could not be found."}
                    </p>

                    <div className="mt-5 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadProject()}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Retry
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Back to Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================
    // Main UI
    // ========================================

    return (
        <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label="Back to projects"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Project Setup
                        </h1>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {project.projectname}
                        </p>
                    </div>
                </div>

                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {selectedMembers.length} selected
                </span>
            </header>

            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="mx-auto flex max-w-7xl flex-col gap-5">
                        {/* Project details */}
                        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <CalendarDays
                                    size={19}
                                    className="text-blue-600 dark:text-blue-400"
                                />

                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    Project Details
                                </h2>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="project-name"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Project Name
                                    </label>
                                    <input
                                        id="project-name"
                                        readOnly
                                        value={project.projectname}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="project-id"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Project ID
                                    </label>
                                    <input
                                        id="project-id"
                                        readOnly
                                        value={project.project_id}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="project-description"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        id="project-description"
                                        readOnly
                                        rows={2}
                                        value={project.projectdesc ?? ""}
                                        className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {/* <div>
                                    <label
                                        htmlFor="start-date"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Start Date *
                                    </label>
                                    <input
                                        id="start-date"
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(event) => {
                                            setStartDate(event.target.value);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div> */}

                                {/* <div>
                                    <label
                                        htmlFor="end-date"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        End Date *
                                    </label>
                                    <input
                                        id="end-date"
                                        type="date"
                                        min={startDate || undefined}
                                        required
                                        value={endDate}
                                        onChange={(event) => {
                                            setEndDate(event.target.value);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div> */}
                            </div>
                        </section>

                        {/* Members and roles */}
                        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Users
                                    size={19}
                                    className="text-blue-600 dark:text-blue-400"
                                />

                                <div>
                                    <h2 className="font-semibold text-gray-900 dark:text-white">
                                        Team Members & Roles
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Select members and assign one or more roles.
                                    </p>
                                </div>
                            </div>

                            {members.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                                    <Users
                                        size={24}
                                        className="mx-auto mb-2 text-gray-400"
                                    />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        No project members were returned by the API.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                                    {/* Member list */}
                                    <div className="min-w-0">
                                        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                                            <input
                                                type="search"
                                                value={search}
                                                onChange={(event) =>
                                                    setSearch(event.target.value)
                                                }
                                                placeholder="Search by member ID..."
                                                aria-label="Search members by ID"
                                                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />

                                            <button
                                                type="button"
                                                onClick={toggleAllVisible}
                                                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                {filteredMembers.length > 0 &&
                                                    filteredMembers.every((member) =>
                                                        selectedMembers.includes(member.memberid),
                                                    )
                                                    ? "Deselect All"
                                                    : "Select All"}
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {filteredMembers.map((member) => {
                                                const selected = selectedMembers.includes(
                                                    member.memberid,
                                                );

                                                const assignedRoles =
                                                    assignmentsByMember[member.memberid] ?? [];

                                                return (
                                                    <div
                                                        key={member.memberid}
                                                        className={`rounded-lg border p-3 ${selected
                                                                ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                                                                : "border-gray-200 dark:border-gray-800"
                                                            }`}
                                                    >
                                                        <label className="flex cursor-pointer items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selected}
                                                                onChange={() =>
                                                                    toggleMember(member.memberid)
                                                                }
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />

                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                                                    Member ID: {member.memberid}
                                                                </span>
                                                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                                    {assignedRoles.length} role(s) assigned
                                                                </span>
                                                            </span>

                                                            {selected && (
                                                                <Check
                                                                    size={17}
                                                                    className="text-blue-600 dark:text-blue-400"
                                                                />
                                                            )}
                                                        </label>

                                                        {selected && (
                                                            <div className="ml-7 mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                                    Available Roles
                                                                </p>

                                                                {roles.length === 0 ? (
                                                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                                                        No roles were returned for this project.
                                                                    </p>
                                                                ) : (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {roles.map((role) => {
                                                                            const roleSelected =
                                                                                assignedRoles.includes(role.rollid);

                                                                            return (
                                                                                <label
                                                                                    key={role.rollid}
                                                                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${roleSelected
                                                                                            ? "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                                                                            : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                                                                                        }`}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={roleSelected}
                                                                                        onChange={() =>
                                                                                            toggleRole(
                                                                                                member.memberid,
                                                                                                role.rollid,
                                                                                            )
                                                                                        }
                                                                                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                                                                                    />
                                                                                    {role.rolename}
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {assignedRoles.length > 0 && (
                                                                    <div className="mt-3 space-y-2">
                                                                        {roles
                                                                            .filter((role) =>
                                                                                assignedRoles.includes(role.rollid),
                                                                            )
                                                                            .map((role) => (
                                                                                <div
                                                                                    key={role.rollid}
                                                                                    className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                                                                                >
                                                                                    <Folder
                                                                                        size={14}
                                                                                        className="mt-0.5 shrink-0"
                                                                                    />
                                                                                    <p>
                                                                                        <span className="font-medium">
                                                                                            {role.rolename}:
                                                                                        </span>{" "}
                                                                                        {role.folder_access?.length
                                                                                            ? role.folder_access
                                                                                                .map(
                                                                                                    (folder) => folder.fname,
                                                                                                )
                                                                                                .join(", ")
                                                                                            : "No folder access details"}
                                                                                    </p>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {filteredMembers.length === 0 && (
                                                <p className="py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No member IDs match your search.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selected members panel */}
                                    <aside className="min-w-0 self-start rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Selected Members
                                            </h3>

                                            <span className="rounded-full bg-white px-2 py-0.5 text-xs dark:bg-gray-800 dark:text-gray-200">
                                                {selectedMemberDetails.length}
                                            </span>
                                        </div>

                                        {selectedMemberDetails.length === 0 ? (
                                            <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                                Selected members will appear here.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedMemberDetails.map((member) => {
                                                    const assignedRoles =
                                                        assignmentsByMember[member.memberid] ?? [];

                                                    const roleNames = roles.filter((role) =>
                                                        assignedRoles.includes(role.rollid),
                                                    );

                                                    return (
                                                        <div
                                                            key={member.memberid}
                                                            className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    Member ID: {member.memberid}
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeMember(member.memberid)
                                                                    }
                                                                    aria-label={`Remove member ${member.memberid}`}
                                                                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                                >
                                                                    <X size={15} />
                                                                </button>
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {roleNames.length > 0 ? (
                                                                    roleNames.map((role) => (
                                                                        <span
                                                                            key={role.rollid}
                                                                            className="rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                                                        >
                                                                            {role.rolename}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                                                        No role assigned
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </aside>
                                </div>
                            )}
                        </section>

                        {/* Feedback */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                role="status"
                                className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                            >
                                {success}
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedMembers.length} member(s) selected
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving || members.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            {saving ? "Saving..." : "Save Setup"}
                        </button>
                    </div>
                </footer>
            </form>
        </div>
    );
}
