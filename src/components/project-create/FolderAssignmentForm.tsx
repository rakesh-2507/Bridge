import { useEffect, useMemo, useState } from "react";
import FolderTree, {
  type FolderNode,
} from "../project-create/FolderTree";

import {
    ChevronLeft,
    Check,
    ChevronDown,
    Search,
    X,
    Users,
    Folder as FolderIcon,
    CalendarDays,
    Loader2,
} from "lucide-react";

import type {
    FolderAssignment,
    FolderSchedule,
    TemplateFolderRolesResponse,
} from "../../types/projectTemplate";

import type { Folder } from "../../api/folders";
import { getUsers } from "../../api/users";

interface FolderAssignmentFormProps {
    folders: Folder[];
    folderRoles: TemplateFolderRolesResponse | null;
    schedules: FolderSchedule[];
    initialAssignments: FolderAssignment[];

    isLoading?: boolean;
    isSubmitting?: boolean;

    onBack: () => void;

    onSubmit: (
        assignments: FolderAssignment[]
    ) => void | Promise<void>;
}

interface User {
    uid: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    name?: string;
}

interface UserResponse {
    users: User[];
    total?: number;
}

interface RoleRow {
    folderId: number;
    folderName: string;
    role: string;
}

export default function FolderAssignmentForm({
    folders,
    folderRoles,
    schedules,
    initialAssignments,
    isLoading = false,
    isSubmitting = false,
    onBack,
    onSubmit,
}: FolderAssignmentFormProps) {
    /*
     * ----------------------------------------
     * Users
     * ----------------------------------------
     */

    const [users, setUsers] = useState<User[]>([]);

    const [userLoading, setUserLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /*
     * ----------------------------------------
     * Assignments
     *
     * Initialize directly from props.
     *
     * IMPORTANT:
     * Do not use:
     *
     * useEffect(() => {
     *   setAssignments(initialAssignments);
     * }, [initialAssignments]);
     *
     * That causes the React cascading-render
     * warning.
     * ----------------------------------------
     */

    const [assignments, setAssignments] =
        useState<FolderAssignment[]>(
            initialAssignments
        );

    /*
     * ----------------------------------------
     * Validation
     * ----------------------------------------
     */

    const [validationErrors, setValidationErrors] =
        useState<Record<string, string>>({});

    /*
     * ----------------------------------------
     * Dropdown state
     * ----------------------------------------
     */

    const [openRole, setOpenRole] =
        useState<string | null>(null);

    const [searchValues, setSearchValues] =
        useState<Record<string, string>>({});

    /*
     * ----------------------------------------
     * Load users
     * ----------------------------------------
     */

    useEffect(() => {
        let cancelled = false;

        async function loadUsers() {
            try {
                setUserLoading(true);
                setError(null);

                const response =
                    (await getUsers()) as UserResponse;

                if (cancelled) {
                    return;
                }

                setUsers(response.users ?? []);
            } catch (err) {
                console.error(
                    "Failed to load users:",
                    err
                );

                if (!cancelled) {
                    setError(
                        "Unable to load users."
                    );
                }
            } finally {
                if (!cancelled) {
                    setUserLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * ----------------------------------------
     * Folder tree
     * ----------------------------------------
     */

    /*
     * ----------------------------------------
     * Role rows
     * ----------------------------------------
     */

    const roleRows = useMemo<RoleRow[]>(() => {
        if (!folderRoles) {
            return [];
        }

        return folderRoles.folders.flatMap(
            (folder) =>
                folder.roles.map((role) => ({
                    folderId: folder.folder_id,
                    folderName: folder.folder_name,
                    role: role.role,
                }))
        );
    }, [folderRoles]);

    /*
     * ----------------------------------------
     * User name
     * ----------------------------------------
     */

    function getUserName(user: User): string {
        if (user.name) {
            return user.name;
        }

        const fullName = [
            user.firstname,
            user.lastname,
        ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
            return fullName;
        }

        if (user.username) {
            return user.username;
        }

        return `User ${user.uid}`;
    }

    /*
     * ----------------------------------------
     * Find user
     * ----------------------------------------
     */

    function getUser(userId: number): User | undefined {
        return users.find(
            (user) => user.uid === userId
        );
    }

    /*
     * ----------------------------------------
     * Role key
     * ----------------------------------------
     */

    function getRoleKey(
        folderId: number,
        role: string
    ): string {
        return `${folderId}__${role}`;
    }

    /*
     * ----------------------------------------
     * Get folder assignment
     * ----------------------------------------
     */

    function getFolderAssignment(
        folderId: number
    ): FolderAssignment {
        const existing = assignments.find(
            (assignment) =>
                assignment.folder_id === folderId
        );

        if (existing) {
            return existing;
        }

        const schedule = schedules.find(
            (item) =>
                item.folder_id === folderId
        );

        return {
            folder_id: folderId,
            start_date:
                schedule?.start_date ?? "",
            end_date:
                schedule?.end_date ?? "",
            role_assignments: [],
        };
    }

    /*
     * ----------------------------------------
     * Selected users for role
     * ----------------------------------------
     */

    function getSelectedUserIds(
        folderId: number,
        role: string
    ): number[] {
        const assignment =
            getFolderAssignment(folderId);

        return assignment.role_assignments
            .filter(
                (item) => item.role === role
            )
            .map(
                (item) => item.user_id
            );
    }

    /*
     * ----------------------------------------
     * Toggle user
     * ----------------------------------------
     */

    function toggleUser(
        folderId: number,
        role: string,
        userId: number
    ) {
        setAssignments((current) => {
            const assignmentIndex =
                current.findIndex(
                    (item) =>
                        item.folder_id === folderId
                );

            /*
             * Folder does not have an assignment.
             */

            if (assignmentIndex === -1) {
                const schedule = schedules.find(
                    (item) =>
                        item.folder_id === folderId
                );

                const newAssignment: FolderAssignment =
                {
                    folder_id: folderId,

                    start_date:
                        schedule?.start_date ?? "",

                    end_date:
                        schedule?.end_date ?? "",

                    role_assignments: [
                        {
                            role,
                            user_id: userId,
                        },
                    ],
                };

                return [
                    ...current,
                    newAssignment,
                ];
            }

            /*
             * Update existing folder.
             */

            return current.map(
                (assignment, index) => {
                    if (
                        index !== assignmentIndex
                    ) {
                        return assignment;
                    }

                    const alreadySelected =
                        assignment.role_assignments.some(
                            (item) =>
                                item.role === role &&
                                item.user_id === userId
                        );

                    /*
                     * Remove user.
                     */

                    if (alreadySelected) {
                        return {
                            ...assignment,

                            role_assignments:
                                assignment.role_assignments.filter(
                                    (item) =>
                                        !(
                                            item.role === role &&
                                            item.user_id === userId
                                        )
                                ),
                        };
                    }

                    /*
                     * Add user.
                     */

                    return {
                        ...assignment,

                        role_assignments: [
                            ...assignment.role_assignments,
                            {
                                role,
                                user_id: userId,
                            },
                        ],
                    };
                }
            );
        });

        /*
         * Clear validation error.
         */

        const key = getRoleKey(
            folderId,
            role
        );

        setValidationErrors((current) => {
            if (!current[key]) {
                return current;
            }

            const updated = {
                ...current,
            };

            delete updated[key];

            return updated;
        });
    }

    /*
     * ----------------------------------------
     * Remove selected user
     * ----------------------------------------
     */

    function removeUser(
        folderId: number,
        role: string,
        userId: number
    ) {
        toggleUser(
            folderId,
            role,
            userId
        );
    }

    /*
     * ----------------------------------------
     * Filter users
     * ----------------------------------------
     */

    function getFilteredUsers(
        folderId: number,
        role: string
    ): User[] {
        const key = getRoleKey(
            folderId,
            role
        );

        const search =
            searchValues[key]
                ?.trim()
                .toLowerCase() ?? "";

        if (!search) {
            return users;
        }

        return users.filter((user) =>
            getUserName(user)
                .toLowerCase()
                .includes(search)
        );
    }

    /*
     * ----------------------------------------
     * Update search
     * ----------------------------------------
     */

    function updateSearch(
        folderId: number,
        role: string,
        value: string
    ) {
        const key = getRoleKey(
            folderId,
            role
        );

        setSearchValues((current) => ({
            ...current,
            [key]: value,
        }));
    }

    /*
     * ----------------------------------------
     * Validate
     * ----------------------------------------
     */

    function validate(): boolean {
        const errors: Record<
            string,
            string
        > = {};

        roleRows.forEach((row) => {
            const selectedUsers =
                getSelectedUserIds(
                    row.folderId,
                    row.role
                );

            if (selectedUsers.length === 0) {
                errors[
                    getRoleKey(
                        row.folderId,
                        row.role
                    )
                ] =
                    `Please select at least one user for ${row.role}.`;
            }
        });

        setValidationErrors(errors);

        return (
            Object.keys(errors).length === 0
        );
    }

    /*
     * ----------------------------------------
     * Submit
     * ----------------------------------------
     */

    async function handleSubmit() {
        if (!validate()) {
            return;
        }

        const completeAssignments =
            folders.map((folder) => {
                const existing =
                    getFolderAssignment(
                        folder.fid
                    );

                const schedule =
                    schedules.find(
                        (item) =>
                            item.folder_id ===
                            folder.fid
                    );

                return {
                    folder_id: folder.fid,

                    start_date:
                        schedule?.start_date ??
                        existing.start_date,

                    end_date:
                        schedule?.end_date ??
                        existing.end_date,

                    role_assignments:
                        existing.role_assignments,
                };
            });

        await onSubmit(
            completeAssignments
        );
    }

    /*
     * ----------------------------------------
     * Role selector
     * ----------------------------------------
     */

    function renderRoleSelector(
        folderId: number,
        role: string
    ) {
        const key = getRoleKey(folderId, role);

        const selectedUserIds = getSelectedUserIds(
            folderId,
            role
        );

        const selectedUsers = selectedUserIds
            .map((id) => getUser(id))
            .filter(
                (user): user is User => Boolean(user)
            );

        const filteredUsers = getFilteredUsers(
            folderId,
            role
        );

        const isOpen = openRole === key;
        const roleError = validationErrors[key];

        return (
            <div
                key={key}
                className="rounded-lg border border-gray-200 bg-white"
            >
                <div className="px-4 py-3">

                    {/* ROLE NAME */}

                    <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-800">
                            {role}
                        </label>

                        {selectedUsers.length > 0 && (
                            <span className="text-xs text-gray-500">
                                {selectedUsers.length} selected
                            </span>
                        )}
                    </div>

                    {/* DROPDOWN */}

                    <div className="relative">

                        <button
                            type="button"
                            onClick={() =>
                                setOpenRole(isOpen ? null : key)
                            }
                            className={`flex min-h-[42px] w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm transition hover:border-gray-400 ${roleError
                                ? "border-red-400"
                                : "border-gray-300"
                                }`}
                        >
                            <div className="min-w-0 flex-1">

                                {selectedUsers.length === 0 ? (
                                    <span className="text-gray-400">
                                        Select users...
                                    </span>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">

                                        {selectedUsers
                                            .slice(0, 3)
                                            .map((user) => (
                                                <span
                                                    key={user.uid}
                                                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                >
                                                    {getUserName(user)}

                                                    <X
                                                        size={12}
                                                        className="cursor-pointer"
                                                        onClick={(event) => {
                                                            event.stopPropagation();

                                                            removeUser(
                                                                folderId,
                                                                role,
                                                                user.uid
                                                            );
                                                        }}
                                                    />
                                                </span>
                                            ))}

                                        {selectedUsers.length > 3 && (
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                +{selectedUsers.length - 3} more
                                            </span>
                                        )}

                                    </div>
                                )}

                            </div>

                            <ChevronDown
                                size={17}
                                className={`ml-2 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {/* DROPDOWN MENU */}

                        {isOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">

                                {/* SEARCH */}

                                <div className="border-b border-gray-100 p-2">
                                    <div className="relative">

                                        <Search
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />

                                        <input
                                            type="text"
                                            autoFocus
                                            value={searchValues[key] ?? ""}
                                            onChange={(event) =>
                                                updateSearch(
                                                    folderId,
                                                    role,
                                                    event.target.value
                                                )
                                            }
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                            placeholder="Search users..."
                                            className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>
                                </div>

                                {/* USER CHECKBOX LIST */}

                                <div className="max-h-64 overflow-y-auto p-1">

                                    {filteredUsers.length === 0 ? (
                                        <div className="px-3 py-6 text-center text-sm text-gray-500">
                                            No users found.
                                        </div>
                                    ) : (
                                        filteredUsers.map((user) => {

                                            const selected =
                                                selectedUserIds.includes(
                                                    user.uid
                                                );

                                            return (
                                                <button
                                                    key={user.uid}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleUser(
                                                            folderId,
                                                            role,
                                                            user.uid
                                                        )
                                                    }
                                                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition ${selected
                                                        ? "bg-blue-50"
                                                        : "hover:bg-gray-50"
                                                        }`}
                                                >

                                                    {/* CHECKBOX */}

                                                    <span
                                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected
                                                            ? "border-blue-600 bg-blue-600"
                                                            : "border-gray-300 bg-white"
                                                            }`}
                                                    >
                                                        {selected && (
                                                            <Check
                                                                size={12}
                                                                strokeWidth={3}
                                                                className="text-white"
                                                            />
                                                        )}
                                                    </span>

                                                    {/* AVATAR */}

                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                                                        {getUserName(user)
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>

                                                    {/* USER NAME */}

                                                    <span className="min-w-0 flex-1">

                                                        <span className="block truncate text-sm font-medium text-gray-800">
                                                            {getUserName(user)}
                                                        </span>

                                                        {user.username && (
                                                            <span className="block truncate text-xs text-gray-400">
                                                                {user.username}
                                                            </span>
                                                        )}

                                                    </span>

                                                    {/* SELECTED TEXT */}

                                                    {selected && (
                                                        <span className="text-xs font-medium text-blue-600">
                                                            Selected
                                                        </span>
                                                    )}

                                                </button>
                                            );
                                        })
                                    )}

                                </div>

                                {/* DROPDOWN FOOTER */}

                                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2">

                                    <span className="text-xs text-gray-500">
                                        {selectedUsers.length} selected
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenRole(null);

                                            setSearchValues((current) => ({
                                                ...current,
                                                [key]: "",
                                            }));
                                        }}
                                        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                    >
                                        Done
                                    </button>

                                </div>

                            </div>
                        )}

                    </div>

                    {/* VALIDATION */}

                    {roleError && (
                        <p className="mt-2 text-xs text-red-600">
                            {roleError}
                        </p>
                    )}

                </div>
            </div>
        );
    }

    /*
     * ----------------------------------------
     * Folder renderer
     * ----------------------------------------
     */

    function renderFolder(
        node: FolderNode,
        level: number
    ): React.ReactNode {
        const folder = node.folder;

        const folderRoleData =
            folderRoles?.folders.find(
                (item) =>
                    item.folder_id === folder.fid
            );

        const schedule =
            schedules.find(
                (item) =>
                    item.folder_id === folder.fid
            );

        return (
            <div key={folder.fid}>

                {/* Folder */}

                <div
                    className="
            overflow-visible
            rounded-xl
            border
            border-gray-200
            bg-white
          "
                >

                    {/* Header */}

                    <div
                        className="
              flex
              items-center
              gap-3
              border-b
              border-gray-100
              bg-gray-50
              px-4
              py-4
            "
                        style={{
                            paddingLeft: `${16 + level * 28
                                }px`,
                        }}
                    >

                        <FolderIcon
                            size={19}
                            className="shrink-0 text-blue-600"
                        />

                        <div className="min-w-0 flex-1">

                            <p className="text-sm font-semibold text-gray-900">
                                {folder.fname}
                            </p>

                            {folder.fnamedesc && (
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {folder.fnamedesc}
                                </p>
                            )}

                        </div>

                        {/* Schedule */}

                        {schedule && (
                            <div className="hidden items-center gap-3 text-xs text-gray-500 md:flex">

                                <span className="inline-flex items-center gap-1">
                                    <CalendarDays size={13} />
                                    {schedule.start_date}
                                </span>

                                <span>→</span>

                                <span>
                                    {schedule.end_date}
                                </span>

                            </div>
                        )}

                    </div>

                    {/* Roles */}

                    <div className="space-y-3 p-4">

                        {!folderRoleData ||
                            folderRoleData.roles.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center">

                                <p className="text-sm text-gray-500">
                                    No roles configured for this folder.
                                </p>

                            </div>
                        ) : (
                            folderRoleData.roles.map(
                                (roleItem) =>
                                    renderRoleSelector(
                                        folder.fid,
                                        roleItem.role
                                    )
                            )
                        )}

                    </div>

                </div>

            </div>
        );
    }

    /*
     * ----------------------------------------
     * Loading
     * ----------------------------------------
     */

    if (isLoading || userLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">

                <div className="flex items-center gap-3 text-sm text-gray-500">

                    <Loader2
                        size={20}
                        className="animate-spin"
                    />

                    {isLoading
                        ? "Loading folder roles..."
                        : "Loading users..."}

                </div>

            </div>
        );
    }

    /*
     * ----------------------------------------
     * Main UI
     * ----------------------------------------
     */

    return (
        <>
            <div className="p-6 sm:p-8">

                {/* Header */}

                <div className="mb-8">

                    <div className="flex items-center gap-2">

                        <Users
                            size={20}
                            className="text-blue-600"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Members & Roles
                        </h2>

                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                        Assign one or more users to each
                        role configured for the folders.
                    </p>

                </div>

                {/* Error */}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary */}

                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">

                    <div className="flex items-start gap-3">

                        <Users
                            size={19}
                            className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>

                            <p className="text-sm font-medium text-blue-900">
                                Assign users to every role
                            </p>

                            <p className="mt-1 text-xs text-blue-700">
                                You can select multiple users for
                                the same role. At least one user
                                must be assigned to each role.
                            </p>

                        </div>

                    </div>

                </div>

                {/* Folder tree */}

                <FolderTree
                    folders={folders}
                    renderFolder={renderFolder}
                />

                {/* No roles */}

                {roleRows.length === 0 && (
                    <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                        <p className="text-sm font-medium text-yellow-900">
                            No roles found
                        </p>

                        <p className="mt-1 text-sm text-yellow-700">
                            The selected template does not
                            have any roles configured for
                            its folders.
                        </p>

                    </div>
                )}

            </div>

            {/* Footer */}

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">

                {/* Back */}

                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
                >
                    <ChevronLeft size={17} />
                    Back
                </button>

                {/* Create */}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                        isSubmitting ||
                        userLoading ||
                        isLoading
                    }
                    className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
                >
                    {isSubmitting ? (
                        <>
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />

                            Creating Project...
                        </>
                    ) : (
                        <>
                            <Check size={17} />

                            Create Project
                        </>
                    )}
                </button>

            </div>
        </>
    );
}