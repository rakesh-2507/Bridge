import { useState } from "react";

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
  const [formData, setFormData] = useState<CreateTemplateFormData>({
    name: "",
    name_desc: "",
    projecttype: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTemplateFormData, string>>
  >({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required.";
    }

    if (!formData.projecttype) {
      newErrors.projecttype = "Project type is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Template:", formData);

    onSuccess?.({
      ...formData,
      projecttype: Number(formData.projecttype),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Template
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new template and assign it to a project type.
        </p>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="grid gap-6 p-6">

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Template Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter template name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />

            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.name}
              </p>
            )}
          </div>

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
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="projecttype"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Project Type <span className="text-red-500">*</span>
            </label>

            <select
              id="projecttype"
              name="projecttype"
              value={formData.projecttype}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                Select project type
              </option>

              <option value="1">
                Project Type 1
              </option>

              <option value="2">
                Project Type 2
              </option>

            </select>

            {errors.projecttype && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.projecttype}
              </p>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Create Template
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateTemplateForm;