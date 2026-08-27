import { useState } from "react";
import FolderForm from "./FolderForm";
import type { ProjectTemplateFolder } from "../../types/projectTemplate";

interface FoldersStepProps {
  folders: ProjectTemplateFolder[];
  setFolders: React.Dispatch<
    React.SetStateAction<ProjectTemplateFolder[]>
  >;
  onBack: () => void;
  onNext: () => void;
}

function FoldersStep({
  folders,
  setFolders,
  onBack,
  onNext,
}: FoldersStepProps) {
  const [showForm, setShowForm] = useState(false);
  const [validationError, setValidationError] =
    useState("");

  const addFolder = (
    folder: ProjectTemplateFolder
  ) => {
    setFolders((prev) => [...prev, folder]);
    setValidationError("");
    setShowForm(false);
  };

  const removeFolder = (id: string) => {
    const hasChildren = folders.some(
      (folder) =>
        folder.parentFolderId === id
    );

    if (hasChildren) {
      setValidationError(
        "Please remove the subfolders before removing this folder."
      );
      return;
    }

    setFolders((prev) =>
      prev.filter(
        (folder) => folder.id !== id
      )
    );

    setValidationError("");
  };

  /*
   * Final validation of the complete folder tree.
   */
  const validateFolders = () => {
    if (folders.length === 0) {
      return "Please add at least one folder.";
    }

    // Check empty names
    const emptyFolder = folders.find(
      (folder) => !folder.name.trim()
    );

    if (emptyFolder) {
      return "Every folder must have a name.";
    }

    // Check duplicate names at the same level
    for (let i = 0; i < folders.length; i++) {
      for (let j = i + 1; j < folders.length; j++) {
        const first = folders[i];
        const second = folders[j];

        const sameParent =
          first.parentFolderId ===
          second.parentFolderId;

        const sameName =
          first.name.trim().toLowerCase() ===
          second.name.trim().toLowerCase();

        if (sameParent && sameName) {
          if (first.parentFolderId === null) {
            return `Duplicate root folder: "${first.name}".`;
          }

          const parent = folders.find(
            (folder) =>
              folder.id === first.parentFolderId
          );

          return `Duplicate folder "${first.name}" under "${parent?.name}".`;
        }
      }
    }

    // Check that every parent exists
    for (const folder of folders) {
      if (folder.parentFolderId) {
        const parentExists = folders.some(
          (item) =>
            item.id === folder.parentFolderId
        );

        if (!parentExists) {
          return `Invalid parent folder for "${folder.name}".`;
        }
      }
    }

    return "";
  };

  const handleNext = () => {
    const error = validateFolders();

    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError("");
    onNext();
  };

  const renderFolder = (
    folder: ProjectTemplateFolder,
    level = 0
  ) => {
    const children = folders.filter(
      (item) =>
        item.parentFolderId === folder.id
    );

    return (
      <div
        key={folder.id}
        className="space-y-2"
      >
        <div
          style={{
            marginLeft: `${level * 32}px`,
          }}
          className="border rounded-lg p-4 bg-white flex items-center justify-between"
        >
          <div>
            <h3 className="font-medium">
              {folder.name}
            </h3>

            {folder.description && (
              <p className="text-sm text-gray-500">
                {folder.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              removeFolder(folder.id)
            }
            className="text-red-600 text-sm"
          >
            Remove
          </button>
        </div>

        {children.map((child) =>
          renderFolder(
            child,
            level + 1
          )
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(
    (folder) =>
      folder.parentFolderId === null
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">
          Create Folders & Subfolders
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Build the folder structure for this
          template.
        </p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            ❌ {validationError}
          </p>
        </div>
      )}

      {/* Folder Tree */}
      {folders.length === 0 ? (
        <div className="border border-dashed rounded-xl p-10 text-center text-gray-500">
          No folders added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rootFolders.map((folder) =>
            renderFolder(folder)
          )}
        </div>
      )}

      {/* Add Folder Form */}
      {showForm && (
        <FolderForm
          folders={folders}
          onAdd={addFolder}
          onCancel={() =>
            setShowForm(false)
          }
        />
      )}

      {/* Add Folder Button */}
      {!showForm && (
        <button
          type="button"
          onClick={() => {
            setValidationError("");
            setShowForm(true);
          }}
          className="border border-blue-600 text-blue-600 px-5 py-2.5 rounded-lg"
        >
          + Add Folder
        </button>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border rounded-lg"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={folders.length === 0}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Next: Roles →
        </button>
      </div>
    </div>
  );
}

export default FoldersStep;