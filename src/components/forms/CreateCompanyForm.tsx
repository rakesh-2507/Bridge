import { useState } from "react";

interface CreateCompanyFormProps {
  onCancel?: () => void;
  onSuccess?: (data: unknown) => void;
}

interface CompanyFormData {
  company_name: string;
}

function CreateCompanyForm({
  onCancel,
  onSuccess,
}: CreateCompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: "",
  });

  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      company_name: e.target.value,
    });

    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      setError("Company name is required.");
      return;
    }

    setError("");

    console.log("Company:", formData);

    onSuccess?.(formData);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-950">

      <div className="border-b border-gray-200 px-6 py-5">

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Company
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new company to the system.
        </p>

      </div>

      <form onSubmit={handleSubmit}>

        <div className="p-6">

          <label
            htmlFor="company_name"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Company Name <span className="text-red-500">*</span>
          </label>

          <input
            id="company_name"
            name="company_name"
            type="text"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Enter company name"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
          />

          {error && (
            <p className="mt-1.5 text-sm text-red-500">
              {error}
            </p>
          )}

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
            Create Company
          </button>

        </div>

      </form>
    </div>
  );
}

export default CreateCompanyForm;