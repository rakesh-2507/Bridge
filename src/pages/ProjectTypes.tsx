import { useState } from "react";
import CreateProjectTypeForm from "../components/forms/CreateProjectTypeForm";

interface ProjectType {
  id: number;
  projecttype: string;
}

function ProjectTypes() {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const projectTypes: ProjectType[] = [
    {
      id: 1,
      projecttype: "Software Development",
    },
    {
      id: 2,
      projecttype: "Web Development",
    },
    {
      id: 3,
      projecttype: "Mobile Application",
    },
    {
      id: 4,
      projecttype: "Research",
    },
    {
      id: 5,
      projecttype: "Consulting",
    },
  ];

  const filteredProjectTypes = projectTypes.filter((type) =>
    type.projecttype.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProjectTypes.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentProjectTypes = filteredProjectTypes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

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

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {showCreateForm ? (

        <CreateProjectTypeForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={(data) => {
            console.log("Project type created:", data);
            setShowCreateForm(false);
          }}
        />

      ) : (

        <>
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
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

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

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

                  {currentProjectTypes.map((type) => (

                    <tr
                      key={type.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >

                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        #{type.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {type.projecttype}
                      </td>

                    </tr>

                  ))}

                  {currentProjectTypes.length === 0 && (
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

            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

              {currentProjectTypes.map((type) => (

                <div
                  key={type.id}
                  className="p-4 transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Project Type #{type.id}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {type.projecttype}
                  </p>

                </div>

              ))}

            </div>

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

                <span>of {totalPages}</span>

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

export default ProjectTypes;