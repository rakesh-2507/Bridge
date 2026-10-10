import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FolderKanban,
    Loader2,
    Save,
    X,
    AlertCircle,
    Users,
    FileText,
    Hash,
} from "lucide-react";

import {
    createProject,
    type ProjectPayload,
} from "../api/projects";

import {
    getTemplates,
    type TemplateListItem,
} from "../api/templateCreate";

import { getUsers } from "../api/users";

import {
    getCompanies,
    type Company,
} from "../api/companies";

import {
    getProjectTypes,
    type ProjectType,
} from "../api/projectTypes";

interface ProjectUser {
    uid: number;
    username?: string;
    firstname?: string;
    lastname?: string;
    name?: string;
}

interface UsersResponse {
    users?: ProjectUser[];
}

interface CompaniesResponse {
    companies?: Company[];
}

interface ProjectTypesResponse {
    projecttypes?: ProjectType[];
}

type OptionRecord = Record<string, unknown>;

function asRecord(value: unknown): OptionRecord {
    if (typeof value === "object" && value !== null) {
        return value as OptionRecord;
    }

    return {};
}

function getOptionId(
    value: unknown,
    keys: string[],
): string {
    const record = asRecord(value);

    for (const key of keys) {
        const id = record[key];

        if (
            (typeof id === "string" || typeof id === "number") &&
            String(id).trim() !== ""
        ) {
            return String(id);
        }
    }

    return "";
}

function getOptionLabel(
    value: unknown,
    keys: string[],
    fallback: string,
): string {
    const record = asRecord(value);

    for (const key of keys) {
        const label = record[key];

        if (
            (typeof label === "string" || typeof label === "number") &&
            String(label).trim() !== ""
        ) {
            return String(label);
        }
    }

    return fallback;
}

function getUserLabel(user: ProjectUser): string {
    const fullName = [user.firstname, user.lastname]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        user.name?.trim() ||
        fullName ||
        user.username?.trim() ||
        `User ${user.uid}`
    );
}

export default function CreateProject() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        tid: "",
        cid: "",
        projectname: "",
        projectdesc: "",
        coordinator: "",
        is_project_manage: "0",
        projecttype: "",
        member_ids: [] as string[],
    });

    const [templates, setTemplates] = useState<TemplateListItem[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [users, setUsers] = useState<ProjectUser[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [optionsError, setOptionsError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadOptions() {
            setLoadingOptions(true);
            setOptionsError("");

            try {
                const [
                    templateResponse,
                    companyResponse,
                    projectTypeResponse,
                    userResponse,
                ] = await Promise.all([
                    getTemplates(),
                    getCompanies(),
                    getProjectTypes(),
                    getUsers(),
                ]);

                if (!active) return;

                // Normalize API responses without changing the API functions.
                const templateData = Array.isArray(templateResponse)
                    ? templateResponse
                    : [];

                const companyData = companyResponse as CompaniesResponse;
                const typeData = projectTypeResponse as ProjectTypesResponse;
                const userData = userResponse as UsersResponse;

                setTemplates(templateData);
                setCompanies(companyData.companies ?? []);
                setProjectTypes(typeData.projecttypes ?? []);
                setUsers(userData.users ?? []);
            } catch (err: unknown) {
                if (!active) return;

                setOptionsError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load dropdown options. Please refresh the page.",
                );
            } finally {
                if (active) {
                    setLoadingOptions(false);
                }
            }
        }

        void loadOptions();

        return () => {
            active = false;
        };
    }, []);

    function handleChange(
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    function handleMembersChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        const selectedIds = Array.from(
            event.target.selectedOptions,
            (option) => option.value,
        );

        setForm((previous) => ({
            ...previous,
            member_ids: selectedIds,
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");

        if (
            !form.tid ||
            !form.cid ||
            !form.projectname.trim() ||
            !form.coordinator ||
            !form.projecttype
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        const numericIds = [
            { label: "Template", value: form.tid },
            { label: "Company", value: form.cid },
            { label: "Coordinator", value: form.coordinator },
            { label: "Project type", value: form.projecttype },
        ];

        for (const item of numericIds) {
            const value = Number(item.value);

            if (!Number.isSafeInteger(value) || value < 0) {
                setError(`${item.label} must be a valid non-negative integer.`);
                return;
            }
        }

        const memberIds = form.member_ids.map(Number);

        if (
            memberIds.some(
                (id) => !Number.isSafeInteger(id) || id < 0,
            )
        ) {
            setError("Please select valid project members.");
            return;
        }

        const payload: ProjectPayload = {
            tid: Number(form.tid),
            cid: Number(form.cid),
            projectname: form.projectname.trim(),
            projectdesc: form.projectdesc.trim(),
            coordinator: Number(form.coordinator),
            is_project_manage: Number(form.is_project_manage),
            projecttype: Number(form.projecttype),
            member_ids: [...new Set(memberIds)],
        };

        setLoading(true);

        try {
            await createProject(payload);

            navigate("/projects", {
                replace: true,
                state: { projectCreated: true },
            });
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create project. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-950";

    const labelClass =
        "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

    const optionsDisabled = loadingOptions || loading;

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                            className="mt-1 rounded-lg border border-slate-300 bg-white p-2 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                            aria-label="Back to projects"
                        >
                            <ArrowLeft size={19} />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <FolderKanban
                                    size={24}
                                    className="text-blue-600 dark:text-blue-400"
                                />
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Create Project
                                </h1>
                            </div>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Enter the project details and assign its members.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading options */}
                {loadingOptions && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                        <Loader2 size={17} className="animate-spin" />
                        Loading templates, companies, project types and users...
                    </div>
                )}

                {/* Option loading error */}
                {optionsError && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                    >
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{optionsError}</span>
                    </div>
                )}

                {/* Submit error */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic information */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <FileText size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold">Basic Information</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Project name and description
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 p-5">
                            <div>
                                <label htmlFor="projectname" className={labelClass}>
                                    Project Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="projectname"
                                    name="projectname"
                                    value={form.projectname}
                                    onChange={handleChange}
                                    placeholder="Enter project name"
                                    className={inputClass}
                                    maxLength={200}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="projectdesc" className={labelClass}>
                                    Project Description
                                </label>
                                <textarea
                                    id="projectdesc"
                                    name="projectdesc"
                                    value={form.projectdesc}
                                    onChange={handleChange}
                                    placeholder="Describe the purpose of this project"
                                    rows={4}
                                    className={inputClass}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Project configuration */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                            <div className="rounded-lg bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                <Hash size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold">Project Configuration</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Select a template, company, type and coordinator
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-5 p-5 sm:grid-cols-2">
                            {/* Template */}
                            <div>
                                <label htmlFor="tid" className={labelClass}>
                                    Template <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="tid"
                                    name="tid"
                                    value={form.tid}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                    disabled={optionsDisabled || templates.length === 0}
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Loading templates..."
                                            : templates.length
                                                ? "Select a template"
                                                : "No templates available"}
                                    </option>

                                    {templates.map((template, index) => {
                                        const id = getOptionId(template, ["tid"]);

                                        const label = getOptionLabel(
                                            template,
                                            [
                                                "template_name",
                                                "templatename",
                                                "name",
                                                "title",
                                            ],
                                            id ? `Template ${id}` : `Template ${index + 1}`,
                                        );

                                        if (!id) return null;

                                        return (
                                            <option key={id} value={id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Company */}
                            <div>
                                <label htmlFor="cid" className={labelClass}>
                                    Company <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="cid"
                                    name="cid"
                                    value={form.cid}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                    disabled={optionsDisabled || companies.length === 0}
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Loading companies..."
                                            : companies.length
                                                ? "Select a company"
                                                : "No companies available"}
                                    </option>

                                    {companies.map((company) => (
                                        <option key={company.cid} value={company.cid}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Project type */}
                            <div>
                                <label htmlFor="projecttype" className={labelClass}>
                                    Project Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="projecttype"
                                    name="projecttype"
                                    value={form.projecttype}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                    disabled={optionsDisabled || projectTypes.length === 0}
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Loading project types..."
                                            : projectTypes.length
                                                ? "Select a project type"
                                                : "No project types available"}
                                    </option>

                                    {projectTypes.map((projectType, index) => {
                                        const id = getOptionId(projectType, [
                                            "projecttype",
                                            "projecttypeid",
                                            "project_type_id",
                                            "ptid",
                                            "id",
                                        ]);

                                        const label = getOptionLabel(
                                            projectType,
                                            [
                                                "project_type_name",
                                                "projecttypename",
                                                "project_type",
                                                "typename",
                                                "type_name",
                                                "name",
                                            ],
                                            id ? `Project Type ${id}` : `Project Type ${index + 1}`,
                                        );

                                        if (!id) return null;

                                        return (
                                            <option key={id} value={id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Coordinator */}
                            <div>
                                <label htmlFor="coordinator" className={labelClass}>
                                    Coordinator <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="coordinator"
                                    name="coordinator"
                                    value={form.coordinator}
                                    onChange={handleChange}
                                    className={inputClass}
                                    required
                                    disabled={optionsDisabled || users.length === 0}
                                >
                                    <option value="">
                                        {loadingOptions
                                            ? "Loading users..."
                                            : users.length
                                                ? "Select a coordinator"
                                                : "No users available"}
                                    </option>

                                    {users.map((user) => (
                                        <option key={user.uid} value={user.uid}>
                                            {getUserLabel(user)} (ID: {user.uid})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Project management */}
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="is_project_manage"
                                    className={labelClass}
                                >
                                    Project Management
                                </label>

                                <select
                                    id="is_project_manage"
                                    name="is_project_manage"
                                    value={form.is_project_manage}
                                    onChange={handleChange}
                                    className={inputClass}
                                    disabled={loading}
                                >
                                    <option value="0">Disabled</option>
                                    <option value="1">Enabled</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Project members */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                <Users size={20} />
                            </div>

                            <div>
                                <h2 className="font-semibold">Project Members</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Select one or more users to assign to the project
                                </p>
                            </div>
                        </div>

                        <div className="p-5">
                            <label htmlFor="member_ids" className={labelClass}>
                                Members
                            </label>

                            <select
                                id="member_ids"
                                name="member_ids"
                                multiple
                                value={form.member_ids}
                                onChange={handleMembersChange}
                                className={`${inputClass} min-h-40`}
                                disabled={optionsDisabled || users.length === 0}
                            >
                                {users.map((user) => (
                                    <option key={user.uid} value={String(user.uid)}>
                                        {getUserLabel(user)} (ID: {user.uid})
                                    </option>
                                ))}
                            </select>

                            <p
                                id="members-help"
                                className="mt-2 text-xs text-slate-500 dark:text-slate-400"
                            >
                                Hold Ctrl (Windows) or Command (Mac) while clicking to
                                select multiple users. Leave empty if no additional
                                members are needed.
                            </p>

                            {form.member_ids.length > 0 && (
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {form.member_ids.length} member
                                    {form.member_ids.length === 1 ? "" : "s"} selected
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                        >
                            <X size={17} />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || loadingOptions}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 size={17} className="animate-spin" />
                            ) : (
                                <Save size={17} />
                            )}
                            {loading ? "Creating Project..." : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
