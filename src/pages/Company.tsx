import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Loader2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Hash,
} from "lucide-react";

import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompany,
  updateCompany,
  type Company as CompanyType,
  type CompanyPayload,
} from "../api/companies";

type CompanyForm = {
  company_name: string;
};

const initialForm: CompanyForm = {
  company_name: "",
};

export default function Company() {
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<CompanyType | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<CompanyType | null>(null);
  const [form, setForm] = useState<CompanyForm>(initialForm);

  const [deleteTarget, setDeleteTarget] =
    useState<CompanyType | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const response = await getCompanies<{
          companies: CompanyType[];
          total: number;
        }>();

        if (!cancelled) {
          setCompanies(response.companies ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load companies.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCompanies() {
    setLoading(true);
    setError("");

    try {
      const response = await getCompanies<{
        companies: CompanyType[];
        total: number;
      }>();

      setCompanies(response.companies ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load companies.",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return companies;

    return companies.filter(
      (company) =>
        company.company_name.toLowerCase().includes(query) ||
        String(company.cid).includes(query),
    );
  }, [companies, search]);

  function openCreateModal() {
    setEditingCompany(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function openEditModal(cid: number) {
    setError("");
    setSuccess("");

    try {
      const company = await getCompany<CompanyType>(cid);

      setEditingCompany(company);
      setForm({
        company_name: company.company_name ?? "",
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load company details.",
      );
    }
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingCompany(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const companyName = form.company_name.trim();

    if (!companyName) {
      setError("Company name is required.");
      return;
    }

    const payload: CompanyPayload = {
      company_name: companyName,
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingCompany) {
        await updateCompany(editingCompany.cid, payload);
        setSuccess("Company updated successfully.");
      } else {
        await createCompany(payload);
        setSuccess("Company created successfully.");
      }

      setIsModalOpen(false);
      setEditingCompany(null);
      setForm(initialForm);

      await loadCompanies();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save company.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cid = Number(lookupId.trim());

    if (!lookupId.trim() || !Number.isInteger(cid) || cid <= 0) {
      setError("Enter a valid company ID.");
      return;
    }

    setLookupLoading(true);
    setError("");
    setSuccess("");
    setLookupResult(null);

    try {
      const company = await getCompany<CompanyType>(cid);
      setLookupResult(company);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Company not found.",
      );
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await deleteCompany(deleteTarget.cid);

      setCompanies((current) =>
        current.filter((company) => company.cid !== deleteTarget.cid),
      );

      if (lookupResult?.cid === deleteTarget.cid) {
        setLookupResult(null);
      }

      setSuccess("Company deleted successfully.");
      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete company.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Building2 size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Companies
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create and manage your company records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCompanies()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Company
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={18} />
            <span className="min-w-0 flex-1">{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Lookup by ID */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Hash size={19} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold">Find Company by ID</h2>
          </div>

          <form
            onSubmit={handleLookup}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="number"
              min="1"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="Enter company ID"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
            />

            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {lookupLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Find Company
            </button>
          </form>

          {lookupResult && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold">
                  {lookupResult.company_name}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Company ID: {lookupResult.cid}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void openEditModal(lookupResult.cid)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(lookupResult)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Company list */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">Company List</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredCompanies.length} of {companies.length} companies
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or ID..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <Building2
                size={36}
                className="mb-3 text-slate-300 dark:text-slate-600"
              />
              <p className="font-medium">
                {search ? "No matching companies" : "No companies found"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? "Try another search term."
                  : "Create your first company to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Company
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Company ID</th>
                    <th className="px-5 py-4 font-semibold">Company Name</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.cid}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium dark:bg-slate-800">
                          {company.cid}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                            <Building2 size={18} />
                          </div>
                          <span className="font-medium">
                            {company.company_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="View company"
                            onClick={() => {
                              setLookupId(String(company.cid));
                              setLookupResult(company);
                              setError("");
                            }}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Edit company"
                            onClick={() => void openEditModal(company.cid)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete company"
                            onClick={() => setDeleteTarget(company)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2
                  id="company-modal-title"
                  className="text-lg font-bold"
                >
                  {editingCompany ? "Edit Company" : "Create Company"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingCompany
                    ? `Update company ID ${editingCompany.cid}.`
                    : "Enter the company details below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-5">
                <div>
                  <label
                    htmlFor="company_name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Company Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="company_name"
                    type="text"
                    required
                    maxLength={200}
                    autoFocus
                    value={form.company_name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        company_name: event.target.value,
                      })
                    }
                    placeholder="Enter company name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-950"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingCompany
                      ? "Save Changes"
                      : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-company-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
              <Trash2 size={22} />
            </div>

            <h2
              id="delete-company-title"
              className="text-lg font-bold"
            >
              Delete Company
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">
                {deleteTarget.company_name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {deleting ? "Deleting..." : "Delete Company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
