import { useEffect, useState } from "react";

import CreateUserForm from "../components/forms/CreateUserForm";

import {
  getUsers,
  type User,
} from "../api/users";

function MembersList() {
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const itemsPerPage = 10;

  /*
   * Load users
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getUsers();

      /*
       * API returns:
       *
       * {
       *   users: [],
       *   total: number
       * }
       */
      setUsers(
        Array.isArray(response.users)
          ? response.users
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load users:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users."
      );

    } finally {
      setLoading(false);
    }
  };

  /*
   * Initial API request
   *
   * We intentionally define the async
   * function inside the effect.
   */
  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getUsers();

        if (!cancelled) {
          setUsers(
            Array.isArray(response.users)
              ? response.users
              : []
          );
        }

      } catch (err) {
        console.error(
          "Failed to load users:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load users."
          );
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Search
   */
  const normalizedSearch =
    search.toLowerCase().trim();

  const filteredUsers = users.filter(
    (user) => {
      const fullName =
        `${user.firstname} ${user.lastname}`
          .trim()
          .toLowerCase();

      const email =
        user.email?.toLowerCase() ?? "";

      const username =
        user.loginname?.toLowerCase() ?? "";

      const userType =
        user.mtype?.toLowerCase() ?? "";

      return (
        fullName.includes(normalizedSearch) ||
        email.includes(normalizedSearch) ||
        username.includes(normalizedSearch) ||
        userType.includes(normalizedSearch) ||
        String(user.uid).includes(
          normalizedSearch
        )
      );
    }
  );

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUsers.length /
        itemsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const currentUsers =
    filteredUsers.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  /*
   * Search handler
   */
  const handleSearch = (
    value: string
  ) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /*
   * Previous
   */
  const handlePrevious = () => {
    setCurrentPage((prev) =>
      Math.max(prev - 1, 1)
    );
  };

  /*
   * Next
   */
  const handleNext = () => {
    setCurrentPage((prev) =>
      Math.min(
        prev + 1,
        totalPages
      )
    );
  };

  /*
   * Go to page
   */
  const handleGoToPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      e.target.value;

    if (value === "") {
      return;
    }

    const page = Number(value);

    if (Number.isInteger(page)) {
      setCurrentPage(
        Math.min(
          Math.max(page, 1),
          totalPages
        )
      );
    }
  };

  /*
   * User created
   */
  const handleUserCreated = async (
    data: unknown
  ) => {
    console.log(
      "User created:",
      data
    );

    setShowCreateForm(false);
    setCurrentPage(1);

    await loadUsers();
  };

  /*
   * Create user form
   */
  if (showCreateForm) {
    return (
      <div className="mx-auto text-gray-900 dark:text-white">

        <CreateUserForm
          onCancel={() =>
            setShowCreateForm(false)
          }
          onSuccess={
            handleUserCreated
          }
        />

      </div>
    );
  }

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-xl font-bold tracking-tight">
            Users
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            Manage all users and their access
            to the system.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            setShowCreateForm(true)
          }
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Add User
        </button>

      </div>

      {/* Search */}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">

        <div className="relative w-full sm:max-w-md">

          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) =>
              handleSearch(
                e.target.value
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
          />

        </div>

        <button
          type="button"
          onClick={() =>
            setCurrentPage(1)
          }
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
        >
          Search
        </button>

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

        {/* Loading */}

        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading users...
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="p-6">

            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>

            <button
              type="button"
              onClick={loadUsers}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
            >
              Try Again
            </button>

          </div>
        )}

        {/* Content */}

        {!loading && !error && (
          <>

            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">

                  <tr>

                    <th className="px-6 py-4 font-semibold">
                      User ID
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Name
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Username
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      User Type
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                  {currentUsers.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No users found.
                      </td>

                    </tr>

                  ) : (

                    currentUsers.map(
                      (user) => {

                        const fullName =
                          `${user.title ? user.title + " " : ""}${user.firstname} ${user.lastname}`
                            .trim();

                        return (
                          <tr
                            key={user.uid}
                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >

                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              #{user.uid}
                            </td>

                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {fullName || "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {user.email || "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {user.loginname || "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {user.mtype || "—"}
                            </td>

                            <td className="px-6 py-4">
                              <StatusBadge
                                status={
                                  user.status
                                }
                              />
                            </td>

                          </tr>
                        );
                      }
                    )

                  )}

                </tbody>

              </table>

            </div>

            {/* Mobile */}

            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

              {currentUsers.length ===
              0 ? (

                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No users found.
                </div>

              ) : (

                currentUsers.map(
                  (user) => {

                    const fullName =
                      `${user.title ? user.title + " " : ""}${user.firstname} ${user.lastname}`
                        .trim();

                    return (
                      <div
                        key={user.uid}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              User #{user.uid}
                            </p>

                            <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {fullName || "—"}
                            </h3>

                          </div>

                          <StatusBadge
                            status={
                              user.status
                            }
                          />

                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">

                          <div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Email
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                              {user.email || "—"}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Username
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                              {user.loginname || "—"}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              User Type
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                              {user.mtype || "—"}
                            </p>

                          </div>

                          <div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Mobile
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                              {user.mobile || "—"}
                            </p>

                          </div>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* Pagination */}

            <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between dark:border-gray-700">

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                <span>
                  Go to page
                </span>

                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={
                    handleGoToPage
                  }
                  className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />

                <span>
                  of {totalPages}
                </span>

              </div>

              <div className="flex items-center justify-center gap-2">

                <button
                  type="button"
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={
                    handleNext
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                >
                  Next
                </button>

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
}

/*
 * Status badge
 */
function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus =
    status?.toLowerCase();

  const styles =
    normalizedStatus === "active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : normalizedStatus ===
          "inactive"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default MembersList;