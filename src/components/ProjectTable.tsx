import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: number;
  projectName: string;
  coordinator: string;
  startDate: string;
  endDate: string;
  status: string;
}

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

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentProjects = projects.slice(
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

  const handleGoToPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = Number(e.target.value);

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

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
                Start Date
              </th>

              <th className="px-6 py-4 font-semibold">
                End Date
              </th>

              <th className="px-6 py-4 font-semibold">
                Status
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

            {currentProjects.map((project) => (

              <tr
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >

                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  #{project.id}
                </td>

                <td className="px-6 py-4">

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectClick(project.id);
                    }}
                    className="font-medium text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {project.projectName}
                  </button>

                </td>

                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {project.coordinator}
                </td>

                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {project.startDate}
                </td>

                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {project.endDate}
                </td>

                <td className="px-6 py-4">

                  <StatusBadge status={project.status} />

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

        {currentProjects.map((project) => (

          <button
            key={project.id}
            type="button"
            onClick={() => handleProjectClick(project.id)}
            className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-900"
          >

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Project #{project.id}
                </p>

                <h3 className="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {project.projectName}
                </h3>

              </div>

              <StatusBadge status={project.status} />

            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Coordinator
                </p>

                <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                  {project.coordinator}
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Start Date
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {project.startDate}
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  End Date
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {project.endDate}
                </p>
              </div>


              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Project ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                  #{project.id}
                </p>
              </div>

            </div>

          </button>

        ))}

      </div>

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
  );
}

function StatusBadge({ status }: { status: string }) {

  const styles =
    status === "Completed"
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : status === "In Progress"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
      : status === "Pending"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

export default ProjectTable;