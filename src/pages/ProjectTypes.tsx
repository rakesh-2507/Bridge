import { useEffect, useState } from "react";

import CreateProjectTypeForm from "../components/forms/CreateProjectTypeForm";

import {
  getProjectTypes,
  type ProjectType,
} from "../api/projectTypes";

function ProjectTypes() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const itemsPerPage = 10;

  /*
   * Fetch project types when page loads
   */
  useEffect(() => {
    let cancelled = false;

    const loadProjectTypes = async () => {
      try {
        const response = await getProjectTypes();

        if (cancelled) return;

        setProjectTypes(response.projecttypes);
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to fetch project types:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project types."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProjectTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Fetch project types manually
   *
   * Used by:
   * - Try Again
   * - After creating a project type
   */
  const fetchProjectTypes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProjectTypes();

      setProjectTypes(response.projecttypes);
    } catch (err) {
      console.error("Failed to fetch project types:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load project types."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Search
   */
  const filteredProjectTypes = projectTypes.filter((type) =>
    type.projecttype
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjectTypes.length / itemsPerPage)
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const currentProjectTypes =
    filteredProjectTypes.slice(
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
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  /*
   * Next page
   */
  const handleNext = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
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
      Number.isInteger(page) &&
      page >= 1 &&
      page <= totalPages
    ) {
      setCurrentPage(page);
    }
  };

  /*
   * Create project type success
   */
  const handleCreateSuccess = async (data: unknown) => {
    console.log("Project type created:", data);

    setShowCreateForm(false);
    setCurrentPage(1);

    await fetchProjectTypes();
  };

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {/* =========================
          CREATE FORM
      ========================== */}

      {showCreateForm ? (
        <CreateProjectTypeForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      ) : (
        <>
          {/* =========================
              HEADER
          ========================== */}

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Project Types
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage project types used throughout the system.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Add Project Type
            </button>

          </div>

          {/* =========================
              SEARCH
          ========================== */}

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
                placeholder="Search project types..."
                value={search}
                onChange={(e) =>
                  handleSearch(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />

            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Clear
            </button>

          </div>

          {/* =========================
              LOADING
          ========================== */}

          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
              Loading project types...
            </div>
          )}

          {/* =========================
              ERROR
          ========================== */}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">

              <p>{error}</p>

              <button
                type="button"
                onClick={fetchProjectTypes}
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Try Again
              </button>

            </div>
          )}

          {/* =========================
              TABLE
          ========================== */}

          {!loading && !error && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">

                    <tr>

                      <th className="px-6 py-4 font-semibold">
                        Project Type ID
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Project Type
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                    {currentProjectTypes.length > 0 ? (
                      currentProjectTypes.map((type) => (
                        <tr
                          key={type.ptypeid}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                        >

                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            #{type.ptypeid}
                          </td>

                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {type.projecttype}
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No project types found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">

                {currentProjectTypes.length > 0 ? (
                  currentProjectTypes.map((type) => (
                    <div
                      key={type.ptypeid}
                      className="p-4 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                    >

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Project Type #{type.ptypeid}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {type.projecttype}
                      </p>

                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No project types found.
                  </div>
                )}

              </div>

              {/* =========================
                  PAGINATION
              ========================== */}

              <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between dark:border-gray-700">

                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                  <span>Go to page</span>

                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={handleGoToPage}
                    className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
          )}
        </>
      )}

    </div>
  );
}

export default ProjectTypes;