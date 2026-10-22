import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
} from "lucide-react";

// ========================================
// Types
// ========================================

interface DemoFolderAccess {
    fname: string;
}

interface DemoRole {
    rollid: number;
    rolename: string;
    folder_access: DemoFolderAccess[];
}

interface DemoMember {
    memberid: number;
    assigned_role_ids: number[];
}

interface DemoProject {
    project_id: number;
    projectname: string;
    projectdesc: string;
    members: DemoMember[];
    available_roles: DemoRole[];
}

type AssignmentsByMember = Record<number, number[]>;

interface FolderWorkflowConfig {
    predecessor: string;
    duration: string;
    startDate: string;
    endDate: string;
    keyPersonId: number | "";
}

interface WorkflowRow {
    folderName: string;
    predecessor: string;
    duration: string;
    startDate: string;
    endDate: string;
    keyPersonId: number | "";
}

// ========================================
// Mock project data
// ========================================

const MOCK_PROJECT: DemoProject = {
    project_id: 101,
    projectname: "Magazine Publishing",
    projectdesc:
        "Manage magazine content, article reviews, approvals, and final publication documents.",

    members: [
        { memberid: 201, assigned_role_ids: [1] },
        { memberid: 202, assigned_role_ids: [2] },
        { memberid: 203, assigned_role_ids: [1, 3] },
        { memberid: 204, assigned_role_ids: [] },
    ],

    available_roles: [
        {
            rollid: 1,
            rolename: "Reviewer",
            folder_access: [
                { fname: "Manuscript" },
                { fname: "Articles" },
                { fname: "Fact Checking" },
                { fname: "Copy Editing" },
                { fname: "Proofreading" },
            ],
        },
        {
            rollid: 2,
            rolename: "Approver",
            folder_access: [
                { fname: "Final Review" },
                { fname: "Legal Review" },
                { fname: "Published" },
                { fname: "Archive" },
            ],
        },
        {
            rollid: 3,
            rolename: "Editor",
            folder_access: [
                { fname: "Manuscript" },
                { fname: "Articles" },
                { fname: "Images" },
                { fname: "Captions" },
                { fname: "Copy Editing" },
                { fname: "Design" },
                { fname: "Final Review" },
                { fname: "Published" },
            ],
        },
    ],
};

// ========================================
// Initial folder selection
// ========================================

const INITIAL_SELECTED_FOLDERS: Record<number, string[]> = {
    1: [
        "Manuscript",
        "Articles",
        "Fact Checking",
        "Copy Editing",
        "Proofreading",
    ],
    2: [
        "Final Review",
        "Legal Review",
        "Published",
        "Archive",
    ],
    3: [
        "Manuscript",
        "Articles",
        "Images",
        "Captions",
        "Copy Editing",
        "Design",
        "Final Review",
        "Published",
    ],
};

const EMPTY_CONFIG: FolderWorkflowConfig = {
    predecessor: "",
    duration: "",
    startDate: "",
    endDate: "",
    keyPersonId: "",
};

// Workflow configuration is maintained once per folder.
const WORKFLOW_ROLE_ID = 0;

const configKey = (folderName: string) =>
    `${WORKFLOW_ROLE_ID}:${folderName}`;

// ========================================
// Date helpers
// ========================================

function addDays(date: string, days: number): string {
    if (!date) return "";

    const [year, month, day] = date.split("-").map(Number);
    const result = new Date(Date.UTC(year, month - 1, day));

    result.setUTCDate(result.getUTCDate() + days);

    return result.toISOString().slice(0, 10);
}

// Duration includes both the start and end dates.
// Example: October 14 + 5 days = October 18.
function calculateEndDate(
    startDate: string,
    duration: string,
): string {
    const days = Number(duration);

    if (
        !startDate ||
        duration.trim() === "" ||
        !Number.isInteger(days) ||
        days < 1
    ) {
        return "";
    }

    return addDays(startDate, days - 1);
}

// ========================================
// Component
// ========================================

export default function CoordinatorProjectSetupDemo() {
    const navigate = useNavigate();

    const [projectStartDate, setProjectStartDate] = useState("");
    const project = MOCK_PROJECT;

    const members = project.members;
    const roles = project.available_roles;

    const [step, setStep] = useState<1 | 2>(1);

    const [assignmentsByMember, setAssignmentsByMember] =
        useState<AssignmentsByMember>(() =>
            Object.fromEntries(
                members.map((member) => [
                    member.memberid,
                    [...member.assigned_role_ids],
                ]),
            ),
        );

    const [selectedFoldersByRole] = useState<
        Record<number, string[]>
    >(() =>
        Object.fromEntries(
            roles.map((role) => [
                role.rollid,
                [...(INITIAL_SELECTED_FOLDERS[role.rollid] ?? [])],
            ]),
        ),
    );

    const [workflowConfigs, setWorkflowConfigs] = useState<
        Record<string, FolderWorkflowConfig>
    >({});

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    // ========================================
    // Derived data
    // ========================================

    // Collect all unique folders accessible to at least one role.
    // The mock data contains 12 unique folders.
    const allFolders = useMemo(() => {
        const folderMap = new Map<string, DemoFolderAccess>();

        roles.forEach((role) => {
            (selectedFoldersByRole[role.rollid] ?? []).forEach(
                (folderName) => {
                    const folder = role.folder_access.find(
                        (item) => item.fname === folderName,
                    );

                    if (folder) {
                        folderMap.set(folder.fname, folder);
                    }
                },
            );
        });

        return Array.from(folderMap.values());
    }, [roles, selectedFoldersByRole]);

    const allFolderNames = useMemo(
        () => allFolders.map((folder) => folder.fname),
        [allFolders],
    );

    const totalAssignments = Object.values(
        assignmentsByMember,
    ).reduce(
        (total, assignedRoleIds) =>
            total + assignedRoleIds.length,
        0,
    );

    // ========================================
    // Role assignment
    // ========================================

    function toggleRole(memberId: number, roleId: number) {
        setAssignmentsByMember((current) => {
            const assignedRoles = current[memberId] ?? [];
            const hasRole = assignedRoles.includes(roleId);

            return {
                ...current,
                [memberId]: hasRole
                    ? assignedRoles.filter((id) => id !== roleId)
                    : [...assignedRoles, roleId],
            };
        });

        setError("");
        setSuccess("");
    }

    // ========================================
    // Workflow configuration
    // ========================================

    function recalculateFolderWorkflow(
        configs: Record<string, FolderWorkflowConfig>,
        folderNames: string[],
        startDate: string,
    ): Record<string, FolderWorkflowConfig> {
        const updated = { ...configs };

        // Repeat passes so predecessor dates are propagated
        // through the folder workflow.
        for (let pass = 0; pass < folderNames.length; pass++) {
            for (const folderName of folderNames) {
                const key = configKey(folderName);
                const current = updated[key] ?? { ...EMPTY_CONFIG };

                let calculatedStartDate =
                    current.startDate || startDate;

                if (current.predecessor) {
                    const predecessor =
                        updated[configKey(current.predecessor)];

                    calculatedStartDate = predecessor?.endDate
                        ? addDays(predecessor.endDate, 1)
                        : "";
                }

                updated[key] = {
                    ...current,
                    startDate: calculatedStartDate,
                    endDate: calculateEndDate(
                        calculatedStartDate,
                        current.duration,
                    ),
                };
            }
        }

        return updated;
    }

    function getMembersForFolder(
        folderName: string,
    ): DemoMember[] {
        const rolesWithFolderAccess = roles.filter(
            (role) =>
                (
                    selectedFoldersByRole[role.rollid] ?? []
                ).includes(folderName),
        );

        const allowedRoleIds = new Set(
            rolesWithFolderAccess.map((role) => role.rollid),
        );

        return members.filter((member) =>
            (
                assignmentsByMember[member.memberid] ?? []
            ).some((roleId) => allowedRoleIds.has(roleId)),
        );
    }

    function getConfig(
        folderName: string,
    ): FolderWorkflowConfig {
        return (
            workflowConfigs[configKey(folderName)] ??
            { ...EMPTY_CONFIG }
        );
    }

    function updateConfig(
        folderName: string,
        field: keyof FolderWorkflowConfig,
        value: string | number,
    ) {
        // Prevent self-dependencies and circular predecessor chains.
        if (
            field === "predecessor" &&
            typeof value === "string" &&
            value
        ) {
            let currentFolder = value;
            const visited = new Set<string>();

            while (currentFolder) {
                if (currentFolder === folderName) {
                    setError(
                        "A folder cannot depend on itself or create a circular workflow.",
                    );
                    return;
                }

                if (visited.has(currentFolder)) {
                    setError(
                        "This predecessor would create a circular workflow.",
                    );
                    return;
                }

                visited.add(currentFolder);

                const predecessorConfig =
                    workflowConfigs[configKey(currentFolder)];

                currentFolder =
                    predecessorConfig?.predecessor ?? "";
            }
        }

        setWorkflowConfigs((current) => {
            const key = configKey(folderName);
            const existing = current[key] ?? { ...EMPTY_CONFIG };

            const updated = {
                ...current,
                [key]: {
                    ...existing,
                    [field]: value,
                },
            };

            return recalculateFolderWorkflow(
                updated,
                allFolderNames,
                projectStartDate,
            );
        });

        setError("");
        setSuccess("");
    }

    // ========================================
    // Navigation
    // ========================================

    function handleNext() {
        if (totalAssignments === 0) {
            setError(
                "Assign at least one role to a project member.",
            );
            return;
        }

        setError("");
        setSuccess("");
        setStep(2);
    }

    function handleBack() {
        setError("");
        setSuccess("");
        setStep(1);
    }

    function handleFinish() {
        const workflowRows: WorkflowRow[] = allFolders.map(
            (folder) => {
                const config = getConfig(folder.fname);

                return {
                    folderName: folder.fname,
                    predecessor: config.predecessor,
                    duration: config.duration,
                    startDate: config.startDate,
                    endDate: config.endDate,
                    keyPersonId: config.keyPersonId,
                };
            },
        );

        console.log("Demo project setup:", {
            project_id: project.project_id,

            assignments: Object.entries(
                assignmentsByMember,
            ).flatMap(([memberId, roleIds]) =>
                roleIds.map((roleId) => ({
                    memberid: Number(memberId),
                    rollid: roleId,
                })),
            ),

            folderAccess: roles.map((role) => ({
                rollid: role.rollid,
                rolename: role.rolename,
                folders:
                    selectedFoldersByRole[role.rollid] ?? [],
            })),

            // One workflow entry per unique folder.
            folderWorkflow: workflowRows,
        });

        setError("");

        setSuccess(
            "Demo workflow configured successfully. No backend API was called.",
        );
    }

    // ========================================
    // Styling
    // ========================================

    const inputClass =
        "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-900";

    const buttonSecondary =
        "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800";

    const buttonPrimary =
        "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

    // ========================================
    // Render
    // ========================================

    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            {/* Header */}
            <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-[1800px] items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary dark:bg-primary/10 dark:text-blue-300">
                        <BriefcaseBusiness size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                            {step === 1
                                ? "Assign Roles"
                                : "Configure Folder Workflow"}
                        </h1>

                        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                            {project.projectname} · Step {step} of 2
                        </p>
                    </div>

                    <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                step === 1
                                    ? "bg-primary text-white"
                                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            }`}
                        >
                            {step === 1 ? "1" : <Check size={16} />}
                        </span>

                        <div className="h-px w-8 bg-gray-300 dark:bg-gray-700" />

                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                step === 2
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                            }`}
                        >
                            2
                        </span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1800px] p-4 sm:p-6 lg:p-8">
                    {/* Step 1: Role assignment */}
                    {step === 1 && (
                        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h2 className="font-semibold">
                                        Assign Roles
                                    </h2>

                                    <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/10 dark:text-blue-300">
                                        {roles.length} roles · {members.length} members
                                    </span>
                                </div>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Select roles for each member.
                                    Accessible folders are shown below
                                    each role.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="w-44 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                                Member
                                            </th>

                                            {roles.map((role) => (
                                                <th
                                                    key={role.rollid}
                                                    className="min-w-56 border-b border-gray-200 px-4 py-3 align-top dark:border-gray-700"
                                                >
                                                    <div className="font-semibold">
                                                        {role.rolename}
                                                    </div>

                                                    <div className="mt-2 space-y-1 font-normal">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Accessible folders
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(
                                                                selectedFoldersByRole[
                                                                    role.rollid
                                                                ] ?? []
                                                            ).length > 0 ? (
                                                                (
                                                                    selectedFoldersByRole[
                                                                        role.rollid
                                                                    ] ?? []
                                                                ).map(
                                                                    (folderName) => (
                                                                        <span
                                                                            key={folderName}
                                                                            className="rounded-md bg-primary/5 px-2 py-1 text-xs text-primary dark:bg-primary/10 dark:text-blue-300"
                                                                        >
                                                                            {folderName}
                                                                        </span>
                                                                    ),
                                                                )
                                                            ) : (
                                                                <span className="text-xs text-gray-400">
                                                                    No folders selected
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {members.map((member) => (
                                            <tr key={member.memberid}>
                                                <td className="whitespace-nowrap px-4 py-4 font-medium">
                                                    Member {member.memberid}
                                                </td>

                                                {roles.map((role) => {
                                                    const checked = (
                                                        assignmentsByMember[
                                                            member.memberid
                                                        ] ?? []
                                                    ).includes(role.rollid);

                                                    return (
                                                        <td
                                                            key={role.rollid}
                                                            className="px-4 py-4 align-top"
                                                        >
                                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    aria-label={`Assign ${role.rolename} to Member ${member.memberid}`}
                                                                    onChange={() =>
                                                                        toggleRole(
                                                                            member.memberid,
                                                                            role.rollid,
                                                                        )
                                                                    }
                                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                />

                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {checked
                                                                        ? "Assigned"
                                                                        : "Assign role"}
                                                                </span>
                                                            </label>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {totalAssignments} role assignments
                                </span>

                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {allFolders.length} unique folders
                                </span>
                            </div>
                        </section>
                    )}

                    {/* Step 2: Shared folder workflow */}
                    {step === 2 && (
                        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
                                <div className="min-w-0">
                                    <label
                                        htmlFor="project-start-date"
                                        className="block text-sm font-semibold"
                                    >
                                        Project Start Date
                                    </label>

                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Default start date for folders
                                        without a predecessor.
                                    </p>
                                </div>

                                <input
                                    id="project-start-date"
                                    type="date"
                                    value={projectStartDate}
                                    onChange={(event) => {
                                        const date = event.target.value;

                                        setProjectStartDate(date);

                                        setWorkflowConfigs((current) => {
                                            const updated = { ...current };

                                            allFolderNames.forEach(
                                                (folderName) => {
                                                    const key =
                                                        configKey(folderName);

                                                    const config =
                                                        updated[key] ?? {
                                                            ...EMPTY_CONFIG,
                                                        };

                                                    // Update the default date
                                                    // only for root folders.
                                                    if (!config.predecessor) {
                                                        updated[key] = {
                                                            ...config,
                                                            startDate: date,
                                                        };
                                                    }
                                                },
                                            );

                                            return recalculateFolderWorkflow(
                                                updated,
                                                allFolderNames,
                                                date,
                                            );
                                        });

                                        setError("");
                                        setSuccess("");
                                    }}
                                    className={`${inputClass} max-w-xs`}
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            {[
                                                "Folder",
                                                "Predecessor",
                                                "Duration",
                                                "Start date",
                                                "End date",
                                                "Key person",
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="border-b border-gray-200 px-4 py-3 font-semibold dark:border-gray-700"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {allFolders.map((folder) => {
                                            const config = getConfig(
                                                folder.fname,
                                            );

                                            const eligibleMembers =
                                                getMembersForFolder(
                                                    folder.fname,
                                                );

                                            const validKeyPerson =
                                                config.keyPersonId !== "" &&
                                                eligibleMembers.some(
                                                    (member) =>
                                                        member.memberid ===
                                                        config.keyPersonId,
                                                );

                                            return (
                                                <tr key={folder.fname}>
                                                    {/* Folder */}
                                                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                                                        {folder.fname}
                                                    </td>

                                                    {/* Predecessor */}
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={
                                                                config.predecessor
                                                            }
                                                            onChange={(event) =>
                                                                updateConfig(
                                                                    folder.fname,
                                                                    "predecessor",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className={inputClass}
                                                        >
                                                            <option value="">
                                                                No predecessor
                                                            </option>

                                                            {allFolders
                                                                .filter(
                                                                    (item) =>
                                                                        item.fname !==
                                                                        folder.fname,
                                                                )
                                                                .map((item) => (
                                                                    <option
                                                                        key={item.fname}
                                                                        value={item.fname}
                                                                    >
                                                                        {item.fname}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </td>

                                                    {/* Duration */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                step={1}
                                                                value={
                                                                    config.duration
                                                                }
                                                                onChange={(event) =>
                                                                    updateConfig(
                                                                        folder.fname,
                                                                        "duration",
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                className={inputClass}
                                                            />

                                                            <span className="text-xs text-gray-500">
                                                                days
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Start date */}
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="date"
                                                            value={
                                                                config.startDate
                                                            }
                                                            disabled={Boolean(
                                                                config.predecessor,
                                                            )}
                                                            onChange={(event) =>
                                                                updateConfig(
                                                                    folder.fname,
                                                                    "startDate",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700`}
                                                            title={
                                                                config.predecessor
                                                                    ? "Automatically calculated from the predecessor's end date"
                                                                    : "Select the start date"
                                                            }
                                                        />
                                                    </td>

                                                    {/* Automatically calculated end date */}
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="date"
                                                            value={
                                                                config.endDate
                                                            }
                                                            readOnly
                                                            className={`${inputClass} cursor-not-allowed bg-gray-50 dark:bg-gray-700`}
                                                            title="Automatically calculated from the start date and duration"
                                                        />
                                                    </td>

                                                    {/* Key person */}
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={
                                                                validKeyPerson
                                                                    ? String(
                                                                          config.keyPersonId,
                                                                      )
                                                                    : ""
                                                            }
                                                            onChange={(event) =>
                                                                updateConfig(
                                                                    folder.fname,
                                                                    "keyPersonId",
                                                                    event.target
                                                                        .value === ""
                                                                        ? ""
                                                                        : Number(
                                                                              event.target
                                                                                  .value,
                                                                          ),
                                                                )
                                                            }
                                                            className={inputClass}
                                                            disabled={
                                                                eligibleMembers.length ===
                                                                0
                                                            }
                                                        >
                                                            <option value="">
                                                                {eligibleMembers.length >
                                                                0
                                                                    ? "Select key person"
                                                                    : "No assigned members"}
                                                            </option>

                                                            {eligibleMembers.map(
                                                                (member) => (
                                                                    <option
                                                                        key={member.memberid}
                                                                        value={member.memberid}
                                                                    >
                                                                        Member{" "}
                                                                        {
                                                                            member.memberid
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Demo values only. No backend API is called.
                                </p>

                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {allFolders.length} folders configured
                                </span>
                            </div>
                        </section>
                    )}

                    {/* Feedback */}
                    {error && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                        >
                            <CheckCircle2
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            {success}
                        </div>
                    )}
                </div>
            </main>

            {/* Fixed footer */}
            <footer className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={
                            step === 2
                                ? handleBack
                                : () => navigate("/dashboard")
                        }
                        className={buttonSecondary}
                    >
                        <ArrowLeft size={16} />

                        {step === 2 ? "Back" : "Cancel"}
                    </button>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {step === 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className={buttonPrimary}
                            >
                                Next
                                <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleFinish}
                                className={buttonPrimary}
                            >
                                <CheckCircle2 size={16} />
                                Finish Demo Setup
                            </button>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}
