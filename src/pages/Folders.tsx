import { useState } from "react";
import CreateFolderForm from "../components/forms/CreateFolderForm";

interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  templateId: number;
  description: string;
}

function Folders() {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const folders: Folder[] = [
    {
      id: 1,
      name: "Documents",
      parentId: null,
      templateId: 1,
      description: "Main documents section",
    },
    {
      id: 2,
      name: "Requirements",
      parentId: 1,
      templateId: 1,
      description: "Project requirements",
    },
    {
      id: 3,
      name: "Development",
      parentId: 1,
      templateId: 1,
      description: "Development documents",
    },
    {
      id: 4,
      name: "Reports",
      parentId: null,
      templateId: 2,
      description: "Project reports",
    },
  ];

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFolders.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentFolders = filteredFolders.slice(
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

        <CreateFolderForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={(data) => {
            console.log("Folder created:", data);
            setShowCreateForm(false);
          }}
        />

      ) : (

        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Folders
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Manage template folders and document sections.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              Add Folder
            </button>

          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">

            <div className="relative w-full sm:max-w-md">

              <input
                type="text"
                placeholder="Search folders..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />

            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                      Folder ID
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Folder Name
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Parent Folder
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Template ID
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      Description
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                  {currentFolders.map((folder) => (

                    <tr
                      key={folder.id}
                      className="transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >

                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        #{folder.id}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {folder.parentId ? `#${folder.parentId}` : "Root"}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        #{folder.templateId}
                      </td>

                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {folder.description}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-700">

              {currentFolders.map((folder) => (

                <div
                  key={folder.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                >

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Folder #{folder.id}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold">
                    {folder.name}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Parent
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {folder.parentId
                          ? `#${folder.parentId}`
                          : "Root"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Template
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        #{folder.templateId}
                      </p>
                    </div>

                  </div>

                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    {folder.description}
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
                  className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />

                <span>of {totalPages}</span>
              </div>

              <div className="flex items-center justify-center gap-2">

                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
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
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-gray-600"
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

export default Folders;