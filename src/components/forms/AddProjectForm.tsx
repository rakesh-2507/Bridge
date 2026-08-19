import { useState } from "react";

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
    const [formData, setFormData] = useState<ProjectFormData>({
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
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (
        e: React.SubmitEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const accessToken = localStorage.getItem("access_token");

            if (!accessToken) {
                throw new Error("Access token not found.");
            }

            /*
             * Required fields
             */
            const payload: Record<string, unknown> = {
                tid: Number(formData.tid),
                cid: Number(formData.cid),
                projectname: formData.projectname.trim(),
            };

            /*
             * Optional integer fields
             */
            if (formData.member_id.trim() !== "") {
                payload.member_id = Number(formData.member_id);
            }

            if (formData.coordinator.trim() !== "") {
                payload.coordinator = Number(formData.coordinator);
            }

            if (formData.projecttype.trim() !== "") {
                payload.projecttype = Number(formData.projecttype);
            }

            if (formData.is_project_manage !== "") {
                payload.is_project_manage = Number(
                    formData.is_project_manage
                );
            }

            /*
             * Optional string fields
             */
            if (formData.projectdesc.trim() !== "") {
                payload.projectdesc = formData.projectdesc.trim();
            }

            if (formData.po.trim() !== "") {
                payload.po = formData.po.trim();
            }

            if (formData.costhead.trim() !== "") {
                payload.costhead = formData.costhead.trim();
            }

            if (formData.projectno.trim() !== "") {
                payload.projectno = formData.projectno.trim();
            }

            if (formData.department.trim() !== "") {
                payload.department = formData.department.trim();
            }

            console.log("Create project payload:", payload);

            const response = await fetch(
                "https://bridgeapi.sidpz.com/api/createproject",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Failed to create project."
                );
            }

            console.log(
                "Project created successfully:",
                data
            );

            onSuccess?.(data);

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while creating the project."
            );
        } finally {
            setLoading(false);
        }
    };

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

            {/* Error Message */}
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
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Template ID <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="tid"
                            name="tid"
                            type="number"
                            min="1"
                            value={formData.tid}
                            onChange={handleChange}
                            placeholder="Enter template ID"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Company ID */}
                    <div>
                        <label
                            htmlFor="cid"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Company ID <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="cid"
                            name="cid"
                            type="number"
                            min="1"
                            value={formData.cid}
                            onChange={handleChange}
                            placeholder="Enter company ID"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Member ID */}
                    <div>
                        <label
                            htmlFor="member_id"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Coordinator */}
                    <div>
                        <label
                            htmlFor="coordinator"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Project Name */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="projectname"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Project Description */}
                    <div className="md:col-span-2">
                        <label
                            htmlFor="projectdesc"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Project Management */}
                    <div>
                        <label
                            htmlFor="is_project_manage"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Project Management
                        </label>

                        <select
                            id="is_project_manage"
                            name="is_project_manage"
                            value={formData.is_project_manage}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        >
                            <option value="">Select</option>
                            <option value="1">Yes</option>
                            <option value="0">No</option>
                        </select>
                    </div>

                    {/* PO / Reference */}
                    <div>
                        <label
                            htmlFor="po"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Cost Head */}
                    <div>
                        <label
                            htmlFor="costhead"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Project Number */}
                    <div>
                        <label
                            htmlFor="projectno"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Project Type */}
                    <div>
                        <label
                            htmlFor="projecttype"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label
                            htmlFor="department"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">

                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                        Cancel
                    </button>

                    {/* Create */}
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