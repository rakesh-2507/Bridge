import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Folder,
    Loader2,
    Save,
    Users,
    X,
} from "lucide-react";

import {
    getCoordinatorProjects,
    setupCoordinatorProject,
    getProjectFolderTimeline,
    saveProjectFolderTimeline,
    getProjectFolderProgress,
    type Project,
    type ProjectAssignment,
    type ProjectMember,
    type ProjectRole,
    type CoordinatorProjectsResponse,
    type ProjectFolderTimelineItem,
    type SaveProjectFolderTimelinePayload,
    type FolderProgress,
} from "../api/projects";

function normalizeProjects(
    response: CoordinatorProjectsResponse,
): Project[] {
    return Array.isArray(response) ? response : response.projects ?? [];
}

function getProjectMembers(project: Project | null): ProjectMember[] {
    if (!project) return [];

    if (project.members?.length) return project.members;

    return (project.member_ids ?? []).map((memberid) => ({
        memberid,
        assigned_role_ids: [],
    }));
}

function formatDate(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function getTodayDate(): string {
    return formatDate(new Date());
}

function isContainerFolder(
    folder: ProjectFolderTimelineItem,
    folders: ProjectFolderTimelineItem[],
): boolean {
    return folders.some(
        (item) => item.parent_fid === folder.fid,
    );
}

function isRootContainer(
    folder: ProjectFolderTimelineItem,
    folders: ProjectFolderTimelineItem[],
): boolean {
    return (
        Boolean(folder.is_top_level) &&
        isContainerFolder(folder, folders)
    );
}

function orderFoldersByHierarchy(
    folders: ProjectFolderTimelineItem[],
): ProjectFolderTimelineItem[] {
    const folderIds = new Set(folders.map((folder) => folder.fid));
    const childrenByParent = new Map<
        number | null,
        ProjectFolderTimelineItem[]
    >();

    for (const folder of folders) {
        const parentId =
            folder.parent_fid != null && folderIds.has(folder.parent_fid)
                ? folder.parent_fid
                : null;

        const siblings = childrenByParent.get(parentId) ?? [];
        siblings.push(folder);
        childrenByParent.set(parentId, siblings);
    }

    const result: ProjectFolderTimelineItem[] = [];
    const visited = new Set<number>();

    const visit = (folder: ProjectFolderTimelineItem) => {
        if (visited.has(folder.fid)) return;

        visited.add(folder.fid);
        result.push(folder);

        for (const child of childrenByParent.get(folder.fid) ?? []) {
            visit(child);
        }
    };

    for (const root of childrenByParent.get(null) ?? []) {
        visit(root);
    }

    for (const folder of folders) {
        visit(folder);
    }

    return result;
}

function getFolderDepth(
    folder: ProjectFolderTimelineItem,
    folders: ProjectFolderTimelineItem[],
): number {
    const foldersById = new Map(folders.map((item) => [item.fid, item]));
    const visited = new Set<number>([folder.fid]);

    let depth = 0;
    let parentId = folder.parent_fid;

    while (parentId != null && !visited.has(parentId)) {
        const parent = foldersById.get(parentId);
        if (!parent) break;

        visited.add(parentId);
        depth += 1;
        parentId = parent.parent_fid;
    }

    return depth;
}

interface CalculatedDates {
    start: string;
    end: string;
}

function calculateFolderDates(
    folder: ProjectFolderTimelineItem,
    folders: ProjectFolderTimelineItem[],
    projectStartDate: string,
    visiting: Set<number> = new Set<number>(),
): CalculatedDates {
    if (!projectStartDate || visiting.has(folder.fid)) {
        return { start: "", end: "" };
    }

    const nextVisiting = new Set(visiting);
    nextVisiting.add(folder.fid);

    // Find direct children.
    const children = folders.filter(
        (item) => item.parent_fid === folder.fid,
    );

    // Parent folder: calculate dates from its children.
    if (children.length > 0) {
        const childDates = children
            .map((child) =>
                calculateFolderDates(
                    child,
                    folders,
                    projectStartDate,
                    nextVisiting,
                ),
            )
            .filter((dates) => dates.start && dates.end);

        if (childDates.length === 0) {
            return { start: "", end: "" };
        }

        const starts = childDates.map((dates) => dates.start);
        const ends = childDates.map((dates) => dates.end);

        return {
            start: starts.sort()[0],
            end: ends.sort()[ends.length - 1] ?? "",
        };
    }

    // Leaf folder: calculate using manual duration and predecessor.
    const days = Number(folder.days);

    if (!Number.isInteger(days) || days < 1) {
        return { start: "", end: "" };
    }

    let startDate = new Date(`${projectStartDate}T00:00:00`);

    if (folder.predecessorsid) {
        const predecessor = folders.find(
            (item) => item.fid === folder.predecessorsid,
        );

        if (!predecessor) {
            return { start: "", end: "" };
        }

        const predecessorDates = calculateFolderDates(
            predecessor,
            folders,
            projectStartDate,
            nextVisiting,
        );

        if (!predecessorDates.end) {
            return { start: "", end: "" };
        }

        startDate = new Date(`${predecessorDates.end}T00:00:00`);
        startDate.setDate(startDate.getDate() + 1);
    } else {
        startDate.setDate(startDate.getDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);

    return {
        start: formatDate(startDate),
        end: formatDate(endDate),
    };
}

type SetupStep = 1 | 2;


export default function CoordinatorProjectSetup() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const [step, setStep] = useState<SetupStep>(1);
    const [setupSaved, setSetupSaved] = useState(false);

    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [assignmentsByMember, setAssignmentsByMember] = useState<
        Record<number, number[]>
    >({});

    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [timelineStartDate, setTimelineStartDate] = useState("");
    const [timelineFolders, setTimelineFolders] = useState<
        ProjectFolderTimelineItem[]
    >([]);

    const [selectedProgressFolder, setSelectedProgressFolder] =
        useState<ProjectFolderTimelineItem | null>(null);
    const [folderProgress, setFolderProgress] =
        useState<FolderProgress | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressError, setProgressError] = useState("");

    const progressPercentage = Math.min(
        100,
        Math.max(
            0,
            Number(folderProgress?.progress_percentage ?? 0) || 0,
        ),
    );

    const progressStatus = String(
        folderProgress?.status ??
        selectedProgressFolder?.status ??
        "0",
    );

    const progressStatusLabel =
        progressStatus === "2" ||
            progressStatus.toLowerCase() === "completed"
            ? "Completed"
            : progressStatus === "1" ||
                progressStatus.toLowerCase() === "in progress"
                ? "In Progress"
                : progressStatus === "0" ||
                    progressStatus.toLowerCase() === "pending"
                    ? "Pending"
                    : progressStatus;

    const progressKeyPerson = selectedProgressFolder?.key_person_options.find(
        (person) => person.uid === selectedProgressFolder.keypersonid,
    );

    const progressUserName = progressKeyPerson
        ? [
            progressKeyPerson.firstname,
            progressKeyPerson.lastname,
        ]
            .filter(Boolean)
            .join(" ") || progressKeyPerson.loginname
        : "Unassigned";

    const fetchProject = useCallback(
        async (cancelled?: () => boolean) => {
            if (!projectId || !Number.isFinite(Number(projectId))) {
                if (cancelled?.()) return;

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

                if (cancelled?.()) return;

                const projects = normalizeProjects(response);
                const foundProject =
                    projects.find(
                        (item) =>
                            String(item.project_id) === String(projectId),
                    ) ?? null;

                if (!foundProject) {
                    setProject(null);
                    setError(
                        "Project not found in your assigned projects. Please return to the projects list.",
                    );
                    return;
                }

                setProject(foundProject);

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
                setSetupSaved(false);
                setStep(1);
                setTimelineStartDate("");
                setTimelineFolders([]);
            } catch (err) {
                if (cancelled?.()) return;

                console.error("Failed to load coordinator project:", err);
                setProject(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load project details. Please try again.",
                );
            } finally {
                if (!cancelled?.()) setLoading(false);
            }
        },
        [projectId],
    );

    useEffect(() => {
        let cancelled = false;

        const timeoutId = window.setTimeout(() => {
            void fetchProject(() => cancelled);
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [fetchProject]);

    const members = getProjectMembers(project);
    const roles: ProjectRole[] = project?.available_roles ?? [];

    const filteredMembers = members.filter((member) =>
        String(member.memberid).includes(search.trim()),
    );

    const selectedMemberDetails = members.filter((member) =>
        selectedMembers.includes(member.memberid),
    );

    const handleBack = () => navigate("/dashboard");

    const goToPreviousStep = () => {
        setError("");
        setSuccess("");
        setStep(1);
    };

    const toggleMember = (memberId: number) => {
        setError("");
        setSuccess("");
        setSetupSaved(false);

        setSelectedMembers((previous) =>
            previous.includes(memberId)
                ? previous.filter((id) => id !== memberId)
                : [...previous, memberId],
        );
    };

    const toggleRole = (memberId: number, roleId: number) => {
        setError("");
        setSuccess("");
        setSetupSaved(false);

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
        setSetupSaved(false);
    };

    const removeMember = (memberId: number) => {
        setSelectedMembers((previous) =>
            previous.filter((id) => id !== memberId),
        );

        setError("");
        setSuccess("");
        setSetupSaved(false);
    };

    const loadTimeline = async () => {
        if (!project) {
            setError("Project details are not available.");
            return;
        }

        setTimelineLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await getProjectFolderTimeline(
                project.project_id,
            );

            setTimelineStartDate(
                response.project_start_date?.slice(0, 10) ||
                getTodayDate(),
            );

            const normalizedFolders = (response.folders ?? []).map(
                (folder) => ({
                    ...folder,
                    parent_fid: folder.parent_fid ?? null,
                    is_parent: folder.is_parent ?? false,
                    remarks: folder.remarks ?? "",
                    status: folder.status ?? "0",
                    predecessorsid: folder.predecessorsid ?? null,
                    key_person_options: folder.key_person_options ?? [],
                }),
            );

            setTimelineFolders(
                orderFoldersByHierarchy(normalizedFolders),
            );

            setStep(2);
            setSuccess("Project setup saved. Review the folder timeline.");
        } catch (err) {
            console.error("Failed to load folder timeline:", err);

            setError(
                err instanceof Error
                    ? `Project setup was saved, but the timeline could not be loaded: ${err.message}`
                    : "Project setup was saved, but the timeline could not be loaded. Please try again.",
            );
        } finally {
            setTimelineLoading(false);
        }
    };

    const handleViewProgress = async (
        folder: ProjectFolderTimelineItem,
    ) => {
        if (!project) {
            setProgressError("Project details are not available.");
            return;
        }

        setSelectedProgressFolder(folder);
        setFolderProgress(null);
        setProgressError("");
        setProgressLoading(true);

        try {
            const response = await getProjectFolderProgress(
                project.project_id,
                folder.fid,
            );

            setFolderProgress(response);
        } catch (err) {
            console.error("Failed to load folder progress:", err);

            setProgressError(
                err instanceof Error
                    ? err.message
                    : "Failed to load folder progress. Please try again.",
            );
        } finally {
            setProgressLoading(false);
        }
    };

    const closeProgressModal = () => {
        setSelectedProgressFolder(null);
        setFolderProgress(null);
        setProgressError("");
        setProgressLoading(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!project) {
            setError("Project details are not available.");
            return;
        }

        if (selectedMembers.length === 0) {
            setError("Please select at least one member.");
            return;
        }

        if (roles.length === 0) {
            setError("No roles are available for this project.");
            return;
        }

        const membersByRole: Record<number, number[]> = {};

        for (const memberId of selectedMembers) {
            const roleIds = assignmentsByMember[memberId] ?? [];

            if (roleIds.length === 0) {
                setError(
                    `Please assign at least one role to Member ID ${memberId}.`,
                );
                return;
            }

            for (const roleId of roleIds) {
                if (!roles.some((role) => role.rollid === roleId)) {
                    setError(
                        `An invalid role is assigned to Member ID ${memberId}. Please review the role selection.`,
                    );
                    return;
                }

                membersByRole[roleId] ??= [];

                if (!membersByRole[roleId].includes(memberId)) {
                    membersByRole[roleId].push(memberId);
                }
            }
        }

        const assignments: ProjectAssignment[] = Object.entries(
            membersByRole,
        ).map(([roleId, memberIds]) => ({
            member_ids: memberIds,
            rollid: Number(roleId),
        }));

        if (assignments.length === 0) {
            setError(
                "Please assign at least one role to the selected members.",
            );
            return;
        }

        setSaving(true);

        try {
            if (!setupSaved) {
                await setupCoordinatorProject(project.project_id, {
                    assignments,
                });

                setSetupSaved(true);
            }

            await loadTimeline();
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

    const updateTimelineFolder = (
        fid: number,
        changes: Partial<ProjectFolderTimelineItem>,
    ) => {
        setTimelineFolders((previous) =>
            previous.map((folder) =>
                folder.fid === fid ? { ...folder, ...changes } : folder,
            ),
        );

        setError("");
        setSuccess("");
    };

    const handleSaveTimeline = async () => {
        if (!project) {
            setError("Project details are not available.");
            return;
        }

        if (!timelineStartDate) {
            setError("Please select a project start date.");
            return;
        }

        // Only folders without children require duration.
        const leafFolders = timelineFolders.filter(
            (folder) =>
                !isContainerFolder(folder, timelineFolders),
        );

        if (leafFolders.length === 0) {
            setError("No schedulable folders are available.");
            return;
        }

        const leafIds = new Set(
            leafFolders.map((folder) => folder.fid),
        );

        // Validate duration for leaf folders.
        for (const folder of leafFolders) {
            if (
                !Number.isInteger(Number(folder.days)) ||
                Number(folder.days) < 1
            ) {
                setError(
                    `Enter a valid duration of at least one day for "${folder.fname}".`,
                );
                return;
            }
        }

        // Validate predecessors for all editable rows.
        for (const folder of timelineFolders) {
            const rootContainer = isRootContainer(
                folder,
                timelineFolders,
            );

            if (rootContainer || !folder.predecessorsid) {
                continue;
            }

            if (
                folder.predecessorsid === folder.fid ||
                !leafIds.has(folder.predecessorsid)
            ) {
                setError(
                    `Choose a valid predecessor for "${folder.fname}".`,
                );
                return;
            }
        }

        // Validate calculated dates for leaf folders.
        for (const folder of leafFolders) {
            const dates = calculateFolderDates(
                folder,
                timelineFolders,
                timelineStartDate,
            );

            if (!dates.start || !dates.end) {
                setError(
                    `The timeline dependency for "${folder.fname}" is invalid. Check its predecessor and ensure there are no circular dependencies.`,
                );
                return;
            }
        }

        const payload: SaveProjectFolderTimelinePayload = {
            start_date: timelineStartDate,

            folders: timelineFolders.map((folder) => {
                const container = isContainerFolder(
                    folder,
                    timelineFolders,
                );

                const rootContainer = isRootContainer(
                    folder,
                    timelineFolders,
                );

                return {
                    fid: folder.fid,

                    // Main: hidden.
                    // Novel / Story / leaves: preserve predecessor.
                    predecessorsid: rootContainer
                        ? null
                        : folder.predecessorsid || null,

                    // Containers get no manual duration.
                    days: container
                        ? null
                        : Number(folder.days),

                    // Main: hidden.
                    // Novel / Story / leaves: preserve key person.
                    keypersonid: rootContainer
                        ? null
                        : folder.keypersonid || null,

                    // Main: hidden.
                    // Novel / Story / leaves: preserve remarks.
                    remarks: rootContainer
                        ? ""
                        : folder.remarks ?? "",
                };
            }),
        };

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await saveProjectFolderTimeline(
                project.project_id,
                payload,
            );

            setSuccess("Folder timeline saved successfully.");
        } catch (error) {
            console.error("Failed to save folder timeline:", error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save folder timeline.",
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white";

    if (loading) {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2
                        size={30}
                        className="animate-spin text-primary"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Loading project details...
                    </p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-full min-h-[300px] items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
                <div className="w-full max-w-md  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
                    <AlertCircle
                        size={32}
                        className="mx-auto mb-3 text-red-500"
                    />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Unable to Open Project
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {error ||
                            "The requested project could not be found."}
                    </p>

                    <div className="mt-5 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => void fetchProject()}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Retry
                        </button>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                            Back to Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-950">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        aria-label="Back to projects"
                        className="flex h-9 w-9 shrink-0 items-center justify-center  rounded-tl-xl rounded-br-xl   border border-gray-200 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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

                <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/10 dark:text-blue-300">
                        Step {step} of 2
                    </span>
                    <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:inline-flex">
                        {selectedMembers.length} selected
                    </span>
                </div>
            </header>

            <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
            >
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="mx-auto flex flex-col gap-5">
                        {step === 1 && (
                            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Users
                                        size={19}
                                        className="text-primary dark:text-primary"
                                    />
                                    <div>
                                        <h2 className="font-semibold text-gray-900 dark:text-white">
                                            Team Members &amp; Roles
                                        </h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Select members and assign one or
                                            more roles.
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
                                            No project members were returned
                                            by the API.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                                        <div className="min-w-0">
                                            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                                                <input
                                                    type="search"
                                                    value={search}
                                                    onChange={(event) =>
                                                        setSearch(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Search by member ID..."
                                                    aria-label="Search members by ID"
                                                    className="min-w-0 flex-1  rounded-tl-xl rounded-br-xl   border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={toggleAllVisible}
                                                    className="shrink-0  rounded-tl-xl rounded-br-xl   border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                                >
                                                    {filteredMembers.length > 0 &&
                                                        filteredMembers.every(
                                                            (member) =>
                                                                selectedMembers.includes(
                                                                    member.memberid,
                                                                ),
                                                        )
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {filteredMembers.map(
                                                    (member) => {
                                                        const selected =
                                                            selectedMembers.includes(
                                                                member.memberid,
                                                            );
                                                        const assignedRoles =
                                                            assignmentsByMember[
                                                            member.memberid
                                                            ] ?? [];

                                                        return (
                                                            <div
                                                                key={
                                                                    member.memberid
                                                                }
                                                                className={`rounded-lg border p-3 ${selected
                                                                    ? "border-blue-300 bg-primary/5/50 dark:border-blue-800 dark:bg-primary/10/20"
                                                                    : "border-gray-200 dark:border-gray-800"
                                                                    }`}
                                                            >
                                                                <label className="flex cursor-pointer items-center gap-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            selected
                                                                        }
                                                                        onChange={() =>
                                                                            toggleMember(
                                                                                member.memberid,
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                    />
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                                                                            Member
                                                                            ID:{" "}
                                                                            {
                                                                                member.memberid
                                                                            }
                                                                        </span>
                                                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                                            {
                                                                                assignedRoles.length
                                                                            }{" "}
                                                                            role(s)
                                                                            assigned
                                                                        </span>
                                                                    </span>
                                                                    {selected && (
                                                                        <Check
                                                                            size={
                                                                                17
                                                                            }
                                                                            className="text-primary dark:text-primary"
                                                                        />
                                                                    )}
                                                                </label>

                                                                {selected && (
                                                                    <div className="ml-7 mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                                                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                                            Available
                                                                            Roles
                                                                        </p>

                                                                        {roles.length ===
                                                                            0 ? (
                                                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                                                No
                                                                                roles
                                                                                were
                                                                                returned
                                                                                for
                                                                                this
                                                                                project.
                                                                            </p>
                                                                        ) : (
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {roles.map(
                                                                                    (
                                                                                        role,
                                                                                    ) => {
                                                                                        const roleSelected =
                                                                                            assignedRoles.includes(
                                                                                                role.rollid,
                                                                                            );

                                                                                        return (
                                                                                            <label
                                                                                                key={
                                                                                                    role.rollid
                                                                                                }
                                                                                                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${roleSelected
                                                                                                    ? "border-blue-300 bg-primary/10 text-blue-800 dark:border-blue-800 dark:bg-primary/10 dark:text-blue-200"
                                                                                                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                                                                                                    }`}
                                                                                            >
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={
                                                                                                        roleSelected
                                                                                                    }
                                                                                                    onChange={() =>
                                                                                                        toggleRole(
                                                                                                            member.memberid,
                                                                                                            role.rollid,
                                                                                                        )
                                                                                                    }
                                                                                                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary"
                                                                                                />
                                                                                                {
                                                                                                    role.rolename
                                                                                                }
                                                                                            </label>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {assignedRoles.length >
                                                                            0 && (
                                                                                <div className="mt-3 space-y-2">
                                                                                    {roles
                                                                                        .filter(
                                                                                            (
                                                                                                role,
                                                                                            ) =>
                                                                                                assignedRoles.includes(
                                                                                                    role.rollid,
                                                                                                ),
                                                                                        )
                                                                                        .map(
                                                                                            (
                                                                                                role,
                                                                                            ) => (
                                                                                                <div
                                                                                                    key={
                                                                                                        role.rollid
                                                                                                    }
                                                                                                    className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                                                                                                >
                                                                                                    <Folder
                                                                                                        size={
                                                                                                            14
                                                                                                        }
                                                                                                        className="mt-0.5 shrink-0"
                                                                                                    />
                                                                                                    <p>
                                                                                                        <span className="font-medium">
                                                                                                            {
                                                                                                                role.rolename
                                                                                                            }

                                                                                                            :
                                                                                                        </span>{" "}
                                                                                                        {role
                                                                                                            .folder_access
                                                                                                            ?.length
                                                                                                            ? role.folder_access
                                                                                                                .map(
                                                                                                                    (
                                                                                                                        folder,
                                                                                                                    ) =>
                                                                                                                        folder.fname,
                                                                                                                )
                                                                                                                .join(
                                                                                                                    ", ",
                                                                                                                )
                                                                                                            : "No folder access details"}
                                                                                                    </p>
                                                                                                </div>
                                                                                            ),
                                                                                        )}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    },
                                                )}

                                                {filteredMembers.length ===
                                                    0 && (
                                                        <p className="py-5 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            No member IDs match your
                                                            search.
                                                        </p>
                                                    )}
                                            </div>
                                        </div>

                                        <aside className="min-w-0 self-start  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Selected Members
                                                </h3>
                                                <span className="rounded-full bg-white px-2 py-0.5 text-xs dark:bg-gray-800 dark:text-gray-200">
                                                    {
                                                        selectedMemberDetails.length
                                                    }
                                                </span>
                                            </div>

                                            {selectedMemberDetails.length ===
                                                0 ? (
                                                <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                                    Selected members will appear
                                                    here.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedMemberDetails.map(
                                                        (member) => {
                                                            const assignedRoles =
                                                                assignmentsByMember[
                                                                member.memberid
                                                                ] ?? [];
                                                            const roleNames =
                                                                roles.filter(
                                                                    (role) =>
                                                                        assignedRoles.includes(
                                                                            role.rollid,
                                                                        ),
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        member.memberid
                                                                    }
                                                                    className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            Member
                                                                            ID:{" "}
                                                                            {
                                                                                member.memberid
                                                                            }
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeMember(
                                                                                    member.memberid,
                                                                                )
                                                                            }
                                                                            aria-label={`Remove member ${member.memberid}`}
                                                                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                                        >
                                                                            <X
                                                                                size={
                                                                                    15
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </div>

                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                        {roleNames.length >
                                                                            0 ? (
                                                                            roleNames.map(
                                                                                (
                                                                                    role,
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            role.rollid
                                                                                        }
                                                                                        className="rounded bg-primary/5 px-2 py-1 text-[11px] text-primary dark:bg-primary/10 dark:text-blue-300"
                                                                                    >
                                                                                        {
                                                                                            role.rolename
                                                                                        }
                                                                                    </span>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                                                                No
                                                                                role
                                                                                assigned
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </aside>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* STEP 2: Folder timeline */}
                        {step === 2 && (
                            <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-2">
                                        <Clock
                                            size={20}
                                            className="mt-0.5 text-primary dark:text-primary"
                                        />
                                        <div>
                                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                                Folder Timeline
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Parent folders are containers.
                                                Configure timeline values on
                                                folders without children.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={goToPreviousStep}
                                        className="inline-flex items-center justify-center gap-1 self-start  rounded-tl-xl rounded-br-xl   border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        <ChevronLeft size={16} />
                                        Previous Step
                                    </button>
                                </div>

                                <div className="mb-5 max-w-xs">
                                    <label
                                        htmlFor="timeline-start-date"
                                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Project Start Date *
                                    </label>
                                    <input
                                        id="timeline-start-date"
                                        type="date"
                                        required
                                        value={timelineStartDate}
                                        onChange={(event) => {
                                            setTimelineStartDate(
                                                event.target.value,
                                            );
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="w-full  rounded-tl-xl rounded-br-xl   border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                {timelineLoading ? (
                                    <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-500 dark:text-gray-400">
                                        <Loader2
                                            size={22}
                                            className="animate-spin text-primary"
                                        />
                                        Loading folder timeline...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto  rounded-tl-xl rounded-br-xl   border border-gray-200 dark:border-gray-700">
                                        <table className="w-full min-w-[1250px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    {[
                                                        "Folder ID",
                                                        "Folder / Subfolder",
                                                        "Predecessor",
                                                        "Duration (days)",
                                                        "Start Date",
                                                        "End Date",
                                                        "Key Person",
                                                        "Remarks",
                                                        "Status",
                                                    ].map((heading) => (
                                                        <th
                                                            key={heading}
                                                            className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300"
                                                        >
                                                            {heading}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                {timelineFolders.map(
                                                    (folder) => {
                                                        const container = isContainerFolder(
                                                            folder,
                                                            timelineFolders,
                                                        );

                                                        const rootContainer = isRootContainer(
                                                            folder,
                                                            timelineFolders,
                                                        );
                                                        const dates = calculateFolderDates(
                                                            folder,
                                                            timelineFolders,
                                                            timelineStartDate,
                                                        );
                                                        const depth =
                                                            getFolderDepth(
                                                                folder,
                                                                timelineFolders,
                                                            );

                                                        const predecessorOptions = timelineFolders.filter(
                                                            (candidate) =>
                                                                candidate.fid !== folder.fid &&
                                                                !isContainerFolder(candidate, timelineFolders),
                                                        );

                                                        return (
                                                            <tr
                                                                key={folder.fid}
                                                            >
                                                                <td className="whitespace-nowrap px-4 py-2 text-gray-500 dark:text-gray-400">
                                                                    {folder.fid}
                                                                </td>

                                                                {/* Hierarchical folder column */}
                                                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                                                    <div
                                                                        className="flex min-w-[220px] items-center gap-2"
                                                                        style={{
                                                                            paddingLeft: `${depth * 24}px`,
                                                                        }}
                                                                    >
                                                                        <Folder
                                                                            size={
                                                                                16
                                                                            }
                                                                            className={`shrink-0 ${container
                                                                                ? "text-primary dark:text-primary"
                                                                                : "text-gray-400 dark:text-gray-500"
                                                                                }`}
                                                                        />
                                                                        <span>
                                                                            {
                                                                                folder.fname
                                                                            }
                                                                        </span>
                                                                        {container && (
                                                                            <span className="whitespace-nowrap rounded bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/10 dark:text-blue-300">
                                                                                Container
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Predecessor */}
                                                                <td className="px-4 py-2">
                                                                    {!rootContainer ? (
                                                                        <select
                                                                            value={folder.predecessorsid ?? 0}
                                                                            onChange={(event) =>
                                                                                updateTimelineFolder(folder.fid, {
                                                                                    predecessorsid:
                                                                                        Number(event.target.value) || null,
                                                                                })
                                                                            }
                                                                            aria-label={`Predecessor for ${folder.fname}`}
                                                                            className={`${inputClass} w-48 !py-1`}
                                                                        >
                                                                            <option value={0}>None</option>

                                                                            {predecessorOptions.map((candidate) => (
                                                                                <option
                                                                                    key={candidate.fid}
                                                                                    value={candidate.fid}
                                                                                >
                                                                                    {candidate.fname} (ID: {candidate.fid})
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <span className="text-gray-400"></span>
                                                                    )}
                                                                </td>

                                                                {/* Duration */}
                                                                <td className="px-4 py-2">
                                                                    {!container ? (
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            step={1}
                                                                            value={folder.days ?? ""}
                                                                            onChange={(event) =>
                                                                                updateTimelineFolder(folder.fid, {
                                                                                    days:
                                                                                        event.target.value === ""
                                                                                            ? null
                                                                                            : Number(event.target.value),
                                                                                })
                                                                            }
                                                                            aria-label={`Duration for ${folder.fname}`}
                                                                            className={`${inputClass} w-24 !py-1`}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-400"></span>
                                                                    )}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                                                                    {!rootContainer ? dates.start || "" : ""}
                                                                </td>

                                                                <td className="whitespace-nowrap px-4 py-2 text-gray-600 dark:text-gray-300">
                                                                    {!rootContainer ? dates.end || "" : ""}
                                                                </td>

                                                                <td className="px-4 py-2">
                                                                    {!rootContainer ? (
                                                                        <select
                                                                            value={folder.keypersonid ?? 0}
                                                                            onChange={(event) =>
                                                                                updateTimelineFolder(folder.fid, {
                                                                                    keypersonid:
                                                                                        Number(event.target.value) || null,
                                                                                })
                                                                            }
                                                                            aria-label={`Key person for ${folder.fname}`}
                                                                            className={`${inputClass} w-48 !py-1`}
                                                                        >
                                                                            <option value={0}>Unassigned</option>

                                                                            {folder.key_person_options.map((person) => (
                                                                                <option
                                                                                    key={person.uid}
                                                                                    value={person.uid}
                                                                                >
                                                                                    {[
                                                                                        person.firstname,
                                                                                        person.lastname,
                                                                                    ]
                                                                                        .filter(Boolean)
                                                                                        .join(" ") || person.loginname}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    ) : (
                                                                        <span className="text-gray-400"></span>
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-2">
                                                                    {!rootContainer ? (
                                                                        <input
                                                                            type="text"
                                                                            value={folder.remarks ?? ""}
                                                                            onChange={(event) =>
                                                                                updateTimelineFolder(folder.fid, {
                                                                                    remarks: event.target.value,
                                                                                })
                                                                            }
                                                                            aria-label={`Remarks for ${folder.fname}`}
                                                                            placeholder="Enter remarks"
                                                                            className={`${inputClass} w-52 !py-1`}
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-400"></span>
                                                                    )}
                                                                </td>

                                                                {/* Status */}
                                                                <td className="px-4 py-2">
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            String(
                                                                                folder.status,
                                                                            ) !==
                                                                            "1"
                                                                        }
                                                                        onClick={() =>
                                                                            void handleViewProgress(
                                                                                folder,
                                                                            )
                                                                        }
                                                                        aria-label={`View progress and notes for ${folder.fname}`}
                                                                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition ${String(
                                                                            folder.status,
                                                                        ) ===
                                                                            "0"
                                                                            ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                                            : String(
                                                                                folder.status,
                                                                            ) ===
                                                                                "1"
                                                                                ? "cursor-pointer bg-orange-50 text-orange-700 hover:bg-orange-100 hover:ring-2 hover:ring-primary/30 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
                                                                                : String(
                                                                                    folder.status,
                                                                                ) ===
                                                                                    "2"
                                                                                    ? "cursor-default bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                                            }`}
                                                                    >
                                                                        {String(
                                                                            folder.status,
                                                                        ) ===
                                                                            "0"
                                                                            ? "Pending"
                                                                            : String(
                                                                                folder.status,
                                                                            ) ===
                                                                                "1"
                                                                                ? "In Progress"
                                                                                : String(
                                                                                    folder.status,
                                                                                ) ===
                                                                                    "2"
                                                                                    ? "Completed"
                                                                                    : "Unknown"}

                                                                        {String(
                                                                            folder.status,
                                                                        ) ===
                                                                            "1" && (
                                                                                <span className="ml-1.5">
                                                                                    ↗
                                                                                </span>
                                                                            )}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}

                                                {timelineFolders.length ===
                                                    0 && (
                                                        <tr>
                                                            <td
                                                                colSpan={9}
                                                                className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                                                            >
                                                                No folders were
                                                                returned for this
                                                                project.
                                                            </td>
                                                        </tr>
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    Dates are calculated from the project start
                                    date, duration, and predecessor. Folders
                                    with children are displayed as containers
                                    and are not independently scheduled.
                                </p>
                            </section>
                        )}

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
                        {step === 1
                            ? `${selectedMembers.length} member(s) selected`
                            : `${timelineFolders.length} folder(s) in timeline`}
                    </span>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={saving || timelineLoading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        {step === 1 ? (
                            <button
                                type="submit"
                                disabled={
                                    saving ||
                                    timelineLoading ||
                                    members.length === 0
                                }
                                className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving || timelineLoading ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <ChevronRight size={16} />
                                )}
                                {saving || timelineLoading
                                    ? "Saving..."
                                    : setupSaved
                                        ? "Load Timeline"
                                        : "Save Setup & Continue"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void handleSaveTimeline()}
                                disabled={saving || timelineLoading}
                                className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saving ? "Saving..." : "Save Timeline"}
                            </button>
                        )}
                    </div>
                </footer>
            </form>

            {/* User Progress Modal */}
            {selectedProgressFolder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={closeProgressModal}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="progress-modal-title"
                        className="w-full max-w-lg overflow-hidden  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-gray-200 bg-orange-50/70 p-5 dark:border-gray-800 dark:bg-orange-950/20">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center  rounded-tl-xl rounded-br-xl   bg-primary/10 text-primary">
                                    <Clock size={22} />
                                </div>

                                <div className="min-w-0">
                                    <h2
                                        id="progress-modal-title"
                                        className="text-lg font-semibold text-gray-900 dark:text-white"
                                    >
                                        User Progress
                                    </h2>

                                    <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                                        {selectedProgressFolder.fname}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeProgressModal}
                                aria-label="Close progress modal"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="space-y-6 p-5">
                            {progressLoading ? (
                                <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
                                    <Loader2
                                        size={32}
                                        className="animate-spin text-primary"
                                    />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Loading user progress...
                                    </p>
                                </div>
                            ) : progressError ? (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950"
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertCircle
                                            size={20}
                                            className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                                Unable to load progress
                                            </p>
                                            <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">
                                                {progressError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleViewProgress(
                                                        selectedProgressFolder,
                                                    )
                                                }
                                                className="mt-3 inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
                                            >
                                                <Loader2
                                                    size={15}
                                                    className="hidden"
                                                />
                                                Try Again
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : folderProgress ? (
                                <>
                                    {/* User and Status */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Assigned User
                                            </p>

                                            <p className="mt-2 break-words text-sm font-semibold text-gray-900 dark:text-white">
                                                {progressUserName}
                                            </p>

                                            {selectedProgressFolder.keypersonid && (
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    User ID:{" "}
                                                    {
                                                        selectedProgressFolder.keypersonid
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                Current Status
                                            </p>

                                            <span
                                                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${progressStatusLabel ===
                                                    "Completed"
                                                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                                                    : progressStatusLabel ===
                                                        "Pending"
                                                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                        : "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                                    }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${progressStatusLabel ===
                                                        "Completed"
                                                        ? "bg-green-500"
                                                        : progressStatusLabel ===
                                                            "Pending"
                                                            ? "bg-gray-400"
                                                            : "animate-pulse bg-primary"
                                                        }`}
                                                />
                                                {progressStatusLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Completion Progress
                                            </h3>

                                            <span className="text-sm font-bold text-primary">
                                                {progressPercentage}%
                                            </span>
                                        </div>

                                        <div
                                            className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                                            role="progressbar"
                                            aria-label="Folder completion progress"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={progressPercentage}
                                        >
                                            <div
                                                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${progressPercentage}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            {progressPercentage === 100
                                                ? "This task is completed."
                                                : `${progressPercentage}% completion reported by the progress API.`}
                                        </p>
                                    </div>

                                    {/* User Notes */}
                                    <div>
                                        <div className="mb-2 flex items-center gap-2">
                                            <Folder
                                                size={17}
                                                className="text-primary"
                                            />

                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                User Notes
                                            </h3>
                                        </div>

                                        <div className="min-h-[110px] whitespace-pre-wrap break-words  rounded-tl-xl rounded-br-xl   border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {folderProgress.progress_notes?.trim() ||
                                                "No notes have been added for this folder yet."}
                                        </div>
                                    </div>

                                    {/* Duration Details */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Planned Duration
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                                {selectedProgressFolder.days ??
                                                    "—"}
                                                {selectedProgressFolder.days !=
                                                    null
                                                    ? " days"
                                                    : ""}
                                            </p>
                                        </div>

                                        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Folder ID
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                                {selectedProgressFolder.fid}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
                                    <Folder
                                        size={28}
                                        className="text-gray-400"
                                    />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        No progress data available
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        The progress API did not return any
                                        progress details for this folder.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end border-t border-gray-200 p-4 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={closeProgressModal}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}