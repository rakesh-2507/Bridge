import { useState } from "react";
import {
  createProject,
  type CreateProjectData,
} from "../../api/projects";

interface AddProjectFormProps {
  onCancel?: () => void;
  onSuccess?: (data: unknown) => void;
}

interface ProjectFormData {
  tid: string;
  cid: string;
  member_id: string;
  projectname: string;
  projectdesc: string;
  coordinator: string;
  is_project_manage: string;
  po: string;
  costhead: string;
  projectno: string;
  projecttype: string;
  department: string;
}

function AddProjectForm({
  onCancel,
  onSuccess,
}: AddProjectFormProps) {
  const [formData, setFormData] =
    useState<ProjectFormData>({
      tid: "",
      cid: "",
      member_id: "",
      projectname: "",
      projectdesc: "",
      coordinator: "",
      is_project_manage: "",
      po: "",
      costhead: "",
      projectno: "",
      projecttype: "",
      department: "",
    });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    // Validate required fields
    if (!formData.tid.trim()) {
      setError("Template ID is required.");
      return;
    }

    if (!formData.cid.trim()) {
      setError("Company ID is required.");
      return;
    }

    if (!formData.projectname.trim()) {
      setError("Project name is required.");
      return;
    }

    const tid = Number(formData.tid);
    const cid = Number(formData.cid);

    if (!Number.isInteger(tid) || tid <= 0) {
      setError("Template ID must be a valid positive number.");
      return;
    }

    if (!Number.isInteger(cid) || cid <= 0) {
      setError("Company ID must be a valid positive number.");
      return;
    }

    setLoading(true);

    try {
      const payload: CreateProjectData = {
        tid,
        cid,
        projectname: formData.projectname.trim(),
      };

      if (formData.member_id.trim()) {
        payload.member_id = Number(formData.member_id);
      }

      if (formData.coordinator.trim()) {
        payload.coordinator = Number(
          formData.coordinator
        );
      }

      if (formData.is_project_manage !== "") {
        payload.is_project_manage = Number(
          formData.is_project_manage
        );
      }

      if (formData.projecttype.trim()) {
        payload.projecttype = Number(
          formData.projecttype
        );
      }

      if (formData.projectdesc.trim()) {
        payload.projectdesc =
          formData.projectdesc.trim();
      }

      if (formData.po.trim()) {
        payload.po = formData.po.trim();
      }

      if (formData.costhead.trim()) {
        payload.costhead =
          formData.costhead.trim();
      }

      if (formData.projectno.trim()) {
        payload.projectno =
          formData.projectno.trim();
      }

      if (formData.department.trim()) {
        payload.department =
          formData.department.trim();
      }

      console.log("Create project payload:", payload);

      const response = await createProject(payload);

      console.log(
        "Project created successfully:",
        response
      );

      onSuccess?.(response);
    } catch (err) {
      console.error(
        "Create project error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-white";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Create Project
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the project details below.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Template ID */}
          <div>
            <label
              htmlFor="tid"
              className={labelClass}
            >
              Template ID{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              id="tid"
              name="tid"
              type="number"
              min="1"
              value={formData.tid}
              onChange={handleChange}
              placeholder="Enter template ID"
              disabled={loading}
              required
              className={inputClass}
            />
          </div>

          {/* Company ID */}
          <div>
            <label
              htmlFor="cid"
              className={labelClass}
            >
              Company ID{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              id="cid"
              name="cid"
              type="number"
              min="1"
              value={formData.cid}
              onChange={handleChange}
              placeholder="Enter company ID"
              disabled={loading}
              required
              className={inputClass}
            />
          </div>

          {/* Member ID */}
          <div>
            <label
              htmlFor="member_id"
              className={labelClass}
            >
              Member ID
            </label>

            <input
              id="member_id"
              name="member_id"
              type="number"
              min="1"
              value={formData.member_id}
              onChange={handleChange}
              placeholder="Enter member ID"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Coordinator */}
          <div>
            <label
              htmlFor="coordinator"
              className={labelClass}
            >
              Coordinator User ID
            </label>

            <input
              id="coordinator"
              name="coordinator"
              type="number"
              min="1"
              value={formData.coordinator}
              onChange={handleChange}
              placeholder="Enter coordinator user ID"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Project Name */}
          <div className="md:col-span-2">
            <label
              htmlFor="projectname"
              className={labelClass}
            >
              Project Name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              id="projectname"
              name="projectname"
              type="text"
              value={formData.projectname}
              onChange={handleChange}
              placeholder="Enter project name"
              disabled={loading}
              required
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label
              htmlFor="projectdesc"
              className={labelClass}
            >
              Project Description
            </label>

            <textarea
              id="projectdesc"
              name="projectdesc"
              rows={4}
              value={formData.projectdesc}
              onChange={handleChange}
              placeholder="Enter project description"
              disabled={loading}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Project Management */}
          <div>
            <label
              htmlFor="is_project_manage"
              className={labelClass}
            >
              Project Management
            </label>

            <select
              id="is_project_manage"
              name="is_project_manage"
              value={formData.is_project_manage}
              onChange={handleChange}
              disabled={loading}
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          {/* PO */}
          <div>
            <label
              htmlFor="po"
              className={labelClass}
            >
              PO / Reference
            </label>

            <input
              id="po"
              name="po"
              type="text"
              value={formData.po}
              onChange={handleChange}
              placeholder="e.g. MUSE-AUG-2026"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Cost Head */}
          <div>
            <label
              htmlFor="costhead"
              className={labelClass}
            >
              Cost Head
            </label>

            <input
              id="costhead"
              name="costhead"
              type="text"
              value={formData.costhead}
              onChange={handleChange}
              placeholder="e.g. Magazine"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Project Number */}
          <div>
            <label
              htmlFor="projectno"
              className={labelClass}
            >
              Project Number
            </label>

            <input
              id="projectno"
              name="projectno"
              type="text"
              value={formData.projectno}
              onChange={handleChange}
              placeholder="e.g. MUSE-2026-68"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Project Type */}
          <div>
            <label
              htmlFor="projecttype"
              className={labelClass}
            >
              Project Type ID
            </label>

            <input
              id="projecttype"
              name="projecttype"
              type="number"
              min="1"
              value={formData.projecttype}
              onChange={handleChange}
              placeholder="Enter project type ID"
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="department"
              className={labelClass}
            >
              Department
            </label>

            <input
              id="department"
              name="department"
              type="text"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. MuseEditorial"
              disabled={loading}
              className={inputClass}
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>

        </div>
      </form>
    </div>
  );
}

export default AddProjectForm;