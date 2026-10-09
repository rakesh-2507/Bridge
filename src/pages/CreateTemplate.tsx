
import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Check,
    ChevronDown,
    CirclePlus,
    FileText,
    Folder,
    Loader2,
    Trash2,
    Users,
} from "lucide-react";

import {
    getProjectTypes,
    type ProjectType,
} from "../api/projectTypes";

import {
    createTemplateComplete,
    getTemplateDetails,
    type TemplateCompletePayload,
    type TemplateCompleteResponse,
} from "../api/templateCreate";

interface FolderForm {
    id: number;
    fname: string;
    fnamedesc: string;
    children: string[];
    childDraft: string;
}

interface ApiFolder {
    fid?: number;
    fname?: string;
    pid?: number | null;
    tid?: number;
    fnamedesc?: string | null;
    children?: unknown[] | null;
}

interface ApiRole {
    rolename: string;
}

interface TemplateNavigationState {
    editTemplateId?: number | string;
}

function getChildFolderName(child: unknown): string {
    if (typeof child === "string") {
        return child.trim();
    }

    if (
        typeof child === "object" &&
        child !== null &&
        "fname" in child &&
        typeof child.fname === "string"
    ) {
        return child.fname.trim();
    }

    return "";
}

function getFolderChildren(folder: ApiFolder): string[] {
    return (folder.children ?? [])
        .map(getChildFolderName)
        .filter(Boolean);
}

function normalizeFolders(apiFolders: ApiFolder[]): FolderForm[] {
    const isChildFolder = (folder: ApiFolder) =>
        apiFolders.some(
            (parent) =>
                parent.fid !== undefined &&
                parent.fid !== folder.fid &&
                (
                    (folder.pid != null && folder.pid === parent.fid) ||
                    getFolderChildren(parent).some(
                        (name) => name.toLowerCase() ===
                            (folder.fname ?? "").toLowerCase(),
                    )
                ),
        );

    const rootFolders = apiFolders.filter(
        (folder) => !isChildFolder(folder),
    );

    return rootFolders.map((folder, index) => {
        const folderName = folder.fname ?? "";
        const embeddedChildren = getFolderChildren(folder);

        const separateChildren = apiFolders
            .filter(
                (child) =>
                    child.fid !== folder.fid &&
                    (
                        (child.pid != null && child.pid === folder.fid) ||
                        embeddedChildren.some(
                            (name) =>
                                name.toLowerCase() ===
                                (child.fname ?? "").toLowerCase(),
                        )
                    ),
            )
            .map((child) => child.fname?.trim() ?? "")
            .filter(Boolean);

        const children = [
            ...embeddedChildren,
            ...separateChildren,
        ];

        return {
            id: index + 1,
            fname: folderName,
            fnamedesc: folder.fnamedesc ?? "",
            children: [
                ...new Map(
                    children.map((name) => [
                        name.toLowerCase(),
                        name,
                    ]),
                ).values(),
            ],
            childDraft: "",
        };
    });
}

export default function CreateTemplate() {
    const location = useLocation();
    const navigate = useNavigate();

    const navigationState =
        location.state as TemplateNavigationState | null;

    const editTemplateId = navigationState?.editTemplateId;
    const isEditMode =
        editTemplateId !== undefined && editTemplateId !== null;

    const [name, setName] = useState("");
    const [nameDesc, setNameDesc] = useState("");
    const [projectType, setProjectType] = useState("");

    const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const [folders, setFolders] = useState<FolderForm[]>([]);
    const [nextFolderId, setNextFolderId] = useState(1);

    const [roles, setRoles] = useState<string[]>([]);
    const [roleDraft, setRoleDraft] = useState("");

    const [templateCompleted, setTemplateCompleted] = useState(false);
    const [foldersCompleted, setFoldersCompleted] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    const foldersLocked = !templateCompleted;
    const rolesLocked = !templateCompleted || !foldersCompleted;

    // Load project types.
    useEffect(() => {
        let cancelled = false;

        async function loadProjectTypes() {
            try {
                setLoadingTypes(true);

                const response = await getProjectTypes();

                if (!cancelled) {
                    setProjectTypes(response.projecttypes ?? []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load project types.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingTypes(false);
                }
            }
        }

        void loadProjectTypes();

        return () => {
            cancelled = true;
        };
    }, []);

    // Load template details when opened in edit mode.
    useEffect(() => {
        if (!isEditMode || editTemplateId === undefined) {
            return;
        }

        let cancelled = false;

        async function loadTemplateForEdit() {
            try {
                setLoadingTemplate(true);
                setError("");
                setSuccess("");

                const details: TemplateCompleteResponse =
                    await getTemplateDetails(Number(editTemplateId));

                if (cancelled) return;

                setName(details.name ?? "");
                setNameDesc(details.name_desc ?? "");
                setProjectType(String(details.projecttype ?? ""));

                // API children may be strings or nested folder objects.
                const apiFolders =
                    (details.folders ?? []) as unknown as ApiFolder[];

                const mappedFolders = normalizeFolders(apiFolders);

                setFolders(mappedFolders);
                setNextFolderId(mappedFolders.length + 1);

                const apiRoles =
                    (details.roles ?? []) as ApiRole[];

                setRoles(
                    apiRoles
                        .map((role) => role.rolename)
                        .filter(
                            (role): role is string =>
                                typeof role === "string" &&
                                role.trim().length > 0,
                        ),
                );

                setRoleDraft("");
                setTemplateCompleted(true);
                setFoldersCompleted(true);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load template details for editing.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingTemplate(false);
                }
            }
        }

        void loadTemplateForEdit();

        return () => {
            cancelled = true;
        };
    }, [isEditMode, editTemplateId]);

    // Template details.
    function completeTemplate() {
        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter a template name.");
            return;
        }

        if (!nameDesc.trim()) {
            setError("Please enter a template description.");
            return;
        }

        if (!projectType) {
            setError("Please select a project type.");
            return;
        }

        if (loadingTypes) {
            setError("Please wait until project types finish loading.");
            return;
        }

        setTemplateCompleted(true);
        setFoldersCompleted(false);
    }

    function editTemplate() {
        setTemplateCompleted(false);
        setFoldersCompleted(false);
        setError("");
        setSuccess("");
    }

    // Folder operations.
    function addFolder() {
        setFolders((current) => [
            ...current,
            {
                id: nextFolderId,
                fname: "",
                fnamedesc: "",
                children: [],
                childDraft: "",
            },
        ]);

        setNextFolderId((current) => current + 1);
        setError("");
    }

    function updateFolder(
        id: number,
        field: "fname" | "fnamedesc" | "childDraft",
        value: string,
    ) {
        setFolders((current) =>
            current.map((folder) =>
                folder.id === id
                    ? { ...folder, [field]: value }
                    : folder,
            ),
        );

        setError("");
    }

    function removeFolder(id: number) {
        setFolders((current) =>
            current.filter((folder) => folder.id !== id),
        );

        setError("");
    }

    function addSubfolder(id: number) {
        const folder = folders.find((item) => item.id === id);
        const childName = folder?.childDraft.trim() ?? "";

        if (!folder || !childName) {
            return;
        }

        const normalizedName = childName.toLowerCase();

        const exists = folders.some(
            (item) =>
                item.fname.trim().toLowerCase() === normalizedName ||
                item.children.some(
                    (child) => child.trim().toLowerCase() === normalizedName,
                ),
        );

        if (exists) {
            setError(`Folder or subfolder "${childName}" already exists.`);
            return;
        }

        setFolders((current) =>
            current.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        children: [...item.children, childName],
                        childDraft: "",
                    }
                    : item,
            ),
        );

        setError("");
    }

    function removeSubfolder(folderId: number, childName: string) {
        setFolders((current) =>
            current.map((folder) =>
                folder.id === folderId
                    ? {
                        ...folder,
                        children: folder.children.filter(
                            (child) => child !== childName,
                        ),
                    }
                    : folder,
            ),
        );

        setError("");
    }

    function completeFolders() {
        setError("");
        setSuccess("");

        if (folders.length === 0) {
            setError("Please add at least one folder.");
            return;
        }

        if (folders.some((folder) => !folder.fname.trim())) {
            setError("Please enter a name for every folder.");
            return;
        }

        if (folders.some((folder) => !folder.fnamedesc.trim())) {
            setError("Please enter a description for every folder.");
            return;
        }

        if (folders.some((folder) => folder.childDraft.trim())) {
            setError('Click "Add Subfolder" to save each entered subfolder.');
            return;
        }

        const rootNames = folders.map(
            (folder) => folder.fname.trim().toLowerCase(),
        );

        if (new Set(rootNames).size !== rootNames.length) {
            setError("Folder names must be unique.");
            return;
        }

        const allNames = folders.flatMap((folder) => [
            folder.fname.trim().toLowerCase(),
            ...folder.children.map((child) => child.trim().toLowerCase()),
        ]);

        if (new Set(allNames).size !== allNames.length) {
            setError("Folder and subfolder names must be unique.");
            return;
        }

        setFoldersCompleted(true);
    }

    function editFolders() {
        setFoldersCompleted(false);
        setError("");
        setSuccess("");
    }

    // Role operations.
    function addRole() {
        const roleName = roleDraft.trim();

        if (!roleName) {
            setError("Please enter a role name.");
            return;
        }

        if (
            roles.some(
                (role) => role.toLowerCase() === roleName.toLowerCase(),
            )
        ) {
            setError(`Role "${roleName}" has already been added.`);
            return;
        }

        setRoles((current) => [...current, roleName]);
        setRoleDraft("");
        setError("");
        setSuccess("");
    }

    function removeRole(roleName: string) {
        setRoles((current) => current.filter((role) => role !== roleName));
        setError("");
    }

    // Create the template.
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (loadingTemplate) {
            setError("Please wait until the template finishes loading.");
            return;
        }

        if (!templateCompleted) {
            setError("Please complete the Template card first.");
            return;
        }

        if (!foldersCompleted) {
            setError("Please complete the Folders & Subfolders card.");
            return;
        }

        if (roleDraft.trim()) {
            setError('Click "Add Role" to save the role you entered.');
            return;
        }

        if (roles.length === 0) {
            setError("Please add at least one role.");
            return;
        }

        if (isEditMode) {
            setError(
                "An update API is not configured yet. Your changes have not been saved.",
            );
            return;
        }

        const payload: TemplateCompletePayload = {
            name: name.trim(),
            name_desc: nameDesc.trim(),
            projecttype: Number(projectType),
            folders: folders.map((folder) => ({
                fname: folder.fname.trim(),
                fnamedesc: folder.fnamedesc.trim(),
                children: folder.children.map((child) => ({
                    fname: child.trim(),
                    fnamedesc: "",
                    children: [],
                })),
            })),
            roles: roles.map((role) => role.trim()),
        };

        try {
            setSaving(true);

            const response = await createTemplateComplete(payload);

            setSuccess(response.message || "Template created successfully.");

            setName("");
            setNameDesc("");
            setProjectType("");
            setFolders([]);
            setNextFolderId(1);
            setRoles([]);
            setRoleDraft("");
            setTemplateCompleted(false);
            setFoldersCompleted(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create the template. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    // Shared styles.
    const inputClass =
        "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900 dark:disabled:bg-gray-800";

    const labelClass =
        "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

    const cardClass =
        "flex h-[calc(100vh-290px)] min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900";

    const cardHeaderClass =
        "shrink-0 border-b border-gray-200 px-4 py-4 dark:border-gray-800";

    const cardBodyClass =
        "flex min-h-0 flex-1 flex-col overflow-hidden p-4";

    const primaryButtonClass =
        "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

    const secondaryButtonClass =
        "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

    const subfolderCount = folders.reduce(
        (total, folder) => total + folder.children.length,
        0,
    );

    const selectedProjectType =
        projectTypes.find(
            (item) => String(item.ptypeid) === projectType,
        )?.projecttype ?? "—";

    return (
        <div className="min-h-[calc(100vh-90px)] bg-gray-50 px-4 py-4 dark:bg-gray-950 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1800px]">
                <div className="mb-7">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Masters / Templates
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                        {isEditMode ? "Edit Template" : "Create Template"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Complete the template details, organize folders and
                        subfolders, and define the roles.
                    </p>
                </div>

                {loadingTemplate && (
                    <div className="mb-5 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading template details...
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        role="status"
                        className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                    >
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                        {/* Template details */}
                        <section className={cardClass}>
                            <div className={cardHeaderClass}>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                        {templateCompleted ? (
                                            <Check size={20} />
                                        ) : (
                                            <FileText size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                            1. Template
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Enter the basic template information.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={cardBodyClass}>
                                <fieldset
                                    disabled={
                                        templateCompleted ||
                                        saving ||
                                        loadingTemplate
                                    }
                                    className="space-y-5"
                                >
                                    <div>
                                        <label htmlFor="template-name" className={labelClass}>
                                            Template Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="template-name"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="e.g. Magazine Publishing"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="template-description" className={labelClass}>
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="template-description"
                                            value={nameDesc}
                                            onChange={(event) => setNameDesc(event.target.value)}
                                            placeholder="Describe the purpose of this template"
                                            rows={4}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="project-type" className={labelClass}>
                                            Project Type <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="project-type"
                                                value={projectType}
                                                onChange={(event) => setProjectType(event.target.value)}
                                                className={`${inputClass} appearance-none pr-10`}
                                                disabled={
                                                    loadingTypes ||
                                                    templateCompleted ||
                                                    saving ||
                                                    loadingTemplate
                                                }
                                            >
                                                <option value="">
                                                    {loadingTypes
                                                        ? "Loading project types..."
                                                        : "Select project type"}
                                                </option>
                                                {projectTypes.map((item) => (
                                                    <option
                                                        key={item.ptypeid}
                                                        value={item.ptypeid}
                                                    >
                                                        {item.projecttype}
                                                    </option>
                                                ))}
                                            </select>
                                            {loadingTypes ? (
                                                <Loader2
                                                    size={17}
                                                    className="absolute right-3 top-3 animate-spin text-gray-400"
                                                />
                                            ) : (
                                                <ChevronDown
                                                    size={17}
                                                    className="pointer-events-none absolute right-3 top-3 text-gray-400"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </fieldset>

                                <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800">
                                    {templateCompleted ? (
                                        <button
                                            type="button"
                                            onClick={editTemplate}
                                            disabled={saving || loadingTemplate}
                                            className={secondaryButtonClass}
                                        >
                                            Edit Template
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={completeTemplate}
                                            disabled={saving || loadingTypes || loadingTemplate}
                                            className={primaryButtonClass}
                                        >
                                            <Check size={16} />
                                            Complete Template
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Folders and subfolders */}
                        <section className={`${cardClass} ${foldersLocked ? "opacity-60" : ""}`}>
                            <div className={cardHeaderClass}>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                        {foldersCompleted ? <Check size={20} /> : <Folder size={20} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                            2. Folders &amp; Subfolders
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Create folders and optionally add subfolders.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={cardBodyClass}>
                                {foldersLocked ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        Complete the Template card to unlock folders.
                                    </div>
                                ) : (
                                    <>
                                        <fieldset
                                            disabled={foldersCompleted || saving || loadingTemplate}
                                            className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-2"
                                        >
                                            {folders.map((folder, index) => (
                                                <div
                                                    key={folder.id}
                                                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                                                >
                                                    <div className="mb-4 flex items-center justify-between gap-2">
                                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                                            <Folder size={17} className="text-blue-600 dark:text-blue-400" />
                                                            Folder {index + 1}
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFolder(folder.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 size={14} />
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label htmlFor={`folder-name-${folder.id}`} className={labelClass}>
                                                                Folder Name <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                id={`folder-name-${folder.id}`}
                                                                value={folder.fname}
                                                                onChange={(event) =>
                                                                    updateFolder(folder.id, "fname", event.target.value)
                                                                }
                                                                placeholder="e.g. Manuscript"
                                                                className={inputClass}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label htmlFor={`folder-description-${folder.id}`} className={labelClass}>
                                                                Folder Description <span className="text-red-500">*</span>
                                                            </label>
                                                            <textarea
                                                                id={`folder-description-${folder.id}`}
                                                                value={folder.fnamedesc}
                                                                onChange={(event) =>
                                                                    updateFolder(folder.id, "fnamedesc", event.target.value)
                                                                }
                                                                placeholder="Describe this folder"
                                                                rows={2}
                                                                className={inputClass}
                                                            />
                                                        </div>

                                                        <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                                                            <label htmlFor={`subfolder-${folder.id}`} className={labelClass}>
                                                                Subfolders
                                                            </label>
                                                            <input
                                                                id={`subfolder-${folder.id}`}
                                                                value={folder.childDraft}
                                                                onChange={(event) =>
                                                                    updateFolder(folder.id, "childDraft", event.target.value)
                                                                }
                                                                onKeyDown={(event) => {
                                                                    if (event.key === "Enter") {
                                                                        event.preventDefault();
                                                                        addSubfolder(folder.id);
                                                                    }
                                                                }}
                                                                placeholder="Enter a subfolder name"
                                                                className={inputClass}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => addSubfolder(folder.id)}
                                                                className={`${secondaryButtonClass} mt-2 w-full`}
                                                            >
                                                                <CirclePlus size={16} />
                                                                Add Subfolder
                                                            </button>

                                                            {folder.children.length > 0 ? (
                                                                <div className="mt-3 space-y-2">
                                                                    {folder.children.map((child, childIndex) => (
                                                                        <div
                                                                            key={`${folder.id}-child-${childIndex}`}
                                                                            className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/70"
                                                                        >
                                                                            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                                                                <Folder size={14} className="shrink-0 text-gray-400" />
                                                                                <span className="break-words">{child}</span>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeSubfolder(folder.id, child)}
                                                                                aria-label={`Remove subfolder ${child}`}
                                                                                className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-2 text-xs text-gray-400">
                                                                    No subfolders added. Subfolders are optional.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={addFolder}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-600 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                                            >
                                                <CirclePlus size={18} />
                                                Add Folder
                                            </button>

                                            {folders.length === 0 && (
                                                <p className="text-center text-xs text-gray-400">
                                                    Add at least one folder to continue.
                                                </p>
                                            )}
                                        </fieldset>

                                        <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800">
                                            {foldersCompleted ? (
                                                <button
                                                    type="button"
                                                    onClick={editFolders}
                                                    disabled={saving || loadingTemplate}
                                                    className={secondaryButtonClass}
                                                >
                                                    Edit Folders
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={completeFolders}
                                                    disabled={saving || loadingTemplate}
                                                    className={primaryButtonClass}
                                                >
                                                    <Check size={16} />
                                                    Complete Folders
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Roles */}
                        <section className={`${cardClass} ${rolesLocked ? "opacity-60" : ""}`}>
                            <div className={cardHeaderClass}>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                        <Users size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                            3. Roles
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Define the roles for this template.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={cardBodyClass}>
                                {rolesLocked ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        Complete the Template and Folders cards to unlock roles.
                                    </div>
                                ) : (
                                    <>
                                        <fieldset
                                            disabled={saving || loadingTemplate}
                                            className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-2"
                                        >
                                            <div>
                                                <label htmlFor="role-name" className={labelClass}>
                                                    Role Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="role-name"
                                                    value={roleDraft}
                                                    onChange={(event) => setRoleDraft(event.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === "Enter") {
                                                            event.preventDefault();
                                                            addRole();
                                                        }
                                                    }}
                                                    placeholder="e.g. Author"
                                                    className={inputClass}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addRole}
                                                    className={`${primaryButtonClass} mt-2 w-full`}
                                                >
                                                    <CirclePlus size={16} />
                                                    Add Role
                                                </button>
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                    Add each role individually. Duplicate names are not allowed.
                                                </p>
                                            </div>

                                            {roles.length > 0 ? (
                                                <div className="space-y-2">
                                                    {roles.map((role, index) => (
                                                        <div
                                                            key={`${role}-${index}`}
                                                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                                                    <Users size={16} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                                                                        {role}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        Role {index + 1}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRole(role)}
                                                                aria-label={`Remove role ${role}`}
                                                                className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                                                    <Users size={26} className="mx-auto text-gray-400" />
                                                    <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        No roles added yet
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Add at least one role before submitting.
                                                    </p>
                                                </div>
                                            )}
                                        </fieldset>

                                        <div className="mt-auto rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Template Summary
                                            </h3>
                                            <dl className="mt-3 space-y-3 text-sm">
                                                <div className="flex justify-between gap-3">
                                                    <dt className="text-gray-500">Template</dt>
                                                    <dd className="max-w-[65%] break-words text-right font-medium text-gray-900 dark:text-white">
                                                        {name || "—"}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between gap-3">
                                                    <dt className="text-gray-500">Project Type</dt>
                                                    <dd className="text-right font-medium text-gray-900 dark:text-white">
                                                        {selectedProjectType}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between gap-3">
                                                    <dt className="text-gray-500">Folders</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-white">
                                                        {folders.length}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between gap-3">
                                                    <dt className="text-gray-500">Subfolders</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-white">
                                                        {subfolderCount}
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between gap-3">
                                                    <dt className="text-gray-500">Roles</dt>
                                                    <dd className="font-medium text-gray-900 dark:text-white">
                                                        {roles.length}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Submit */}
                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {isEditMode
                                    ? "Ready to update your template?"
                                    : "Ready to create your template?"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Complete all three sections before submitting.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => navigate("/templates")}
                                    disabled={saving}
                                    className={secondaryButtonClass}
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={
                                    loadingTemplate ||
                                    saving ||
                                    !templateCompleted ||
                                    !foldersCompleted ||
                                    roles.length === 0
                                }
                                className={`${primaryButtonClass} w-full sm:w-auto`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={17} className="animate-spin" />
                                        Creating Template...
                                    </>
                                ) : (
                                    <>
                                        <Check size={17} />
                                        {isEditMode ? "Update Template" : "Create Template"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}