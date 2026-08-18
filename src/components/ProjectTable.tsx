import { useState } from "react";

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = 5;

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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">

          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
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

          <tbody className="divide-y divide-gray-200">
            {projects.map((project) => (
              <tr
                key={project.id}
                className="transition hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  #{project.id}
                </td>

                <td className="px-6 py-4 font-medium text-gray-900">
                  {project.projectName}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.coordinator}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.startDate}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.endDate}
                </td>

                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Go To Page */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Go to page</span>

          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={handleGoToPage}
            className="w-14 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm outline-none focus:border-gray-500"
          />

          <span>of {totalPages}</span>
        </div>

        {/* Previous / Next */}
        <div className="flex items-center gap-2">

          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProjectTable;