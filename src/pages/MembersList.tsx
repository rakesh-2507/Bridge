import { useState } from "react";
import CreateUserForm from "../components/forms/CreateUserForm";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  userType: string;
  status: string;
}

function MembersList() {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const users: User[] = [
    {
      id: 1,
      name: "Hema Singh",
      email: "hema@gmail.com",
      username: "hema12",
      userType: "Member",
      status: "Active",
    },
    {
      id: 2,
      name: "Kamlesh Yadav",
      email: "kamlesh@gmail.com",
      username: "kamlesh",
      userType: "Member",
      status: "Active",
    },
    {
      id: 3,
      name: "Tony Picipello",
      email: "hive.obs@gmail.com",
      username: "tony",
      userType: "Manager",
      status: "Active",
    },
    {
      id: 4,
      name: "Raghu Yadav",
      email: "raghu@gmail.com",
      username: "raghu",
      userType: "Member",
      status: "Active",
    },
    {
      id: 5,
      name: "Rajni Singh",
      email: "rajni@gmail.com",
      username: "rajni",
      userType: "User",
      status: "Active",
    },
    {
      id: 6,
      name: "Rakhi Singh",
      email: "rakhi@gmail.com",
      username: "rakhi",
      userType: "User",
      status: "Active",
    },
    {
      id: 7,
      name: "Dimitrios Sanos",
      email: "dimitrios@gmail.com",
      username: "dimitrios",
      userType: "Manager",
      status: "Active",
    },
    {
      id: 8,
      name: "Sonu Raj",
      email: "sonu@gmail.com",
      username: "sonu",
      userType: "Member",
      status: "Active",
    },
    {
      id: 9,
      name: "Ray Taylor",
      email: "ray@gmail.com",
      username: "ray",
      userType: "Member",
      status: "Active",
    },
    {
      id: 10,
      name: "Dimitrios Sanos",
      email: "dimitrios@gmail.com",
      username: "dimitrios",
      userType: "Manager",
      status: "Active",
    },
    {
      id: 11,
      name: "Sonu Raj",
      email: "sonu@gmail.com",
      username: "sonu",
      userType: "Member",
      status: "Active",
    },
    {
      id: 12,
      name: "Ray Taylor",
      email: "ray@gmail.com",
      username: "ray",
      userType: "Member",
      status: "Active",
    },

  ];

  /* Search */
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  /* Pagination */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleGoToPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const page = Number(e.target.value);

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto text-gray-900 dark:text-white">
      {/* Create User Form */}
      {showCreateForm ? (

        <CreateUserForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={(data) => {
            console.log("User created:", data);
            setShowCreateForm(false);
          }}
        />

      ) : (

        <>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Users
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage all users and their access to the system.
              </p>
            </div>

            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Add User
              </button>
            )}

          </div>



          {/* Search */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">

            <div className="relative w-full sm:max-w-md">

              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              />

            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Search
            </button>

          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

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

                  {currentUsers.length > 0 ? (

                    currentUsers.map((user) => (

                      <tr
                        key={user.id}
                        className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800"
                      >

                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          #{user.id}
                        </td>

                        <td className="px-6 py-4">

                          <button
                            type="button"
                            className="font-medium text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                          >
                            {user.name}
                          </button>

                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {user.email}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {user.username}
                        </td>

                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          {user.userType}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={user.status} />
                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No users found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            {/* Mobile */}
            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

              {currentUsers.length > 0 ? (

                currentUsers.map((user) => (

                  <button
                    key={user.id}
                    type="button"
                    className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          User #{user.id}
                        </p>

                        <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {user.name}
                        </h3>

                      </div>

                      <StatusBadge status={user.status} />

                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                          {user.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Username
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                          {user.username}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User Type
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                          {user.userType}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          User ID
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                          #{user.id}
                        </p>
                      </div>

                    </div>

                  </button>

                ))

              ) : (

                <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  No users found.
                </div>

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
                  onChange={handleGoToPage}
                  className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />

                <span>
                  of {totalPages}
                </span>

              </div>

              <div className="flex items-center justify-center gap-2">

                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Next
                </button>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
}

function StatusBadge({ status }: { status: string }) {

  const styles =
    status === "Active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "Inactive"
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default MembersList;