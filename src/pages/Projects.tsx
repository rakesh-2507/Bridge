import { useState } from "react";
import ProjectTable from "../components/ProjectTable";

function Projects() {
  const [search, setSearch] = useState("");

  const projects = [
    {
      id: 1,
      projectName: "Techonomy",
      coordinator: "John Doe",
      startDate: "01/08/2026",
      endDate: "30/09/2026",
      status: "In Progress",
    },
    {
      id: 2,
      projectName: "AISTGS",
      coordinator: "Jane Smith",
      startDate: "05/08/2026",
      endDate: "15/09/2026",
      status: "Completed",
    },
    {
      id: 3,
      projectName: "Management Portal",
      coordinator: "Alex Kumar",
      startDate: "10/08/2026",
      endDate: "20/10/2026",
      status: "Pending",
    },
  ];

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Projects
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage and view all your projects.
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Add Project
        </button>

      </div>

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
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

        </div>

        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Search
        </button>

      </div>

      <ProjectTable projects={filteredProjects} />

    </div>
  );
}

export default Projects;