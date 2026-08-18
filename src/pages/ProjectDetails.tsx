import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface ProjectFile {
  id: number;
  name: string;
  type: "folder" | "pdf" | "doc" | "image" | "text";
  updatedBy: string;
  size: string;
  pages?: number;
  date: string;
}

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentFolder, setCurrentFolder] = useState("Project Files");

  const project = {
    id: Number(id),
    name: "Techonomy",
    coordinator: "John Doe",
    startDate: "01/08/2026",
    endDate: "30/09/2026",
    status: "In Progress",
  };

  const files: ProjectFile[] = [
    {
      id: 1,
      name: "Project Documents",
      type: "folder",
      updatedBy: "John Doe",
      size: "-",
      date: "18/08/2026",
    },
    {
      id: 2,
      name: "Design Assets",
      type: "folder",
      updatedBy: "John Doe",
      size: "-",
      date: "17/08/2026",
    },
    {
      id: 3,
      name: "Requirements.pdf",
      type: "pdf",
      updatedBy: "John Doe",
      size: "2.7 MB",
      pages: 12,
      date: "18/08/2026",
    },
    {
      id: 4,
      name: "Project Specification.docx",
      type: "doc",
      updatedBy: "System Administrator",
      size: "1.2 MB",
      pages: 8,
      date: "17/08/2026",
    },
    {
      id: 5,
      name: "homepage.png",
      type: "image",
      updatedBy: "John Doe",
      size: "850 KB",
      date: "16/08/2026",
    },
    {
      id: 6,
      name: "project-notes.txt",
      type: "text",
      updatedBy: "System Administrator",
      size: "14 KB",
      date: "15/08/2026",
    },
  ];

  const getFileIcon = (type: ProjectFile["type"]) => {
    if (type === "folder") {
      return (
        <svg
          className="h-5 w-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
        </svg>
      );
    }

    if (type === "pdf") {
      return (
        <span className="text-xs font-bold text-red-500">
          PDF
        </span>
      );
    }

    if (type === "doc") {
      return (
        <span className="text-xs font-bold text-blue-500">
          DOC
        </span>
      );
    }

    if (type === "image") {
      return (
        <span className="text-xs font-bold text-purple-500">
          IMG
        </span>
      );
    }

    return (
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
        TXT
      </span>
    );
  };

  const handleFileClick = (file: ProjectFile) => {
    if (file.type === "folder") {
      setCurrentFolder(file.name);
    }
  };

  return (
    <div className="mx-auto">

      <button
        type="button"
        onClick={() => navigate("/projects")}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>

        Back to Projects
      </button>


      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

        <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between dark:border-gray-700">

          <div className="min-w-0">

            <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {project.name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">

              <button
                type="button"
                onClick={() => setCurrentFolder("Project Files")}
                className="transition hover:text-gray-900 dark:hover:text-white"
              >
                Project Files
              </button>

              {currentFolder !== "Project Files" && (
                <>
                  <span>/</span>

                  <span className="truncate">
                    {currentFolder}
                  </span>
                </>
              )}

            </div>

          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

            <button
              type="button"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Create Folder
            </button>

            <button
              type="button"
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 sm:w-auto dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Upload Files
            </button>

          </div>

        </div>

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-200">

              <tr>

                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>

                <th className="px-6 py-4 font-semibold">
                  File / Folder Name
                </th>

                <th className="px-6 py-4 font-semibold">
                  Updated By
                </th>

                <th className="px-6 py-4 font-semibold">
                  Size
                </th>

                <th className="px-6 py-4 font-semibold">
                  Pages
                </th>

                <th className="px-6 py-4 font-semibold">
                  Date
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

              {files.map((file) => (

                <tr
                  key={file.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >

                  <td className="px-6 py-4">

                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />

                  </td>


                  <td className="px-6 py-4">

                    <button
                      type="button"
                      onClick={() => handleFileClick(file)}
                      className="flex items-center gap-3 font-medium text-gray-900 transition hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                        {getFileIcon(file.type)}
                      </span>

                      <span className="truncate">
                        {file.name}
                      </span>

                    </button>

                  </td>


                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {file.updatedBy}
                  </td>


                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {file.size}
                  </td>


                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {file.pages ?? "-"}
                  </td>


                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {file.date}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

          {files.map((file) => (

            <div
              key={file.id}
              className="p-4 transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >

              <div className="flex items-start gap-3">

                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />

                <button
                  type="button"
                  onClick={() => handleFileClick(file)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    {getFileIcon(file.type)}
                  </span>

                  <span className="min-w-0">

                    <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {file.name}
                    </span>

                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {file.type === "folder" ? "Folder" : file.type.toUpperCase()}
                    </span>

                  </span>

                </button>

              </div>

              <div className="mt-4 ml-7 grid grid-cols-2 gap-x-4 gap-y-3">

                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Updated By
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {file.updatedBy}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Size
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {file.size}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pages
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {file.pages ?? "-"}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {file.date}
                  </p>

                </div>

              </div>

            </div>

          ))}

        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700 dark:bg-gray-900">

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {files.length} items
          </div>


          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

            <button
              type="button"
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Delete Files
            </button>


            <button
              type="button"
              className="w-full rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:w-auto dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Delete All Files
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ProjectDetails;