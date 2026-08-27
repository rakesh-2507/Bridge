import { useState } from "react";
import type { ProjectTemplateFolder } from "../../types/projectTemplate";

interface FolderFormProps {
  folders: ProjectTemplateFolder[];
  onAdd: (folder: ProjectTemplateFolder) => void;
  onCancel: () => void;
}

function FolderForm({
  folders,
  onAdd,
  onCancel,
}: FolderFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(
    null
  );

  const trimmedName = name.trim();

  const duplicateFolder = folders.find(
    (folder) =>
      folder.name.trim().toLowerCase() ===
        trimmedName.toLowerCase() &&
      folder.parentFolderId === parentFolderId
  );

  let nameError = "";

  if (trimmedName && duplicateFolder) {
    if (parentFolderId) {
      const parentFolder = folders.find(
        (folder) => folder.id === parentFolderId
      );

      nameError = `A folder named "${trimmedName}" already exists under "${parentFolder?.name}".`;
    } else {
      nameError = `A root folder named "${trimmedName}" already exists.`;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trimmedName) {
      return;
    }

    if (nameError) {
      return;
    }

    onAdd({
      id: crypto.randomUUID(),
      name: trimmedName,
      description: description.trim(),
      parentFolderId,
      roles: [],
    });

    setName("");
    setDescription("");
    setParentFolderId(null);
  };

  const isValid =
    trimmedName.length > 0 && !nameError;

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-xl p-5 bg-gray-50 space-y-4"
    >
      <h3 className="font-semibold">
        Add Folder
      </h3>

      {/* Folder Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Folder Name
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Editorial"
          className={`w-full border rounded-lg px-3 py-2 ${
            nameError
              ? "border-red-500"
              : "border-gray-300"
          }`}
        />

        {nameError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600">
              ❌ {nameError}
            </p>
          </div>
        )}

        {!nameError && trimmedName && (
          <p className="text-sm text-green-600 mt-1">
            ✓ Folder name is available
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Folder description"
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* Parent Folder */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Parent Folder
        </label>

        <select
          value={parentFolderId ?? ""}
          onChange={(e) =>
            setParentFolderId(
              e.target.value || null
            )
          }
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">
            Root Folder
          </option>

          {folders.map((folder) => (
            <option
              key={folder.id}
              value={folder.id}
            >
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!isValid}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Folder
        </button>
      </div>
    </form>
  );
}

export default FolderForm;