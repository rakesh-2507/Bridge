import { useState } from "react";

interface CreateFolderFormProps {
  onCancel?: () => void;
  onSuccess?: (data: unknown) => void;
}

interface CreateFolderFormData {
  fname: string;
  pid: string;
  tid: string;
  fnamedesc: string;
}

function CreateFolderForm({
  onCancel,
  onSuccess,
}: CreateFolderFormProps) {
  const [formData, setFormData] = useState<CreateFolderFormData>({
    fname: "",
    pid: "",
    tid: "",
    fnamedesc: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateFolderFormData, string>>
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

    if (!formData.fname.trim()) {
      newErrors.fname = "Folder name is required.";
    }

    if (!formData.tid) {
      newErrors.tid = "Template is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const data = {
      fname: formData.fname,
      pid: formData.pid ? Number(formData.pid) : null,
      tid: Number(formData.tid),
      fnamedesc: formData.fnamedesc,
    };

    console.log("Folder:", data);

    onSuccess?.(data);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Folder
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a folder or section inside a template.
        </p>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="grid gap-6 p-6">

          <div>
            <label
              htmlFor="fname"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Folder Name <span className="text-red-500">*</span>
            </label>

            <input
              id="fname"
              name="fname"
              type="text"
              value={formData.fname}
              onChange={handleChange}
              placeholder="Enter folder name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />

            {errors.fname && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.fname}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="pid"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Parent Folder
            </label>

            <input
              id="pid"
              name="pid"
              type="number"
              value={formData.pid}
              onChange={handleChange}
              placeholder="Enter parent folder ID (optional)"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty if this is a root folder.
            </p>
          </div>

          <div>
            <label
              htmlFor="tid"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Template <span className="text-red-500">*</span>
            </label>

            <select
              id="tid"
              name="tid"
              value={formData.tid}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                Select template
              </option>

              <option value="1">
                Template 1
              </option>

              <option value="2">
                Template 2
              </option>

            </select>

            {errors.tid && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.tid}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fnamedesc"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Folder Description
            </label>

            <textarea
              id="fnamedesc"
              name="fnamedesc"
              rows={4}
              value={formData.fnamedesc}
              onChange={handleChange}
              placeholder="Enter folder description"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
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
            Create Folder
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateFolderForm;