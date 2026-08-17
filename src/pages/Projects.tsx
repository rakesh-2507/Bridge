import ProjectTable from "../components/ProjectTable";

function Projects() {

  const projects = [
    {
      id: 1,
      filename: "image.png",
      updatedby: "Super Admin",
      size: "4000kb",
      date: "25/07/2001",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

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
          className="rounded-lg bg-gray-900 px-3 py-1 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Add Project
        </button>

      </div>

      <ProjectTable projects={projects} />

    </div>
  );
}

export default Projects;