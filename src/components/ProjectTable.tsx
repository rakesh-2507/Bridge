interface Project {
  id: number;
  filename: string;
  updatedby: string;
  size: string;
  date: string;
}

interface ProjectTableProps {
  projects: Project[];
}

function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[800px] text-left text-sm">

          <thead className="bg-gray-50 text-xs uppercase text-gray-500">

            <tr>
              <th className="px-6 py-4 font-semibold">
                ID
              </th>

              <th className="px-6 py-4 font-semibold">
                File Name / Folder
              </th>

              <th className="px-6 py-4 font-semibold">
                Updated By
              </th>

              <th className="px-6 py-4 font-semibold">
                Size
              </th>

              <th className="px-6 py-4 font-semibold">
                Date
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
                  {project.filename}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.updatedby}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.size}
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {project.date}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default ProjectTable;