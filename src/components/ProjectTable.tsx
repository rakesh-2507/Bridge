import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project } from "../api/projects";

interface ProjectTableProps {
  projects: Project[];
}

function ProjectTable({ projects }: ProjectTableProps) {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const totalPages = Math.max(
    1,
    Math.ceil(projects.length / itemsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;

  const currentProjects = projects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePrevious = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const handleNext = () => {
    setCurrentPage((page) =>
      Math.min(totalPages, page + 1)
    );
  };

  const handleGoToPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === "") {
      return;
    }

    const page = Number(value);

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden overflow-x-auto md:block">

        <table className="w-full text-left text-sm">

          <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">
            <tr>

              <th className="px-6 py-4 font-semibold">
                Project ID
              </th>

              <th className="px-6 py-4 font-semibold">
                Project Name
              </th>

              <th className="px-6 py-4 font-semibold">
                Coordinator
              </th>

              <th className="px-6 py-4 font-semibold">
                Project No.
              </th>

              <th className="px-6 py-4 font-semibold">
                Department
              </th>

              <th className="px-6 py-4 font-semibold">
                Status
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

            {currentProjects.length > 0 ? (

              currentProjects.map((project) => (

                <tr
                  key={project.project_id}
                  onClick={() =>
                    handleProjectClick(project.project_id)
                  }
                  className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >

                  {/* Project ID */}
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    #{project.project_id}
                  </td>

                  {/* Project Name */}
                  <td className="px-6 py-4">

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleProjectClick(
                          project.project_id
                        );
                      }}
                      className="font-medium text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {project.projectname ||
                        "Unnamed Project"}
                    </button>

                  </td>

                  {/* Coordinator */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {project.coordinator ?? "—"}
                  </td>

                  {/* Project Number */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {project.projectno || "—"}
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {project.department || "—"}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={project.status}
                    />
                  </td>

                </tr>

              ))

            ) : (

              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No projects found.
                </td>
              </tr>

            )}

          </tbody>

        </table>

      </div>


      {/* ================= MOBILE CARDS ================= */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 md:hidden">

        {currentProjects.length > 0 ? (

          currentProjects.map((project) => (

            <button
              key={project.project_id}
              type="button"
              onClick={() =>
                handleProjectClick(project.project_id)
              }
              className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >

              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Project #{project.project_id}
                  </p>

                  <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {project.projectname ||
                      "Unnamed Project"}
                  </h3>

                </div>

                <StatusBadge
                  status={project.status}
                />

              </div>


              <div className="mt-4 grid grid-cols-2 gap-4">

                {/* Coordinator */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Coordinator
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {project.coordinator ?? "—"}
                  </p>
                </div>


                {/* Project Number */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Project No.
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {project.projectno || "—"}
                  </p>
                </div>


                {/* Department */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Department
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {project.department || "—"}
                  </p>
                </div>


                {/* Company ID */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Company ID
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {project.cid ?? "—"}
                  </p>
                </div>

              </div>

            </button>

          ))

        ) : (

          <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No projects found.
          </div>

        )}

      </div>


      {/* ================= PAGINATION ================= */}
      <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between dark:border-gray-700">

        {/* Go to page */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">

          <span>
            Go to page
          </span>

          <input
            type="number"
            min={1}
            max={totalPages}
            value={safeCurrentPage}
            onChange={handleGoToPage}
            className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />

          <span>
            of {totalPages}
          </span>

        </div>


        {/* Previous / Next */}
        <div className="flex items-center justify-center gap-2">

          <button
            type="button"
            onClick={handlePrevious}
            disabled={safeCurrentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Previous
          </button>


          <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
            Page {safeCurrentPage} of {totalPages}
          </span>


          <button
            type="button"
            onClick={handleNext}
            disabled={safeCurrentPage === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}


/* ================= STATUS BADGE ================= */

function StatusBadge({
  status,
}: {
  status?: number;
}) {

  const statusMap: Record<
    number,
    {
      label: string;
      styles: string;
    }
  > = {

    0: {
      label: "Pending",
      styles:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    },

    1: {
      label: "In Progress",
      styles:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },

    2: {
      label: "Completed",
      styles:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    },

  };

  const currentStatus =
    status !== undefined
      ? statusMap[status]
      : undefined;

  const label =
    currentStatus?.label ?? "Unknown";

  const styles =
    currentStatus?.styles ??
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export default ProjectTable;