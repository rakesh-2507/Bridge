import { useEffect, useState } from "react";

import CreateTemplateForm from "../components/forms/CreateTemplateForm";

import {
  getTemplates,
  type Template,
} from "../api/templates";

import {
  getProjectTypes,
  type ProjectType,
} from "../api/projectTypes";

function Templates() {
  const [templates, setTemplates] =
    useState<Template[]>([]);

  const [projectTypes, setProjectTypes] =
    useState<ProjectType[]>([]);

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
   * Load templates and project types
   */
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [
          templatesResponse,
          projectTypesResponse,
        ] = await Promise.all([
          getTemplates(),
          getProjectTypes(),
        ]);

        if (cancelled) return;

        setTemplates(
          templatesResponse.templates
        );

        setProjectTypes(
          projectTypesResponse.projecttypes
        );

        setError("");

      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load templates:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load templates."
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Get project type name
   */
  const getProjectTypeName = (
    projecttypeId: number
  ) => {
    const projectType =
      projectTypes.find(
        (type) =>
          type.ptypeid === projecttypeId
      );

    return (
      projectType?.projecttype ||
      `Project Type #${projecttypeId}`
    );
  };

  /*
   * Search
   */
  const filteredTemplates =
    templates.filter((template) => {
      const projectTypeName =
        getProjectTypeName(
          template.projecttype
        );

      const searchValue =
        search.toLowerCase();

      return (
        template.name
          .toLowerCase()
          .includes(searchValue) ||
        template.name_desc
          .toLowerCase()
          .includes(searchValue) ||
        projectTypeName
          .toLowerCase()
          .includes(searchValue)
      );
    });

  /*
   * Pagination
   */
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTemplates.length /
        itemsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const currentTemplates =
    filteredTemplates.slice(
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
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );
  };

  /*
   * Next
   */
  const handleNext = () => {
    setCurrentPage((page) =>
      Math.min(
        totalPages,
        page + 1
      )
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
   * Create success
   */
  const handleCreateSuccess =
    async (data: unknown) => {
      console.log(
        "Template created:",
        data
      );

      setShowCreateForm(false);
      setCurrentPage(1);

      /*
       * Refresh list
       */
      try {
        const response =
          await getTemplates();

        setTemplates(
          response.templates
        );

        setError("");
      } catch (err) {
        console.error(
          "Failed to refresh templates:",
          err
        );
      }
    };

  /*
   * Retry
   */
  const handleRetry = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        templatesResponse,
        projectTypesResponse,
      ] = await Promise.all([
        getTemplates(),
        getProjectTypes(),
      ]);

      setTemplates(
        templatesResponse.templates
      );

      setProjectTypes(
        projectTypesResponse.projecttypes
      );

    } catch (err) {
      console.error(
        "Failed to load templates:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load templates."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {/* Create Form */}
      {showCreateForm ? (
        <CreateTemplateForm
          onCancel={() =>
            setShowCreateForm(false)
          }
          onSuccess={
            handleCreateSuccess
          }
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Templates
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage project templates and their project types.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateForm(true)
              }
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Add Template
            </button>

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
                placeholder="Search templates..."
                value={search}
                onChange={(e) =>
                  handleSearch(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
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

          {/* Loading */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
              Loading templates...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">

              <p>{error}</p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Try Again
              </button>

            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">

                <table className="w-full text-left text-sm">

                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">

                    <tr>

                      <th className="px-6 py-4 font-semibold">
                        Template ID
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Template Name
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Description
                      </th>

                      <th className="px-6 py-4 font-semibold">
                        Project Type
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                    {currentTemplates.length > 0 ? (
                      currentTemplates.map(
                        (template) => (
                          <tr
                            key={template.tid}
                            className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                          >

                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              #{template.tid}
                            </td>

                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {template.name_desc ||
                                "—"}
                            </td>

                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                              {getProjectTypeName(
                                template.projecttype
                              )}
                            </td>

                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No templates found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">

                {currentTemplates.length > 0 ? (
                  currentTemplates.map(
                    (template) => (
                      <div
                        key={template.tid}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Template #
                          {template.tid}
                        </p>

                        <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>

                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {template.name_desc ||
                            "—"}
                        </p>

                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Project Type
                        </p>

                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {getProjectTypeName(
                            template.projecttype
                          )}
                        </p>

                      </div>
                    )
                  )
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No templates found.
                  </div>
                )}

              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onPageChange={handleGoToPage}
              />

            </div>
          )}
        </>
      )}

    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
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
          onChange={onPageChange}
          className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />

        <span>
          of {totalPages}
        </span>

      </div>

      <div className="flex items-center justify-center gap-2">

        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-gray-600"
        >
          Previous
        </button>

        <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
          Page {currentPage} of{" "}
          {totalPages}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={
            currentPage === totalPages
          }
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-gray-600"
        >
          Next
        </button>

      </div>

    </div>
  );
}

export default Templates;