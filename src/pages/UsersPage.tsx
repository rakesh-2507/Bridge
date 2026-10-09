
import { useEffect, useState } from "react";
import {
    createUser,
    deleteUser,
    getUser,
    getUsers,
    updateUser,
} from "../api/users";

import type {
    CreateUserPayload,
    User,
    UserPayload,
} from "../api/users";

const emptyForm: CreateUserPayload = {
    title: "",
    firstname: "",
    lastname: "",
    loginname: "",
    password: "",
    email: "",
    mobile: "",
    mtype: "",
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [form, setForm] = useState<CreateUserPayload>({ ...emptyForm });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchId, setSearchId] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [apiResponse, setApiResponse] = useState<unknown>(null);

    function clearMessages() {
        setError("");
        setMessage("");
        setApiResponse(null);
    }

    function handleError(err: unknown) {
        setError(
            err instanceof Error ? err.message : "An unexpected error occurred.",
        );
    }

    function updateField(
        field: keyof CreateUserPayload,
        value: string,
    ) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    // GET /api/getusers
    async function loadUsers() {
        clearMessages();
        setLoading(true);

        try {
            const response = await getUsers();
            setUsers(response.users ?? []);
            setApiResponse(response);
            setMessage(`GET /api/getusers succeeded. Total: ${response.total}.`);
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        let cancelled = false;

        async function fetchInitialUsers() {
            try {
                // Wait for the API response before updating state.
                const response = await getUsers();

                if (cancelled) return;

                setUsers(response.users ?? []);
                setApiResponse(response);
                setMessage(
                    `GET /api/getusers succeeded. Total: ${response.total}.`,
                );
            } catch (err) {
                if (cancelled) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "An unexpected error occurred.",
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchInitialUsers();

        return () => {
            cancelled = true;
        };
    }, []);
    
    // GET /api/getuser/{uid}
    async function handleGetUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        const uid = Number(searchId);

        if (!Number.isInteger(uid) || uid <= 0) {
            setError("Enter a valid positive user ID.");
            return;
        }

        setLoading(true);

        try {
            const user = await getUser(uid);
            setSelectedUser(user);
            setApiResponse(user);
            setMessage(`GET /api/getuser/${uid} succeeded.`);
        } catch (err) {
            setSelectedUser(null);
            handleError(err);
        } finally {
            setLoading(false);
        }
    }

    // POST /api/createuser OR PUT /api/updateuser/{uid}
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        clearMessages();

        const payload: UserPayload = {
            title: form.title.trim(),
            firstname: form.firstname.trim(),
            lastname: form.lastname.trim(),
            loginname: form.loginname.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            mtype: form.mtype.trim(),
        };

        if (
            !payload.title ||
            !payload.firstname ||
            !payload.lastname ||
            !payload.loginname ||
            !payload.email ||
            !payload.mobile ||
            !payload.mtype
        ) {
            setError("Please fill in all user fields.");
            return;
        }

        setSaving(true);

        try {
            let response: User;

            if (editingId !== null) {
                // Only include password when the user entered one.
                const updatePayload: UserPayload = {
                    ...payload,
                    ...(form.password ? { password: form.password } : {}),
                };

                response = await updateUser(editingId, updatePayload);
                setMessage(`PUT /api/updateuser/${editingId} succeeded.`);
            } else {
                if (!form.password.trim()) {
                    setError("Password is required when creating a user.");
                    setSaving(false);
                    return;
                }

                response = await createUser({
                    ...payload,
                    password: form.password,
                });

                setMessage("POST /api/createuser succeeded.");
            }

            setApiResponse(response);
            setSelectedUser(response);
            setForm({ ...emptyForm });
            setEditingId(null);
            await refreshUsersWithoutMessages();
        } catch (err) {
            handleError(err);
        } finally {
            setSaving(false);
        }
    }

    async function refreshUsersWithoutMessages() {
        try {
            const response = await getUsers();
            setUsers(response.users ?? []);
        } catch {
            // Keep the successful create/update result visible if refreshing fails.
        }
    }

    function startEdit(user: User) {
        clearMessages();
        setEditingId(user.uid);
        setForm({
            title: user.title ?? "",
            firstname: user.firstname ?? "",
            lastname: user.lastname ?? "",
            loginname: user.loginname ?? "",
            password: "",
            email: user.email ?? "",
            mobile: user.mobile ?? "",
            mtype: user.mtype ?? "",
        });

        setSelectedUser(user);
    }

    function cancelEdit() {
        setEditingId(null);
        setForm({ ...emptyForm });
        clearMessages();
    }

    // DELETE /api/deleteuser/{uid}
    async function handleDelete(user: User) {
        const confirmed = window.confirm(
            `Delete user "${user.loginname}" (ID: ${user.uid})?`,
        );

        if (!confirmed) return;

        clearMessages();
        setDeletingId(user.uid);

        try {
            const response = await deleteUser(user.uid);
            setApiResponse(response);
            setMessage(`DELETE /api/deleteuser/${user.uid} succeeded.`);
            setUsers((previous) => previous.filter((item) => item.uid !== user.uid));

            if (selectedUser?.uid === user.uid) {
                setSelectedUser(null);
            }

            if (editingId === user.uid) {
                cancelEdit();
            }
        } catch (err) {
            handleError(err);
        } finally {
            setDeletingId(null);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-900";

    const buttonClass =
        "rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <main className="min-h-full space-y-6 bg-gray-50 p-4 text-gray-900 dark:bg-gray-950 dark:text-gray-100 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Users API Testing</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Test create, read, update, and delete endpoints.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadUsers()}
                    disabled={loading}
                    className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                >
                    {loading ? "Loading..." : "Refresh Users"}
                </button>
            </header>

            {message && (
                <div
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                >
                    {error}
                </div>
            )}

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* POST and PUT */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">
                            {editingId !== null ? "Update User" : "Create User"}
                        </h2>
                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                            {editingId !== null ? "PUT" : "POST"}
                        </span>
                    </div>

                    <p className="mb-4 text-xs text-gray-500">
                        {editingId !== null
                            ? `Endpoint: PUT /api/updateuser/${editingId}`
                            : "Endpoint: POST /api/createuser"}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="space-y-1 text-sm">
                                <span>Title *</span>
                                <input
                                    className={inputClass}
                                    value={form.title}
                                    onChange={(e) => updateField("title", e.target.value)}
                                    placeholder="Mr / Ms / Dr"
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>First Name *</span>
                                <input
                                    className={inputClass}
                                    value={form.firstname}
                                    onChange={(e) => updateField("firstname", e.target.value)}
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>Last Name *</span>
                                <input
                                    className={inputClass}
                                    value={form.lastname}
                                    onChange={(e) => updateField("lastname", e.target.value)}
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>Login Name *</span>
                                <input
                                    className={inputClass}
                                    value={form.loginname}
                                    onChange={(e) => updateField("loginname", e.target.value)}
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>Email *</span>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={form.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>Mobile *</span>
                                <input
                                    className={inputClass}
                                    value={form.mobile}
                                    onChange={(e) => updateField("mobile", e.target.value)}
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>User Type / Role *</span>
                                <input
                                    className={inputClass}
                                    value={form.mtype}
                                    onChange={(e) => updateField("mtype", e.target.value)}
                                    placeholder="e.g. Employee"
                                    required
                                />
                            </label>

                            <label className="space-y-1 text-sm">
                                <span>
                                    Password {editingId === null ? "*" : "(optional)"}
                                </span>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className={inputClass}
                                    value={form.password ?? ""}
                                    onChange={(e) => updateField("password", e.target.value)}
                                    placeholder={
                                        editingId === null
                                            ? "Enter password"
                                            : "Leave blank to keep current password"
                                    }
                                    required={editingId === null}
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Update User"
                                        : "Create User"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className={`${buttonClass} border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800`}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* GET by ID */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold">Get User by ID</h2>
                    <p className="mb-4 mt-1 text-xs text-gray-500">
                        Endpoint: GET /api/getuser/{"{uid}"}
                    </p>

                    <form onSubmit={handleGetUser} className="flex flex-wrap gap-2">
                        <input
                            type="number"
                            min="1"
                            className={`${inputClass} min-w-0 flex-1`}
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="Enter user ID"
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className={`${buttonClass} bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900`}
                        >
                            {loading ? "Loading..." : "Fetch User"}
                        </button>
                    </form>

                    {selectedUser && (
                        <div className="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-950">
                            <h3 className="font-medium">
                                {selectedUser.firstname} {selectedUser.lastname}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                ID: {selectedUser.uid} · {selectedUser.loginname}
                            </p>
                            <p className="mt-1 text-sm">{selectedUser.email}</p>
                            <button
                                type="button"
                                onClick={() => startEdit(selectedUser)}
                                className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Edit this user
                            </button>
                        </div>
                    )}

                    <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-800">
                        <p className="text-sm font-medium">API endpoints under test</p>
                        <ul className="mt-2 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                            <li>GET /api/getusers</li>
                            <li>GET /api/getuser/{"{uid}"}</li>
                            <li>POST /api/createuser</li>
                            <li>PUT /api/updateuser/{"{uid}"}</li>
                            <li>DELETE /api/deleteuser/{"{uid}"}</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* GET all users */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-semibold">All Users</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            GET /api/getusers · {users.length} user(s) loaded
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadUsers()}
                        disabled={loading}
                        className={`${buttonClass} border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800`}
                    >
                        Reload
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-950">
                            <tr>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Login</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {users.map((user) => (
                                <tr
                                    key={user.uid}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <td className="px-4 py-3">{user.uid}</td>
                                    <td className="px-4 py-3">
                                        {user.title} {user.firstname} {user.lastname}
                                    </td>
                                    <td className="px-4 py-3">{user.loginname}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">{user.mobile}</td>
                                    <td className="px-4 py-3">{user.mtype}</td>
                                    <td className="px-4 py-3">{user.status}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(user)}
                                                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                disabled={deletingId === user.uid}
                                                onClick={() => void handleDelete(user)}
                                                className="font-medium text-red-600 hover:underline disabled:opacity-50"
                                            >
                                                {deletingId === user.uid ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!loading && users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        No users found, or the API returned an empty list.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Latest API response */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-lg font-semibold">Latest API Response</h2>
                <p className="mb-3 mt-1 text-sm text-gray-500">
                    Inspect the response returned by the most recent operation.
                </p>
                <pre className="max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs leading-5 text-green-300">
                    {apiResponse === null
                        ? "No response yet. Run an API operation to see its response."
                        : JSON.stringify(apiResponse, null, 2)}
                </pre>
            </section>
        </main>
    );
}