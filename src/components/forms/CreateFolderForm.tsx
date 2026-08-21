import { useEffect, useState } from "react";

import {
  createFolder,
  getFolders,
  type CreateFolderData,
  type Folder,
} from "../../api/folders";

import {
  getTemplates,
  type Template,
} from "../../api/templates";

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
  const [formData, setFormData] =
    useState<CreateFolderFormData>({
      fname: "",
      pid: "",
      tid: "",
      fnamedesc: "",
    });

  const [templates, setTemplates] =
    useState<Template[]>([]);

  const [folders, setFolders] =
    useState<Folder[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateFolderFormData, string>>
  >({});

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [templateResponse, folderResponse] =
          await Promise.all([
            getTemplates(),
            getFolders(),
          ]);

        if (cancelled) return;

        setTemplates(templateResponse.templates);
        setFolders(folderResponse.folders);

      } catch (err) {
        console.error(
          "Failed to load folder form data:",
          err
        );
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const newErrors: Partial<
      Record<keyof CreateFolderFormData, string>
    > = {};

    if (!formData.fname.trim()) {
      newErrors.fname =
        "Folder name is required.";
    }

    if (!formData.tid) {
      newErrors.tid =
        "Template is required.";
    }

    if (!formData.pid) {
      newErrors.pid =
        "Parent folder is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload: CreateFolderData = {
        fname: formData.fname.trim(),
        pid: Number(formData.pid),
        tid: Number(formData.tid),
        fnamedesc: formData.fnamedesc.trim(),
      };

      console.log(
        "Creating folder:",
        payload
      );

      const response = await createFolder(
        payload
      );

      console.log(
        "Folder created successfully:",
        response
      );

      onSuccess?.(response);

    } catch (err) {
      console.error(
        "Create folder error:",
        err
      );

      setErrors({
        fname:
          err instanceof Error
            ? err.message
            : "Failed to create folder.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Folder
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a folder and assign it to a template.
        </p>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="grid gap-6 p-6">

          {/* Folder Name */}
          <div>
            <label
              htmlFor="fname"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Folder Name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              id="fname"
              name="fname"
              type="text"
              value={formData.fname}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter folder name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />

            {errors.fname && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.fname}
              </p>
            )}
          </div>

          {/* Template */}
          <div>
            <label
              htmlFor="tid"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Template{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              id="tid"
              name="tid"
              value={formData.tid}
              onChange={handleChange}
              disabled={loading || loadingData}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                {loadingData
                  ? "Loading templates..."
                  : "Select template"}
              </option>

              {templates.map((template) => (
                <option
                  key={template.tid}
                  value={template.tid}
                >
                  {template.name}
                </option>
              ))}
            </select>

            {errors.tid && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.tid}
              </p>
            )}
          </div>

          {/* Parent Folder */}
          <div>
            <label
              htmlFor="pid"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Parent Folder{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              id="pid"
              name="pid"
              value={formData.pid}
              onChange={handleChange}
              disabled={loading || loadingData}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">
                {loadingData
                  ? "Loading folders..."
                  : "Select parent folder"}
              </option>

              {folders.map((folder) => (
                <option
                  key={folder.fid}
                  value={folder.fid}
                >
                  {folder.fname}
                </option>
              ))}
            </select>

            {errors.pid && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.pid}
              </p>
            )}
          </div>

          {/* Description */}
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
              disabled={loading}
              placeholder="Enter folder description"
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || loadingData}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {loading
              ? "Creating..."
              : "Create Folder"}
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateFolderForm;