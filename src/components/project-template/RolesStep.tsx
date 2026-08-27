import { useState } from "react";
import RoleSelector from "./RoleSelector";
import type { ProjectTemplateFolder } from "../../types/projectTemplate";

interface RolesStepProps {
  folders: ProjectTemplateFolder[];
  setFolders: React.Dispatch<
    React.SetStateAction<ProjectTemplateFolder[]>
  >;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}

function RolesStep({
  folders,
  setFolders,
  onBack,
  onSubmit,
  loading,
}: RolesStepProps) {
  const [availableRoles, setAvailableRoles] =
    useState<string[]>([]);

  const [showRoleForm, setShowRoleForm] =
    useState(false);

  const [newRole, setNewRole] =
    useState("");

  const [roleError, setRoleError] =
    useState("");

  const [assignmentError, setAssignmentError] =
    useState("");

  /*
   * Add a new role
   */
  const handleAddRole = () => {
    const trimmedRole = newRole.trim();

    if (!trimmedRole) {
      setRoleError("Role name is required.");
      return;
    }

    const duplicateRole =
      availableRoles.some(
        (role) =>
          role.toLowerCase() ===
          trimmedRole.toLowerCase()
      );

    if (duplicateRole) {
      setRoleError(
        `Role "${trimmedRole}" already exists.`
      );
      return;
    }

    setAvailableRoles((prev) => [
      ...prev,
      trimmedRole,
    ]);

    setNewRole("");
    setRoleError("");
    setShowRoleForm(false);
  };

  /*
   * Update roles assigned to a folder
   */
  const updateRoles = (
    folderId: string,
    roles: string[]
  ) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              roles,
            }
          : folder
      )
    );

    // Clear the general assignment error
    // when the user starts fixing roles.
    setAssignmentError("");
  };

  /*
   * Validate that every folder has at least
   * one role assigned.
   */
  const validateRoles = () => {
    if (availableRoles.length === 0) {
      return "Please create at least one role.";
    }

    const foldersWithoutRoles =
      folders.filter(
        (folder) =>
          folder.roles.length === 0
      );

    if (foldersWithoutRoles.length > 0) {
      const names =
        foldersWithoutRoles
          .map((folder) => folder.name)
          .join(", ");

      return `No role assigned to: ${names}.`;
    }

    return "";
  };

  /*
   * Validate before final submission
   */
  const handleSubmit = () => {
    const error = validateRoles();

    if (error) {
      setAssignmentError(error);
      return;
    }

    setAssignmentError("");
    onSubmit();
  };

  /*
   * Render folder hierarchy
   */
  const renderFolder = (
    folder: ProjectTemplateFolder,
    level = 0
  ) => {
    const children = folders.filter(
      (item) =>
        item.parentFolderId === folder.id
    );

    const hasNoRoles =
      folder.roles.length === 0;

    return (
      <div
        key={folder.id}
        className="space-y-3"
      >
        <div
          style={{
            marginLeft: `${level * 32}px`,
          }}
          className={`border rounded-xl p-5 bg-white ${
            hasNoRoles
              ? "border-red-300"
              : "border-gray-200"
          }`}
        >
          {/* Folder name */}
          <h3 className="font-semibold mb-3">
            {folder.name}
          </h3>

          {/* Role buttons */}
          {availableRoles.length > 0 ? (
            <RoleSelector
              roles={availableRoles}
              selectedRoles={folder.roles}
              onChange={(roles) =>
                updateRoles(
                  folder.id,
                  roles
                )
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              No roles created yet.
            </p>
          )}

          
          {/* Selected roles */}
          {folder.roles.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Selected:{" "}
              {folder.roles.join(", ")}
            </p>
          )}
        </div>

        {/* Subfolders */}
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
          Create Roles & Assign Folders
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Create roles and assign one or more
          roles to every folder and subfolder.
        </p>
      </div>

      {/* Roles section */}
      <div className="border rounded-xl p-5 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Available Roles
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Create roles that can be assigned
              to folders.
            </p>
          </div>

          {!showRoleForm && (
            <button
              type="button"
              onClick={() => {
                setShowRoleForm(true);
                setRoleError("");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              + Add Role
            </button>
          )}
        </div>

        {/* Add Role Form */}
        {showRoleForm && (
          <div className="mt-4 border rounded-lg p-4 bg-white">
            <label className="block text-sm font-medium mb-1">
              Role Name
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRole}
                onChange={(e) => {
                  setNewRole(e.target.value);
                  setRoleError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRole();
                  }
                }}
                placeholder="e.g. Editor"
                className={`flex-1 border rounded-lg px-3 py-2 ${
                  roleError
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                autoFocus
              />

              <button
                type="button"
                onClick={handleAddRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(false);
                  setNewRole("");
                  setRoleError("");
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
            </div>

            {roleError && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-sm text-red-600">
                  ❌ {roleError}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Created roles */}
        {availableRoles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              Created Roles
            </p>

            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assignment error */}
      {assignmentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">
            ❌ {assignmentError}
          </p>
        </div>
      )}

      {/* Folder assignments */}
      <div>
        <h3 className="font-semibold mb-3">
          Assign Roles to Folders
        </h3>

        {rootFolders.length > 0 ? (
          <div className="space-y-4">
            {rootFolders.map((folder) =>
              renderFolder(folder)
            )}
          </div>
        ) : (
          <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
            No folders available.
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-5 py-2.5 border rounded-lg disabled:opacity-50"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            loading ||
            folders.length === 0
          }
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : "Create Template"}
        </button>
      </div>
    </div>
  );
}

export default RolesStep;