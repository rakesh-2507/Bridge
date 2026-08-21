import { useEffect, useState } from "react";

import {
  createTemplate,
  type CreateTemplateData,
} from "../../api/templates";

import {
  getProjectTypes,
  type ProjectType,
} from "../../api/projectTypes";

interface CreateTemplateFormProps {
  onCancel?: () => void;
  onSuccess?: (data: unknown) => void;
}

interface CreateTemplateFormData {
  name: string;
  name_desc: string;
  projecttype: string;
}

function CreateTemplateForm({
  onCancel,
  onSuccess,
}: CreateTemplateFormProps) {
  const [formData, setFormData] =
    useState<CreateTemplateFormData>({
      name: "",
      name_desc: "",
      projecttype: "",
    });

  const [projectTypes, setProjectTypes] =
    useState<ProjectType[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingProjectTypes, setLoadingProjectTypes] =
    useState(true);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTemplateFormData, string>>
  >({});

  /*
   * Load project types for dropdown
   */
  useEffect(() => {
    let cancelled = false;

    const loadProjectTypes = async () => {
      try {
        const response = await getProjectTypes();

        if (cancelled) return;

        setProjectTypes(response.projecttypes);
      } catch (err) {
        console.error(
          "Failed to load project types:",
          err
        );
      } finally {
        if (!cancelled) {
          setLoadingProjectTypes(false);
        }
      }
    };

    loadProjectTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Handle input changes
   */
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

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /*
   * Submit
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const newErrors: Partial<
      Record<keyof CreateTemplateFormData, string>
    > = {};

    if (!formData.name.trim()) {
      newErrors.name =
        "Template name is required.";
    }

    if (!formData.projecttype) {
      newErrors.projecttype =
        "Project type is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: CreateTemplateData = {
        name: formData.name.trim(),
        name_desc: formData.name_desc.trim(),
        projecttype: Number(formData.projecttype),
      };

      console.log(
        "Creating template:",
        payload
      );

      const response = await createTemplate(
        payload
      );

      console.log(
        "Template created successfully:",
        response
      );

      onSuccess?.(response);

    } catch (err) {
      console.error(
        "Create template error:",
        err
      );

      setErrors({
        name:
          err instanceof Error
            ? err.message
            : "Failed to create template.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Template
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new template and assign it to a project type.
        </p>

      </div>

      {/* Error */}
      {errors.name &&
        !formData.name.trim() && (
          <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {errors.name}
          </div>
        )}

      <form onSubmit={handleSubmit}>

        <div className="grid gap-6 p-6">

          {/* Template Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Template Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter template name"
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />

            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="name_desc"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Template Description
            </label>

            <textarea
              id="name_desc"
              name="name_desc"
              rows={4}
              value={formData.name_desc}
              onChange={handleChange}
              placeholder="Enter template description"
              disabled={loading}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Project Type */}
          <div>
            <label
              htmlFor="projecttype"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Type{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <select
              id="projecttype"
              name="projecttype"
              value={formData.projecttype}
              onChange={handleChange}
              disabled={
                loading ||
                loadingProjectTypes
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >

              <option value="">
                {loadingProjectTypes
                  ? "Loading project types..."
                  : "Select project type"}
              </option>

              {projectTypes.map(
                (projectType) => (
                  <option
                    key={
                      projectType.ptypeid
                    }
                    value={
                      projectType.ptypeid
                    }
                  >
                    {projectType.projecttype}
                  </option>
                )
              )}

            </select>

            {errors.projecttype && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.projecttype}
              </p>
            )}
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              loadingProjectTypes
            }
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {loading
              ? "Creating..."
              : "Create Template"}
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateTemplateForm;