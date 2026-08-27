import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";

import {
    CalendarDays,
    ChevronDown,
    ChevronRight,
    Loader2,
    User as UserIcon,
    Building2,
    FileText,
    BriefcaseBusiness,
    X,
    Check,
} from "lucide-react";

import { getTemplates } from "../../api/templates";
import { getProjectTypes } from "../../api/projectTypes";
import { getCompanies } from "../../api/companies";
import { getUsers } from "../../api/users";

import type { Company } from "../../api/companies";
import type { User as ApiUser } from "../../api/users";

import type {
    CreateProjectFromTemplateDetails,
    ProjectTemplate,
} from "../../types/projectTemplate";

interface ProjectDetailsFormProps {
    initialData: CreateProjectFromTemplateDetails;
    onSubmit: (
        data: CreateProjectFromTemplateDetails
    ) => void | Promise<void>;
}

interface ProjectType {
    ptypeid: number;
    projecttype: string;
}

type FieldErrors =
    Partial<
        Record<
            keyof CreateProjectFromTemplateDetails,
            string
        >
    >;

export default function ProjectDetailsForm({
    initialData,
    onSubmit,
}: ProjectDetailsFormProps) {

    const [formData, setFormData] =
        useState<CreateProjectFromTemplateDetails>(
            initialData
        );

    const [templates, setTemplates] = useState<
        ProjectTemplate[]
    >([]);

    const [projectTypes, setProjectTypes] = useState<
        ProjectType[]
    >([]);

    const [companies, setCompanies] = useState<
        Company[]
    >([]);

    const [users, setUsers] = useState<ApiUser[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [fieldErrors, setFieldErrors] =
        useState<FieldErrors>({});

    const [isMembersOpen, setIsMembersOpen] =
        useState(false);

    const membersDropdownRef =
        useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        let cancelled = false;

        async function loadFormData() {
            try {
                setIsLoading(true);
                setError(null);

                const [
                    templatesResponse,
                    projectTypesResponse,
                    companiesResponse,
                    usersResponse,
                ] = await Promise.all([
                    getTemplates(),
                    getProjectTypes(),
                    getCompanies(),
                    getUsers(),
                ]);

                if (cancelled) {
                    return;
                }

                setTemplates(
                    templatesResponse.templates ?? []
                );

                setProjectTypes(
                    projectTypesResponse.projecttypes ?? []
                );

                setCompanies(
                    companiesResponse.companies ?? []
                );

                setUsers(
                    usersResponse.users ?? []
                );
            } catch (err) {
                console.error(
                    "Failed to load project form data:",
                    err
                );

                if (!cancelled) {
                    setError(
                        "Unable to load the project form data. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadFormData();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(
            event: MouseEvent
        ) {
            if (
                membersDropdownRef.current &&
                !membersDropdownRef.current.contains(
                    event.target as Node
                )
            ) {
                setIsMembersOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    function updateField<
        K extends keyof CreateProjectFromTemplateDetails
    >(
        field: K,
        value: CreateProjectFromTemplateDetails[K]
    ) {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));

        setFieldErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const updated = {
                ...current,
            };

            delete updated[field];

            return updated;
        });
    }

    function handleTemplateChange(
        templateId: number
    ) {
        const selected =
            templates.find(
                (template) =>
                    template.tid === templateId
            );

        setFormData((current) => ({
            ...current,

            template_id:
                templateId || 0,

            projecttype:
                selected?.projecttype ??
                current.projecttype,
        }));

        setFieldErrors((current) => {
            const updated = {
                ...current,
            };

            delete updated.template_id;

            return updated;
        });
    }


    const selectedTemplate =
        templates.find(
            (template) =>
                template.tid ===
                formData.template_id
        );

    function getUserName(
        user: ApiUser
    ): string {
        const fullName = [
            user.firstname,
            user.lastname,
        ]
            .filter(
                (
                    value
                ): value is string =>
                    typeof value === "string" &&
                    value.trim().length > 0
            )
            .join(" ")
            .trim();

        if (fullName) {
            return fullName;
        }

        if (
            typeof user.loginname === "string" &&
            user.loginname.trim()
        ) {
            return user.loginname;
        }

        if (
            typeof user.email === "string" &&
            user.email.trim()
        ) {
            return user.email;
        }

        return `User ${user.uid}`;
    }

    const selectedMemberIds =
        formData.member_ids ?? [];

    function toggleMember(
        userId: number
    ) {
        const currentIds =
            formData.member_ids ?? [];

        const isSelected =
            currentIds.includes(userId);

        const updatedIds = isSelected
            ? currentIds.filter(
                (id) => id !== userId
            )
            : [
                ...currentIds,
                userId,
            ];

        updateField(
            "member_ids",
            updatedIds
        );
    }

    function removeMember(
        userId: number
    ) {
        const updatedIds = (
            formData.member_ids ?? []
        ).filter(
            (id) => id !== userId
        );

        updateField(
            "member_ids",
            updatedIds
        );
    }

    function selectAllMembers() {
        const allUserIds =
            users.map(
                (user) => user.uid
            );

        updateField(
            "member_ids",
            allUserIds
        );
    }

    function clearAllMembers() {
        updateField(
            "member_ids",
            []
        );
    }

    function validate(): boolean {
        const errors: FieldErrors = {};


        if (!formData.template_id) {
            errors.template_id =
                "Please select a template.";
        }


        if (
            !formData.project_name ||
            !formData.project_name.trim()
        ) {
            errors.project_name =
                "Project name is required.";
        }


        if (!formData.company_id) {
            errors.company_id =
                "Please select a company.";
        }

        if (!formData.projecttype) {
            errors.projecttype =
                "Please select a project type.";
        }

        if (!formData.start_date) {
            errors.start_date =
                "Start date is required.";
        }

        if (!formData.end_date) {
            errors.end_date =
                "End date is required.";
        }

        if (
            formData.start_date &&
            formData.end_date &&
            formData.start_date >
            formData.end_date
        ) {
            errors.end_date =
                "End date must be after the start date.";
        }

        if (!formData.coordinator) {
            errors.coordinator =
                "Please select a coordinator.";
        }

        if (
            !Array.isArray(
                formData.member_ids
            ) ||
            formData.member_ids.length === 0
        ) {
            errors.member_ids =
                "Please select at least one member.";
        }

        setFieldErrors(errors);

        return (
            Object.keys(errors).length === 0
        );
    }

    async function handleSubmit(
        event: SubmitEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        const valid = validate();

        if (!valid) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await onSubmit(formData);
        } catch (err) {
            console.error(
                "Failed to continue:",
                err
            );

            setError(
                "Unable to continue. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Loader2
                        size={20}
                        className="animate-spin"
                    />

                    <span>
                        Loading project details...
                    </span>
                </div>
            </div>
        );
    }

    const hasNoFormData =
        templates.length === 0 &&
        projectTypes.length === 0 &&
        companies.length === 0 &&
        users.length === 0;

    if (
        error &&
        hasNoFormData
    ) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>

            <div className="p-6 sm:p-8">

                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-2">
                        <BriefcaseBusiness
                            size={20}
                            className="text-blue-600"
                        />

                        <h2 className="text-lg font-semibold text-gray-900">
                            Project Details
                        </h2>
                    </div>

                    <p className="text-sm text-gray-500">
                        Select an existing template and
                        enter the basic project information.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="space-y-8">

                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <FileText
                                size={18}
                                className="text-gray-500"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Template
                            </h3>
                        </div>

                        <label
                            htmlFor="template_id"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Project Template{" "}
                            <span className="text-red-500">
                                *
                            </span>
                        </label>

                        <select
                            id="template_id"
                            value={
                                formData.template_id ||
                                ""
                            }
                            onChange={(event) =>
                                handleTemplateChange(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.template_id
                                    ? "border-red-400"
                                    : "border-gray-300"
                                }`}
                        >
                            <option value="">
                                Select a project template
                            </option>

                            {templates.map(
                                (template) => (
                                    <option
                                        key={
                                            template.tid
                                        }
                                        value={
                                            template.tid
                                        }
                                    >
                                        {template.name}
                                    </option>
                                )
                            )}
                        </select>

                        {fieldErrors.template_id && (
                            <p className="mt-1.5 text-xs text-red-600">
                                {
                                    fieldErrors.template_id
                                }
                            </p>
                        )}

                        {selectedTemplate && (
                            <div className="mt-3 rounded-lg bg-blue-50 px-4 py-3">
                                <p className="text-sm font-medium text-blue-900">
                                    {
                                        selectedTemplate.name
                                    }
                                </p>

                                {selectedTemplate.name_desc && (
                                    <p className="mt-1 text-xs text-blue-700">
                                        {
                                            selectedTemplate.name_desc
                                        }
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Project Information
                            </h3>
                        </div>

                        <div>
                            <label
                                htmlFor="project_name"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Project Name{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                id="project_name"
                                type="text"
                                value={
                                    formData.project_name
                                }
                                onChange={(event) =>
                                    updateField(
                                        "project_name",
                                        event.target.value
                                    )
                                }
                                placeholder="Enter project name"
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.project_name
                                        ? "border-red-400"
                                        : "border-gray-300"
                                    }`}
                            />

                            {fieldErrors.project_name && (
                                <p className="mt-1.5 text-xs text-red-600">
                                    {
                                        fieldErrors.project_name
                                    }
                                </p>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Organization
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            {/* COMPANY */}

                            <div>
                                <label
                                    htmlFor="company_id"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2
                                            size={15}
                                        />

                                        Company
                                    </span>

                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="company_id"
                                    value={
                                        formData.company_id ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "company_id",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.company_id
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <option value="">
                                        Select company
                                    </option>

                                    {companies.map(
                                        (company) => (
                                            <option
                                                key={
                                                    company.cid
                                                }
                                                value={
                                                    company.cid
                                                }
                                            >
                                                {
                                                    company.company_name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {fieldErrors.company_id && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.company_id
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="projecttype"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Project Type{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="projecttype"
                                    value={
                                        formData.projecttype ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "projecttype",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.projecttype
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <option value="">
                                        Select project type
                                    </option>

                                    {projectTypes.map(
                                        (type) => (
                                            <option
                                                key={
                                                    type.ptypeid
                                                }
                                                value={
                                                    type.ptypeid
                                                }
                                            >
                                                {
                                                    type.projecttype
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {fieldErrors.projecttype && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.projecttype
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <CalendarDays
                                size={18}
                                className="text-gray-500"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Project Dates
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <div>
                                <label
                                    htmlFor="start_date"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Start Date{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="start_date"
                                    type="date"
                                    value={
                                        formData.start_date
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "start_date",
                                            event.target.value
                                        )
                                    }
                                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.start_date
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                />

                                {fieldErrors.start_date && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.start_date
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="end_date"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    End Date{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="end_date"
                                    type="date"
                                    min={
                                        formData.start_date ||
                                        undefined
                                    }
                                    value={
                                        formData.end_date
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "end_date",
                                            event.target.value
                                        )
                                    }
                                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.end_date
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                />

                                {fieldErrors.end_date && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.end_date
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <UserIcon
                                size={18}
                                className="text-gray-500"
                            />

                            <h3 className="text-sm font-semibold text-gray-900">
                                Project Members
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <div
                                ref={
                                    membersDropdownRef
                                }
                                className="relative"
                            >
                                <label
                                    htmlFor="member_ids"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Members{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <button
                                    type="button"
                                    id="member_ids"
                                    aria-expanded={
                                        isMembersOpen
                                    }
                                    onClick={() =>
                                        setIsMembersOpen(
                                            (open) =>
                                                !open
                                        )
                                    }
                                    className={`flex min-h-[42px] w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.member_ids
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                        {selectedMemberIds.length ===
                                            0 ? (
                                            <span className="text-gray-400">
                                                Select members
                                            </span>
                                        ) : (
                                            selectedMemberIds.map(
                                                (
                                                    userId
                                                ) => {
                                                    const user =
                                                        users.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.uid ===
                                                                userId
                                                        );

                                                    if (
                                                        !user
                                                    ) {
                                                        return null;
                                                    }

                                                    return (
                                                        <span
                                                            key={
                                                                userId
                                                            }
                                                            className="inline-flex max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                                        >
                                                            <span className="max-w-[140px] truncate">
                                                                {getUserName(
                                                                    user
                                                                )}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                aria-label={`Remove ${getUserName(
                                                                    user
                                                                )}`}
                                                                onClick={(
                                                                    event
                                                                ) => {
                                                                    event.stopPropagation();

                                                                    removeMember(
                                                                        userId
                                                                    );
                                                                }}
                                                                className="rounded-full hover:bg-blue-100"
                                                            >
                                                                <X
                                                                    size={
                                                                        13
                                                                    }
                                                                />
                                                            </button>
                                                        </span>
                                                    );
                                                }
                                            )
                                        )}
                                    </div>

                                    <ChevronDown
                                        size={18}
                                        className={`ml-2 flex-shrink-0 text-gray-400 transition-transform ${isMembersOpen
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                    />
                                </button>

                                {isMembersOpen && (
                                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">

                                        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
                                            <span className="text-xs font-medium text-gray-500">
                                                {
                                                    selectedMemberIds.length
                                                }{" "}
                                                selected
                                            </span>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={
                                                        selectAllMembers
                                                    }
                                                    disabled={
                                                        users.length ===
                                                        0
                                                    }
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Select all
                                                </button>

                                                {selectedMemberIds.length >
                                                    0 && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                clearAllMembers
                                                            }
                                                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                                                        >
                                                            Clear
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {users.length ===
                                                0 ? (
                                                <div className="px-3 py-6 text-center text-sm text-gray-500">
                                                    No users available.
                                                </div>
                                            ) : (
                                                users.map(
                                                    (
                                                        user
                                                    ) => {
                                                        const isSelected =
                                                            selectedMemberIds.includes(
                                                                user.uid
                                                            );

                                                        return (
                                                            <label
                                                                key={
                                                                    user.uid
                                                                }
                                                                className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition ${isSelected
                                                                        ? "bg-blue-50"
                                                                        : "hover:bg-gray-50"
                                                                    }`}
                                                            >

                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onChange={() =>
                                                                        toggleMember(
                                                                            user.uid
                                                                        )
                                                                    }
                                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-medium text-gray-800">
                                                                        {getUserName(
                                                                            user
                                                                        )}
                                                                    </p>

                                                                    {user.email && (
                                                                        <p className="truncate text-xs text-gray-500">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {isSelected && (
                                                                    <Check
                                                                        size={
                                                                            17
                                                                        }
                                                                        className="flex-shrink-0 text-blue-600"
                                                                    />
                                                                )}
                                                            </label>
                                                        );
                                                    }
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {fieldErrors.member_ids && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.member_ids
                                        }
                                    </p>
                                )}

                                <p className="mt-1.5 text-xs text-gray-500">
                                    Select one or more members.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="coordinator"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Coordinator{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="coordinator"
                                    value={
                                        formData.coordinator ||
                                        ""
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            "coordinator",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${fieldErrors.coordinator
                                            ? "border-red-400"
                                            : "border-gray-300"
                                        }`}
                                >
                                    <option value="">
                                        Select coordinator
                                    </option>

                                    {users.map(
                                        (user) => (
                                            <option
                                                key={
                                                    user.uid
                                                }
                                                value={
                                                    user.uid
                                                }
                                            >
                                                {getUserName(
                                                    user
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>

                                {fieldErrors.coordinator && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {
                                            fieldErrors.coordinator
                                        }
                                    </p>
                                )}

                                <p className="mt-1.5 text-xs text-gray-500">
                                    Select one coordinator for
                                    this project.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Project Management
                            </h3>
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={
                                    formData.is_project_manage ===
                                    1
                                }
                                onChange={(event) =>
                                    updateField(
                                        "is_project_manage",
                                        event.target.checked
                                            ? 1
                                            : 0
                                    )
                                }
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Enable project management
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Enable project management
                                    features for this project.
                                </p>
                            </div>
                        </label>
                    </section>
                </div>
            </div>

            <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2
                                size={17}
                                className="animate-spin"
                            />

                            <span>
                                Loading...
                            </span>
                        </>
                    ) : (
                        <>
                            <span>
                                Next: Folder Schedule
                            </span>

                            <ChevronRight
                                size={17}
                            />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}