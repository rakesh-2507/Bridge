import { useEffect, useState } from "react";

import CreateFolderForm from "../components/forms/CreateFolderForm";

import {
  getFolders,
  type Folder,
} from "../api/folders";

function Folders() {
  const [folders, setFolders] = useState<Folder[]>([]);

  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 10;

  /*
   * Load folders
   */
  const loadFolders = async () => {
    try {
      const response = await getFolders();

      return response.folders;
    } catch (err) {
      console.error("Failed to load folders:", err);
      throw err;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchFolders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await loadFolders();

        if (!cancelled) {
          setFolders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load folders."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Search
   */
  const filteredFolders = folders.filter(
    (folder) =>
      folder.fname
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(folder.fid).includes(search) ||
      String(folder.tid).includes(search) ||
      String(folder.pid).includes(search) ||
      folder.fnamedesc
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFolders.length / itemsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const currentFolders =
    filteredFolders.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  /*
   * Search handler
   */
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /*
   * Previous page
   */
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  /*
   * Next page
   */
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  /*
   * Go to page
   */
  const handleGoToPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === "") {
      return;
    }

    const page = Number(value);

    if (
      page >= 1 &&
      page <= totalPages
    ) {
      setCurrentPage(page);
    }
  };

  /*
   * Folder successfully created
   */
  const handleFolderCreated = async (
    data: unknown
  ) => {
    console.log(
      "Folder created:",
      data
    );

    setShowCreateForm(false);

    setCurrentPage(1);

    await loadFolders();
  };

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {showCreateForm ? (

        <CreateFolderForm
          onCancel={() =>
            setShowCreateForm(false)
          }
          onSuccess={
            handleFolderCreated
          }
        />

      ) : (

        <>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Folders
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage template folders and document sections.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateForm(true)
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Add Folder
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
                placeholder="Search folders..."
                value={search}
                onChange={(e) =>
                  handleSearch(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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

            {loading ? (

              <div className="flex min-h-[300px] items-center justify-center">

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading folders...
                </div>

              </div>

            ) : error ? (

              <div className="p-6">

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>

                <button
                  type="button"
                  onClick={loadFolders}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
                >
                  Try Again
                </button>

              </div>

            ) : (

              <>

                {/* Desktop */}
                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full text-left text-sm">

                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">

                      <tr>

                        <th className="px-6 py-4 font-semibold">
                          Folder ID
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Folder Name
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Parent Folder
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Template ID
                        </th>

                        <th className="px-6 py-4 font-semibold">
                          Description
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                      {currentFolders.length === 0 ? (

                        <tr>

                          <td
                            colSpan={5}
                            className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                          >
                            No folders found.
                          </td>

                        </tr>

                      ) : (

                        currentFolders.map(
                          (folder) => (

                            <tr
                              key={
                                folder.fid
                              }
                              className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                            >

                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                #{folder.fid}
                              </td>

                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {folder.fname}
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                {folder.pid
                                  ? `#${folder.pid}`
                                  : "Root"}
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                #{folder.tid}
                              </td>

                              <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                {folder.fnamedesc ||
                                  "—"}
                              </td>

                            </tr>

                          )
                        )

                      )}

                    </tbody>

                  </table>

                </div>

                {/* Mobile */}
                <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

                  {currentFolders.length ===
                    0 ? (

                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No folders found.
                    </div>

                  ) : (

                    currentFolders.map(
                      (folder) => (

                        <div
                          key={
                            folder.fid
                          }
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Folder #
                            {folder.fid}
                          </p>

                          <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {folder.fname}
                          </h3>

                          <div className="mt-4 grid grid-cols-2 gap-4">

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Parent
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                {folder.pid
                                  ? `#${folder.pid}`
                                  : "Root"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Template
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                #{folder.tid}
                              </p>
                            </div>

                          </div>

                          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                            {folder.fnamedesc ||
                              "No description"}
                          </p>

                        </div>

                      )
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
                      value={
                        currentPage
                      }
                      onChange={
                        handleGoToPage
                      }
                      className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                        currentPage ===
                        1
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
                    >
                      Previous
                    </button>

                    <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                      Page{" "}
                      {currentPage} of{" "}
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
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200"
                    >
                      Next
                    </button>

                  </div>

                </div>

              </>

            )}

          </div>

        </>

      )}

    </div>
  );
}

export default Folders;