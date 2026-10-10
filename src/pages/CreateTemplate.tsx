
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
    ArrowLeft,
    ArrowRight,
    X,
    Upload,
    FileUp,
    FileSpreadsheet,
    FileType,
    Eye,
    RotateCcw,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

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

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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

interface FolderForm {
    id: number;
    fname: string;
    fnamedesc: string;
    children: FolderForm[];
    childDraft: string;
}

interface ParsedFolder {
    fname: string;
    fnamedesc: string;
    children: ParsedFolder[];
}

type ImportMode = "manual" | "upload";
type FileFormat = "markdown" | "text" | "pdf" | "docx" | "xlsx" | "csv";

const WIZARD_STEPS = [
    { number: 1, title: "Template Details", description: "Basic information", icon: FileText },
    { number: 2, title: "Folders", description: "Folders & subfolders", icon: Folder },
    { number: 3, title: "Roles", description: "Roles & submission", icon: Users },
];

const inputClass =
    "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900 dark:disabled:bg-gray-800";

const labelClass =
    "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

const primaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";


function uniqueName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}

function isApiFolder(value: unknown): value is ApiFolder {
    return typeof value === "object" && value !== null;
}

function getFileFormat(fileName: string): FileFormat | null {
    switch (fileName.split(".").pop()?.toLowerCase()) {
        case "md": return "markdown";
        case "txt": return "text";
        case "pdf": return "pdf";
        case "docx": return "docx";
        case "xlsx": return "xlsx";
        case "csv": return "csv";
        default: return null;
    }
}

/**
 * Parse text with indentation, Markdown headings, or explicit Parent fields.
 *
 * Examples:
 *
 * Folder1
 *   Subfolder1
 *     NestedFolder
 *
 * Folder: Documents
 * Description: Main documents
 *
 * Folder: Drafts
 * Parent: Documents
 * Description: Draft files
 */
function parseFolderText(text: string): ParsedFolder[] {
    const roots: ParsedFolder[] = [];
    const stack: { indent: number; folder: ParsedFolder }[] = [];

    let current: ParsedFolder | null = null;
    let explicitFolderName = "";

    function visit(items: ParsedFolder[]): ParsedFolder[] {
        return items.flatMap((item) => [item, ...visit(item.children)]);
    }

    function removeFromTree(
        items: ParsedFolder[],
        target: ParsedFolder,
    ): boolean {
        const index = items.indexOf(target);

        if (index >= 0) {
            items.splice(index, 1);
            return true;
        }

        return items.some((item) => removeFromTree(item.children, target));
    }

    function findLatestFolder(name: string): ParsedFolder | undefined {
        const normalized = uniqueName(name).toLowerCase();

        return visit(roots)
            .reverse()
            .find((folder) => folder.fname.toLowerCase() === normalized);
    }

    function moveToParent(
        folder: ParsedFolder,
        parentName: string,
    ): void {
        const parent = findLatestFolder(parentName);

        if (!parent) {
            throw new Error(
                `Parent folder "${parentName}" was not found for "${folder.fname}". Add the parent folder first.`,
            );
        }

        if (parent === folder || visit(folder.children).includes(parent)) {
            throw new Error("A folder cannot be its own parent or a descendant of itself.");
        }

        removeFromTree(roots, folder);
        parent.children.push(folder);

        // Preserve the reference so following Description fields work.
        current = folder;
        stack.length = 0;
    }

    for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
        if (!rawLine.trim()) continue;

        const rawIndent = rawLine.match(/^[\t ]*/)?.[0] ?? "";
        const indentation = rawIndent.replace(/\t/g, "    ").length;

        let line = rawLine.trim().replace(/^[-*+]\s+/, "");
        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        let indent = indentation;

        if (heading) {
            // Markdown heading depth also expresses hierarchy.
            indent = heading[1].length * 4;
            line = heading[2].trim();
        }

        const descriptionMatch = line.match(/^(?:description|desc)\s*:\s*(.*)$/i);

        if (descriptionMatch) {
            if (current) current.fnamedesc = descriptionMatch[1].trim();
            continue;
        }

        const parentMatch = line.match(/^parent\s*:\s*(.+)$/i);

        if (parentMatch) {
            if (!current) {
                throw new Error("A Parent field must follow a folder declaration.");
            }

            moveToParent(current, parentMatch[1]);
            continue;
        }

        if (/^(?:roles?|children|subfolders?)\s*:/i.test(line)) {
            continue;
        }

        const folderMatch = line.match(/^(folder|subfolder|name)\s*:\s*(.+)$/i);
        let folderName: string;
        let isSubfolderDeclaration = false;

        if (folderMatch) {
            isSubfolderDeclaration = folderMatch[1].toLowerCase() === "subfolder";
            folderName = uniqueName(folderMatch[2]);
        } else {
            // Ignore unrelated key/value metadata.
            if (line.includes(":")) continue;
            folderName = uniqueName(line);
        }

        if (!folderName) continue;

        const folder: ParsedFolder = {
            fname: folderName,
            fnamedesc: folderName,
            children: [],
        };

        if (isSubfolderDeclaration && explicitFolderName) {
            const parent = findLatestFolder(explicitFolderName);

            if (!parent) {
                throw new Error(`Parent folder "${explicitFolderName}" was not found.`);
            }

            parent.children.push(folder);
            stack.length = 0;
            stack.push({ indent: indent + 1, folder: parent });
        } else {
            while (stack.length && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            const parentEntry = stack[stack.length - 1];

            if (parentEntry && indent > parentEntry.indent) {
                parentEntry.folder.children.push(folder);
            } else {
                roots.push(folder);
            }

            stack.push({ indent, folder });
        }

        current = folder;

        if (folderMatch && folderMatch[1].toLowerCase() === "folder") {
            explicitFolderName = folderName;
        } else if (!folderMatch) {
            explicitFolderName = "";
        }
    }

    if (!roots.length) {
        throw new Error("No folders were found in the uploaded file.");
    }

    return roots;
}

function parseSpreadsheetRows(rows: unknown[][]): ParsedFolder[] {
    if (rows.length < 2) {
        throw new Error("The spreadsheet must contain a header row and at least one folder row.");
    }

    const headers = rows[0].map((value) =>
        String(value ?? "").trim().toLowerCase(),
    );

    const folderIndex = headers.findIndex((header) =>
        ["folder", "folder name", "fname", "name"].includes(header),
    );

    const parentIndex = headers.findIndex((header) =>
        ["parent", "parent folder", "parentfolder"].includes(header),
    );

    const descriptionIndex = headers.findIndex((header) =>
        ["description", "folder description", "fnamedesc"].includes(header),
    );

    if (folderIndex < 0) {
        throw new Error('The spreadsheet needs a "Folder" or "Folder Name" column.');
    }

    const records = rows.slice(1)
        .map((row) => ({
            fname: uniqueName(String(row[folderIndex] ?? "")),
            parent: uniqueName(String(parentIndex >= 0 ? row[parentIndex] ?? "" : "")),
            fnamedesc: String(descriptionIndex >= 0 ? row[descriptionIndex] ?? "" : "").trim(),
            children: [] as ParsedFolder[],
        }))
        .filter((item) => item.fname);

    const roots: ParsedFolder[] = [];
    const byName = new Map<string, ParsedFolder[]>();

    for (const record of records) {
        const folder: ParsedFolder = {
            fname: record.fname,
            fnamedesc: record.fnamedesc || record.fname,
            children: [],
        };

        if (record.parent) {
            const candidates = byName.get(record.parent.toLowerCase()) ?? [];
            const parent = candidates[candidates.length - 1];

            if (!parent) {
                throw new Error(
                    `Parent folder "${record.parent}" must appear before "${record.fname}" in the spreadsheet.`,
                );
            }

            parent.children.push(folder);
        } else {
            roots.push(folder);
        }

        const key = folder.fname.toLowerCase();
        byName.set(key, [...(byName.get(key) ?? []), folder]);
    }

    if (!roots.length) {
        throw new Error("The spreadsheet must contain at least one root folder.");
    }

    return roots;
}

async function extractPdfText(file: File): Promise<string> {
    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
    }).promise;

    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const items = content.items
            .filter((item): item is typeof item & { str: string; transform: number[] } =>
                "str" in item &&
                typeof item.str === "string" &&
                item.str.trim().length > 0 &&
                "transform" in item,
            )
            .map((item) => ({
                text: item.str.trim(),
                x: item.transform[4],
                y: item.transform[5],
            }))
            .sort((a, b) => Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x);

        const lines: { y: number; x: number; text: string }[] = [];

        for (const item of items) {
            let target = lines.find((line) => Math.abs(line.y - item.y) <= 3);

            if (!target) {
                target = { y: item.y, x: item.x, text: "" };
                lines.push(target);
            }

            target.x = Math.min(target.x, item.x);
            target.text += `${target.text ? " " : ""}${item.text}`;
        }

        lines.sort((a, b) => b.y - a.y);

        if (lines.length) {
            const minX = Math.min(...lines.map((line) => line.x));

            pages.push(lines.map((line) => {
                const indent = Math.max(0, Math.round((line.x - minX) / 12));
                return `${" ".repeat(indent * 2)}${line.text}`;
            }).join("\n"));
        }
    }

    const result = pages.join("\n");

    if (!result.trim()) {
        throw new Error("No selectable text was found in this PDF. Scanned PDFs require OCR before import.");
    }

    return result;
}

async function extractDocxText(file: File): Promise<string> {
    const result = await mammoth.extractRawText({
        arrayBuffer: await file.arrayBuffer(),
    });

    if (!result.value.trim()) {
        throw new Error("No readable text was found in this Word document.");
    }

    return result.value;
}

async function parseUploadedFile(
    file: File,
    format: FileFormat,
): Promise<ParsedFolder[]> {
    if (format === "xlsx" || format === "csv") {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const firstSheet = workbook.SheetNames[0];

        if (!firstSheet) throw new Error("No worksheet was found in this file.");

        const rows = XLSX.utils.sheet_to_json<unknown[]>(
            workbook.Sheets[firstSheet],
            { header: 1, defval: "" },
        );

        return parseSpreadsheetRows(rows);
    }

    let text = "";

    switch (format) {
        case "markdown":
        case "text":
            text = await file.text();
            break;
        case "pdf":
            text = await extractPdfText(file);
            break;
        case "docx":
            text = await extractDocxText(file);
            break;
    }

    if (!text.trim()) throw new Error("The uploaded file is empty.");

    return parseFolderText(text);
}

function normalizeFolders(apiFolders: ApiFolder[]): FolderForm[] {
    let nextId = 1;

    const makeFolder = (
        source: ApiFolder,
        children: FolderForm[] = [],
    ): FolderForm => ({
        id: nextId++,
        fname: source.fname ?? "",
        fnamedesc: source.fnamedesc ?? "",
        children,
        childDraft: "",
    });

    const buildEmbedded = (
        source: ApiFolder,
        ancestors: Set<ApiFolder>,
    ): FolderForm => {
        if (ancestors.has(source)) {
            return makeFolder(source);
        }

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(source);

        const embedded = (source.children ?? [])
            .filter(isApiFolder)
            .map((child) => buildEmbedded(child, nextAncestors));

        return makeFolder(source, embedded);
    };

    // If the API returns nested children, preserve that structure.
    const hasEmbeddedObjects = apiFolders.some((folder) =>
        (folder.children ?? []).some(isApiFolder),
    );

    if (hasEmbeddedObjects) {
        return apiFolders
            .filter((folder) => folder.pid == null)
            .map((folder) => buildEmbedded(folder, new Set()));
    }

    // If the API returns a flat folder list, build the tree using pid.
    const byId = new Map<number, ApiFolder>();
    for (const folder of apiFolders) {
        if (folder.fid !== undefined) byId.set(folder.fid, folder);
    }

    const childrenByParent = new Map<number, ApiFolder[]>();
    const roots: ApiFolder[] = [];

    for (const folder of apiFolders) {
        if (folder.pid != null && byId.has(folder.pid)) {
            childrenByParent.set(folder.pid, [
                ...(childrenByParent.get(folder.pid) ?? []),
                folder,
            ]);
        } else {
            roots.push(folder);
        }
    }

    const buildFlat = (folder: ApiFolder, ancestors: Set<number>): FolderForm => {
        const id = folder.fid;

        if (id !== undefined && ancestors.has(id)) return makeFolder(folder);

        const nextAncestors = new Set(ancestors);
        if (id !== undefined) nextAncestors.add(id);

        const embeddedNames = new Set(
            (folder.children ?? [])
                .map((child) => typeof child === "string" ? child.trim().toLowerCase() : "")
                .filter(Boolean),
        );

        const nested = id === undefined
            ? []
            : (childrenByParent.get(id) ?? []).filter((child) =>
                !embeddedNames.has((child.fname ?? "").trim().toLowerCase()),
            );

        const embedded: FolderForm[] = (folder.children ?? [])
            .filter((child): child is string => typeof child === "string")
            .map((fname) => makeFolder({ fname }));

        return makeFolder(
            folder,
            [
                ...nested.map((child) => buildFlat(child, nextAncestors)),
                ...embedded,
            ],
        );
    };

    return roots.map((folder) => buildFlat(folder, new Set()));
}

function countDescendants(folders: FolderForm[]): number {
    return folders.reduce(
        (total, folder) => total + folder.children.length + countDescendants(folder.children),
        0,
    );
}

function countAllFolders(folders: FolderForm[]): number {
    return folders.length + countDescendants(folders);
}

function validateFolderTree(folders: FolderForm[]): string | null {
    if (!folders.length) return "Please add at least one folder.";

    const visit = (items: FolderForm[], path: string): string | null => {
        const siblingNames = new Set<string>();

        for (const folder of items) {
            const name = folder.fname.trim();
            const currentPath = path ? `${path} / ${name || "Unnamed folder"}` : name || "Unnamed folder";

            if (!name) return `Please enter a name for every folder. (${currentPath})`;
            if (!folder.fnamedesc.trim()) return `Please enter a description for "${name}".`;
            if (folder.childDraft.trim()) {
                return `Click "Add Subfolder" to save the entered name under "${name}".`;
            }

            const normalized = name.toLowerCase();
            if (siblingNames.has(normalized)) {
                return `Folder name "${name}" is duplicated among siblings under "${path || "root"}".`;
            }

            siblingNames.add(normalized);

            const childError = visit(folder.children, currentPath);
            if (childError) return childError;
        }

        return null;
    };

    return visit(folders, "");
}

interface FolderEditorProps {
    folder: FolderForm;
    index: number;
    depth: number;
    disabled: boolean;
    update: (id: number, field: "fname" | "fnamedesc" | "childDraft", value: string) => void;
    addChild: (id: number) => void;
    remove: (id: number) => void;
}

function FolderEditor({
    folder,
    index,
    depth,
    disabled,
    update,
    addChild,
    remove,
}: FolderEditorProps) {
    return (
        <section className={`rounded-xl border border-gray-200 dark:border-gray-700 ${depth ? "ml-4 sm:ml-7" : ""}`}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex min-w-0 items-center gap-2">
                    <Folder size={17} className="shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {depth ? `Level ${depth + 1} · Folder ${index + 1}` : `Folder ${index + 1}`}
                        </h3>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {folder.fname.trim() || "Unnamed folder"}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => remove(folder.id)}
                    disabled={disabled}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Remove</span>
                </button>
            </div>

            <div className="space-y-4 p-4">
                <div>
                    <label htmlFor={`folder-name-${folder.id}`} className={labelClass}>Folder Name *</label>
                    <input
                        id={`folder-name-${folder.id}`}
                        value={folder.fname}
                        onChange={(event) => update(folder.id, "fname", event.target.value)}
                        placeholder="Enter folder name"
                        className={inputClass}
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label htmlFor={`folder-description-${folder.id}`} className={labelClass}>Folder Description *</label>
                    <textarea
                        id={`folder-description-${folder.id}`}
                        value={folder.fnamedesc}
                        onChange={(event) => update(folder.id, "fnamedesc", event.target.value)}
                        placeholder="Describe this folder"
                        rows={2}
                        className={inputClass}
                        disabled={disabled}
                    />
                </div>

                <div className="border-t border-gray-100 pt-4 dark:border-gray-800">
                    <label htmlFor={`subfolder-${folder.id}`} className={labelClass}>Add Subfolder</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id={`subfolder-${folder.id}`}
                            value={folder.childDraft}
                            onChange={(event) => update(folder.id, "childDraft", event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    addChild(folder.id);
                                }
                            }}
                            placeholder="Enter a subfolder name"
                            className={inputClass}
                            disabled={disabled}
                        />
                        <button
                            type="button"
                            onClick={() => addChild(folder.id)}
                            disabled={disabled}
                            className={`${secondaryButtonClass} shrink-0`}
                        >
                            <CirclePlus size={16} /> Add
                        </button>
                    </div>
                </div>

                {folder.children.length > 0 && (
                    <div className="space-y-3 border-l-2 border-blue-100 pl-2 dark:border-blue-950">
                        {folder.children.map((child, childIndex) => (
                            <FolderEditor
                                key={child.id}
                                folder={child}
                                index={childIndex}
                                depth={depth + 1}
                                disabled={disabled}
                                update={update}
                                addChild={addChild}
                                remove={remove}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function PreviewFolder({ folder, depth = 0 }: { folder: ParsedFolder; depth?: number }) {
    return (
        <div className="min-w-0">
            <div className="flex items-start gap-2">
                <Folder size={15} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                        {folder.fname}
                    </p>
                    {folder.fnamedesc && (
                        <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                            {folder.fnamedesc}
                        </p>
                    )}
                </div>
            </div>
            {folder.children.length > 0 && (
                <div className={`mt-2 space-y-2 border-l border-gray-200 pl-3 dark:border-gray-700 ${depth ? "ml-2" : "ml-3"}`}>
                    {folder.children.map((child, index) => (
                        <PreviewFolder key={`${child.fname}-${index}`} folder={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

function toTemplateFolderPayload(
    folder: FolderForm,
): TemplateCompletePayload["folders"][number] {
    return {
        fname: folder.fname.trim(),
        fnamedesc: folder.fnamedesc.trim(),
        children: folder.children.map(toTemplateFolderPayload),
    };
}

export default function CreateTemplate() {
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navigationState = location.state as TemplateNavigationState | null;
    const editTemplateId = navigationState?.editTemplateId;
    const isEditMode = editTemplateId !== undefined && editTemplateId !== null;

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

    const [currentStep, setCurrentStep] = useState(1);
    const [folderMode, setFolderMode] = useState<ImportMode>("manual");

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedPreview, setParsedPreview] = useState<ParsedFolder[]>([]);
    const [importedFileName, setImportedFileName] = useState("");
    const [parsingFile, setParsingFile] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadProjectTypes() {
            try {
                setLoadingTypes(true);
                const response = await getProjectTypes();
                if (!cancelled) setProjectTypes(response.projecttypes ?? []);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Unable to load project types.");
                }
            } finally {
                if (!cancelled) setLoadingTypes(false);
            }
        }

        void loadProjectTypes();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!isEditMode || editTemplateId === undefined) return;

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

                const apiFolders = (details.folders ?? []) as unknown as ApiFolder[];
                const mappedFolders = normalizeFolders(apiFolders);

                setFolders(mappedFolders);
                setNextFolderId(countAllFolders(mappedFolders) + 1);

                const apiRoles = (details.roles ?? []) as ApiRole[];
                setRoles(
                    apiRoles
                        .map((role) => role.rolename)
                        .filter((role): role is string => typeof role === "string" && !!role.trim()),
                );

                setRoleDraft("");
                setCurrentStep(1);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Unable to load template details for editing.");
                }
            } finally {
                if (!cancelled) setLoadingTemplate(false);
            }
        }

        void loadTemplateForEdit();
        return () => { cancelled = true; };
    }, [isEditMode, editTemplateId]);

    function continueToFolders() {
        setError("");
        setSuccess("");

        if (!name.trim()) return setError("Please enter a template name.");
        if (!nameDesc.trim()) return setError("Please enter a template description.");
        if (!projectType) return setError("Please select a project type.");
        if (loadingTypes) return setError("Please wait until project types finish loading.");

        setCurrentStep(2);
    }

    function validateFolders(): boolean {
        const validationError = validateFolderTree(folders);

        if (validationError) {
            setError(validationError);
            return false;
        }

        return true;
    }

    function continueToRoles() {
        setError("");
        setSuccess("");
        if (validateFolders()) setCurrentStep(3);
    }

    function goBack() {
        setError("");
        setSuccess("");
        setCurrentStep((step) => Math.max(1, step - 1));
    }

    function goToStep(step: number) {
        if (step < currentStep && !saving && !loadingTemplate) {
            setError("");
            setSuccess("");
            setCurrentStep(step);
        }
    }

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
        const updateTree = (items: FolderForm[]): FolderForm[] =>
            items.map((folder) => folder.id === id
                ? { ...folder, [field]: value }
                : { ...folder, children: updateTree(folder.children) });

        setFolders((current) => updateTree(current));
        setError("");
    }

    function removeFolder(id: number) {
        const removeTree = (items: FolderForm[]): FolderForm[] =>
            items
                .filter((folder) => folder.id !== id)
                .map((folder) => ({
                    ...folder,
                    children: removeTree(folder.children),
                }));

        setFolders((current) => removeTree(current));
        setError("");
    }

    function addSubfolder(parentId: number) {
        let foundParent: FolderForm | undefined;

        const findParent = (items: FolderForm[]): void => {
            for (const folder of items) {
                if (folder.id === parentId) {
                    foundParent = folder;
                    return;
                }
                findParent(folder.children);
                if (foundParent) return;
            }
        };

        findParent(folders);

        const childName = foundParent?.childDraft.trim() ?? "";

        if (!foundParent || !childName) {
            setError("Please enter a subfolder name.");
            return;
        }

        if (foundParent.children.some(
            (child) => child.fname.trim().toLowerCase() === childName.toLowerCase(),
        )) {
            setError(`A subfolder named "${childName}" already exists under "${foundParent.fname}".`);
            return;
        }

        const newChild: FolderForm = {
            id: nextFolderId,
            fname: childName,
            fnamedesc: "",
            children: [],
            childDraft: "",
        };

        const updateTree = (items: FolderForm[]): FolderForm[] =>
            items.map((folder) => folder.id === parentId
                ? { ...folder, children: [...folder.children, newChild], childDraft: "" }
                : { ...folder, children: updateTree(folder.children) });

        setFolders((current) => updateTree(current));
        setNextFolderId((current) => current + 1);
        setError("");
    }

    async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setError("");
        setSuccess("");
        setParsedPreview([]);
        setSelectedFile(file);

        const format = getFileFormat(file.name);

        if (!format) {
            setError("Unsupported file type. Upload .md, .txt, .pdf, .docx, .xlsx, or .csv.");
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        if (file.size > 15 * 1024 * 1024) {
            setError("The file is too large. Please upload a file smaller than 15 MB.");
            setSelectedFile(null);
            event.target.value = "";
            return;
        }

        try {
            setParsingFile(true);

            const result = await parseUploadedFile(file, format);
            if (!result.length) throw new Error("No folders could be extracted from this file.");

            // Validate sibling duplicates without disallowing the same name
            // in different branches of the tree.
            const findDuplicate = (items: ParsedFolder[]): string | null => {
                const names = new Set<string>();

                for (const folder of items) {
                    const key = folder.fname.toLowerCase();

                    if (names.has(key)) return folder.fname;
                    names.add(key);

                    const nestedDuplicate = findDuplicate(folder.children);
                    if (nestedDuplicate) return nestedDuplicate;
                }

                return null;
            };

            const duplicate = findDuplicate(result);
            if (duplicate) {
                throw new Error(`The file contains duplicate sibling folder names: "${duplicate}".`);
            }

            setParsedPreview(result);
            setSuccess(`Found ${result.length} root folder(s) in "${file.name}". Review the preview before importing.`);
        } catch (err) {
            setParsedPreview([]);
            setError(err instanceof Error ? err.message : "Unable to parse this file.");
        } finally {
            setParsingFile(false);
        }
    }


    function FolderStructurePanel({ folders }: { folders: FolderForm[] }) {
        const totalFolders = countAllFolders(folders);
        const subfolders = countDescendants(folders);

        return (
            <aside className="h-fit min-w-0 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:sticky lg:top-4">
                <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Folder size={19} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Folder Structure
                        </h3>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Live preview of your folders and subfolders
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/40">
                            <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                                {folders.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Root</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {subfolders}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Nested</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {totalFolders}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        </div>
                    </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-4">
                    {folders.length > 0 ? (
                        <div className="space-y-3">
                            {folders.map((folder) => (
                                <FolderTreeNode key={folder.id} folder={folder} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Folder size={30} className="mx-auto text-gray-400" />
                            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                No folders yet
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Add a folder or import a file to see the structure here.
                            </p>
                        </div>
                    )}
                </div>
            </aside>
        );
    }

    function FolderTreeNode({
        folder,
        depth = 0,
    }: {
        folder: FolderForm;
        depth?: number;
    }) {
        return (
            <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-2">
                    <Folder
                        size={16}
                        className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium text-gray-900 dark:text-white">
                            {folder.fname.trim() || "Untitled folder"}
                        </p>
                    </div>
                    {folder.children.length > 0 && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {folder.children.length}
                        </span>
                    )}
                </div>

                {folder.children.length > 0 && (
                    <div className="ml-2 mt-2 space-y-3 border-l border-gray-200 pl-3 dark:border-gray-700">
                        {folder.children.map((child) => (
                            <FolderTreeNode
                                key={child.id}
                                folder={child}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }


    function applyImportedFolders() {
        if (!parsedPreview.length) {
            setError("Please upload and preview a valid folder structure first.");
            return;
        }

        let id = nextFolderId;

        const mapTree = (items: ParsedFolder[]): FolderForm[] =>
            items.map((folder) => ({
                id: id++,
                fname: folder.fname,
                fnamedesc: folder.fnamedesc.trim() || folder.fname.trim(),
                children: mapTree(folder.children),
                childDraft: "",
            }));

        const mapped = mapTree(parsedPreview);

        const shouldReplace =
            folders.length === 0 ||
            window.confirm("Importing this file will replace the current folder structure. Continue?");

        if (!shouldReplace) return;

        setFolders(mapped);
        setNextFolderId(id);
        setImportedFileName(selectedFile?.name ?? "");
        setError("");
        setSuccess("Folder structure imported. Review and edit it below.");
        setFolderMode("manual");
    }

    function resetFileImport() {
        setSelectedFile(null);
        setParsedPreview([]);
        setImportedFileName("");
        setError("");
        setSuccess("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function addRole() {
        const roleName = roleDraft.trim();

        if (!roleName) {
            setError("Please enter a role name.");
            return;
        }

        if (roles.some((role) => role.toLowerCase() === roleName.toLowerCase())) {
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
        setSuccess("");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (loadingTemplate) return setError("Please wait until the template finishes loading.");
        if (currentStep !== 3) return setError("Please complete the previous steps first.");

        if (!name.trim() || !nameDesc.trim() || !projectType) {
            setError("Please complete all template details.");
            setCurrentStep(1);
            return;
        }

        if (!validateFolders()) {
            setCurrentStep(2);
            return;
        }

        if (roleDraft.trim()) return setError('Click "Add Role" to save the role you entered.');
        if (!roles.length) return setError("Please add at least one role.");

        if (isEditMode) {
            setError("An update API is not configured yet. Your changes have not been saved.");
            return;
        }

        const payload: TemplateCompletePayload = {
            name: name.trim(),
            name_desc: nameDesc.trim(),
            projecttype: Number(projectType),
            folders: folders.map(toTemplateFolderPayload),
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
            setCurrentStep(1);
            setFolderMode("manual");
            resetFileImport();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create the template. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    const subfolderCount = countDescendants(folders);
    const selectedProjectType =
        projectTypes.find((item) => String(item.ptypeid) === projectType)?.projecttype ?? "—";
    const progress = (currentStep / WIZARD_STEPS.length) * 100;
    const disabled = saving || loadingTemplate;

    return (
        <div className="min-h-[calc(100vh-90px)] bg-gray-50 px-4 py-5 dark:bg-gray-950 sm:px-6 lg:px-8">
            <div className="mx-auto">
                <div className="mb-7">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Masters / Templates</p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                        {isEditMode ? "Edit Template" : "Create Template"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Configure template details, import or create folders, and define workflow roles.
                    </p>
                </div>

                {loadingTemplate && (
                    <div className="mb-5 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading template details...
                    </div>
                )}

                {error && (
                    <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                        <X size={18} className="mt-0.5 shrink-0" /><p>{error}</p>
                    </div>
                )}

                {success && (
                    <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                        <Check size={18} className="mt-0.5 shrink-0" /><p>{success}</p>
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Template Setup</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Step {currentStep} of 3</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {Math.round(progress)}% complete
                        </span>
                    </div>

                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={currentStep}>
                        <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {WIZARD_STEPS.map((step) => {
                            const StepIcon = step.icon;
                            const active = currentStep === step.number;
                            const completed = currentStep > step.number;

                            return (
                                <button
                                    key={step.number}
                                    type="button"
                                    onClick={() => goToStep(step.number)}
                                    disabled={step.number >= currentStep || disabled}
                                    className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-left transition sm:gap-3 sm:p-4 ${active ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : completed ? "border-blue-200 bg-white dark:border-blue-900 dark:bg-gray-900" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${active || completed ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                                        {completed ? <Check size={17} /> : <StepIcon size={17} />}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-xs font-semibold text-gray-900 dark:text-white sm:text-sm">{step.title}</span>
                                        <span className="mt-1 hidden text-xs text-gray-500 dark:text-gray-400 sm:block">{step.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-7">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                    {currentStep === 1 ? <FileText size={22} /> : currentStep === 2 ? <Folder size={22} /> : <Users size={22} />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {currentStep === 1 ? "Template Details" : currentStep === 2 ? "Folders & Subfolders" : "Roles & Review"}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {currentStep === 1 ? "Provide the basic information for your template." : currentStep === 2 ? "Create folders manually or import a folder structure." : "Define workflow roles and review your template."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {currentStep === 1 && (
                            <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-8">
                                <div>
                                    <label htmlFor="template-name" className={labelClass}>Template Name *</label>
                                    <input id="template-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Magazine Publishing" className={inputClass} disabled={disabled} required />
                                </div>
                                <div>
                                    <label htmlFor="template-description" className={labelClass}>Description *</label>
                                    <textarea id="template-description" value={nameDesc} onChange={(event) => setNameDesc(event.target.value)} placeholder="Describe the purpose of this template" rows={5} className={inputClass} disabled={disabled} required />
                                </div>
                                <div>
                                    <label htmlFor="project-type" className={labelClass}>Project Type *</label>
                                    <div className="relative">
                                        <select id="project-type" value={projectType} onChange={(event) => setProjectType(event.target.value)} className={`${inputClass} appearance-none pr-10`} disabled={loadingTypes || disabled} required>
                                            <option value="">{loadingTypes ? "Loading project types..." : "Select project type"}</option>
                                            {projectTypes.map((item) => <option key={item.ptypeid} value={item.ptypeid}>{item.projecttype}</option>)}
                                        </select>
                                        {loadingTypes ? <Loader2 size={17} className="absolute right-3 top-3 animate-spin text-gray-400" /> : <ChevronDown size={17} className="pointer-events-none absolute right-3 top-3 text-gray-400" />}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Next: Configure your folders</p>
                                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Your details will be retained as you move through the wizard.</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="grid grid-cols-1 items-start gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                                <div className="min-w-0 space-y-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Folder structure</p>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create nested folders or import them from a file.</p>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <span className="rounded-lg bg-blue-50 px-3 py-2 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">{folders.length} Root Folders</span>
                                            <span className="rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">{subfolderCount} Subfolders</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                                        <button type="button" onClick={() => { setFolderMode("manual"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${folderMode === "manual" ? "bg-white text-blue-700 shadow-sm dark:bg-gray-900 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"}`}>
                                            <Folder size={17} /> Manual Creation
                                        </button>
                                        <button type="button" onClick={() => { setFolderMode("upload"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium ${folderMode === "upload" ? "bg-white text-blue-700 shadow-sm dark:bg-gray-900 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"}`}>
                                            <Upload size={17} /> Upload File
                                        </button>
                                    </div>

                                    {folderMode === "upload" && (
                                        <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:p-5">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Import folders from a document</h3>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Supported: Markdown, TXT, PDF, DOCX, XLSX, CSV. Maximum 15 MB.</p>
                                            </div>

                                            <input ref={fileInputRef} type="file" accept=".md,.txt,.pdf,.docx,.xlsx,.csv" onChange={(event) => void handleFileSelection(event)} disabled={disabled || parsingFile} className="hidden" />

                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled || parsingFile} className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40 disabled:opacity-50 dark:border-gray-700 dark:hover:border-blue-700">
                                                {parsingFile ? <Loader2 size={30} className="animate-spin text-blue-600" /> : <FileUp size={30} className="text-blue-600 dark:text-blue-400" />}
                                                <span className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">{parsingFile ? "Reading and parsing file..." : "Choose a file to upload"}</span>
                                                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">.md · .txt · .pdf · .docx · .xlsx · .csv</span>
                                            </button>

                                            {selectedFile && (
                                                <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                    {["xlsx", "csv"].includes(getFileFormat(selectedFile.name) ?? "") ? <FileSpreadsheet size={22} className="shrink-0 text-green-600" /> : ["docx", "pdf"].includes(getFileFormat(selectedFile.name) ?? "") ? <FileType size={22} className="shrink-0 text-blue-600" /> : <FileText size={22} className="shrink-0 text-blue-600" />}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="break-all text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <button type="button" onClick={resetFileImport} disabled={parsingFile} aria-label="Remove selected file" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"><X size={17} /></button>
                                                </div>
                                            )}

                                            {parsedPreview.length > 0 && (
                                                <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                                                    <div className="flex items-center gap-2">
                                                        <Eye size={18} className="text-blue-600 dark:text-blue-400" />
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Import Preview</h4>
                                                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{parsedPreview.length} root folder(s)</span>
                                                    </div>
                                                    <div className="max-h-80 space-y-4 overflow-y-auto">
                                                        {parsedPreview.map((folder, index) => (
                                                            <div key={`${folder.fname}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                                                                <PreviewFolder folder={folder} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs leading-5 text-gray-600 dark:text-gray-300">
                                                        Importing replaces the current structure after confirmation. Every folder, including nested folders, needs a description before continuing.
                                                    </p>
                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <button type="button" onClick={applyImportedFolders} disabled={parsingFile || disabled} className={primaryButtonClass}><Check size={16} /> Import Folder Structure</button>
                                                        <button type="button" onClick={resetFileImport} disabled={parsingFile || disabled} className={secondaryButtonClass}><RotateCcw size={16} /> Clear Import</button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                                <p className="font-semibold">Suggested text structure</p>
                                                <pre className="mt-2 whitespace-pre-wrap font-mono">{`Documents\n  Drafts\n    Working Copy\n  Final Copy\nArchive`}</pre>
                                                <p className="mt-2">Alternatively, use <code>Folder:</code>, <code>Parent:</code>, and <code>Description:</code> lines. For Excel/CSV, use columns named <strong>Folder</strong>, <strong>Parent</strong>, and <strong>Description</strong>.</p>
                                            </div>
                                        </section>
                                    )}

                                    {folderMode === "manual" && (
                                        <div className="space-y-5">
                                            {importedFileName && (
                                                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                                                    <Check size={15} /> Imported from {importedFileName}. You can edit the structure below.
                                                </div>
                                            )}

                                            {folders.map((folder, index) => (
                                                <FolderEditor
                                                    key={folder.id}
                                                    folder={folder}
                                                    index={index}
                                                    depth={0}
                                                    disabled={disabled}
                                                    update={updateFolder}
                                                    addChild={addSubfolder}
                                                    remove={removeFolder}
                                                />
                                            ))}

                                            <button type="button" onClick={addFolder} disabled={disabled} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-700">
                                                <CirclePlus size={19} /> Add Another Root Folder
                                            </button>

                                            {folders.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                                                    <Folder size={30} className="mx-auto text-gray-400" />
                                                    <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">No folders added</p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add your first folder or switch to Upload File.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <FolderStructurePanel folders={folders} />
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_320px]">
                                <div className="min-w-0 space-y-5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Define Template Roles</h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add the roles that participate in this template's workflow.</p>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                        <label htmlFor="role-name" className={labelClass}>Role Name *</label>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <input id="role-name" value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault();
                                                    addRole();
                                                }
                                            }} placeholder="e.g. Author" className={inputClass} disabled={disabled} />
                                            <button type="button" onClick={addRole} disabled={disabled} className={`${primaryButtonClass} shrink-0`}><CirclePlus size={16} /> Add Role</button>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Duplicate role names are not allowed.</p>
                                    </div>

                                    {roles.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Added Roles</h3>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{roles.length} roles</span>
                                            </div>
                                            {roles.map((role, index) => (
                                                <div key={`${role}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3 dark:border-gray-700">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"><Users size={16} /></div>
                                                        <div className="min-w-0">
                                                            <p className="break-words text-sm font-medium text-gray-900 dark:text-white">{role}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Role {index + 1}</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeRole(role)} disabled={disabled} aria-label={`Remove role ${role}`} className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center dark:border-gray-700">
                                            <Users size={30} className="mx-auto text-gray-400" />
                                            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">No roles added yet</p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Add at least one role before submitting.</p>
                                        </div>
                                    )}
                                </div>

                                <aside className="h-fit rounded-xl border border-gray-200 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Template Summary</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review your configuration.</p>
                                    <dl className="mt-5 space-y-4 text-sm">
                                        <div><dt className="text-gray-500 dark:text-gray-400">Template Name</dt><dd className="mt-1 break-words font-medium text-gray-900 dark:text-white">{name || "—"}</dd></div>
                                        <div><dt className="text-gray-500 dark:text-gray-400">Description</dt><dd className="mt-1 break-words text-gray-700 dark:text-gray-200">{nameDesc || "—"}</dd></div>
                                        <div><dt className="text-gray-500 dark:text-gray-400">Project Type</dt><dd className="mt-1 font-medium text-gray-900 dark:text-white">{selectedProjectType}</dd></div>
                                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700"><dt className="text-gray-500 dark:text-gray-400">Root Folders</dt><dd className="mt-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white"><Folder size={16} className="text-blue-600 dark:text-blue-400" />{folders.length}</dd></div>
                                        <div><dt className="text-gray-500 dark:text-gray-400">Subfolders</dt><dd className="mt-1 font-medium text-gray-900 dark:text-white">{subfolderCount}</dd></div>
                                        <div><dt className="text-gray-500 dark:text-gray-400">Total Folders</dt><dd className="mt-1 font-medium text-gray-900 dark:text-white">{countAllFolders(folders)}</dd></div>
                                        <div><dt className="text-gray-500 dark:text-gray-400">Roles</dt><dd className="mt-1 flex items-center gap-2 font-medium text-gray-900 dark:text-white"><Users size={16} className="text-blue-600 dark:text-blue-400" />{roles.length}</dd></div>
                                    </dl>
                                    <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
                                        <p className="text-xs leading-5 text-blue-800 dark:text-blue-200">Review all details before creating the template. You can return to previous steps to make changes.</p>
                                    </div>
                                </aside>
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                            <button type="button" onClick={() => navigate("/templates")} disabled={disabled} className={secondaryButtonClass}>Cancel</button>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                {currentStep > 1 && (
                                    <button type="button" onClick={goBack} disabled={disabled} className={secondaryButtonClass}><ArrowLeft size={16} /> Back</button>
                                )}

                                {currentStep < 3 ? (
                                    <button type="button" onClick={currentStep === 1 ? continueToFolders : continueToRoles} disabled={disabled || (currentStep === 1 && loadingTypes)} className={primaryButtonClass}>Continue <ArrowRight size={17} /></button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={
                                            disabled ||
                                            loadingTypes ||
                                            !name.trim() ||
                                            !nameDesc.trim() ||
                                            !projectType ||
                                            !folders.length ||
                                            !!validateFolderTree(folders) ||
                                            !roles.length ||
                                            !!roleDraft.trim()
                                        }
                                        className={primaryButtonClass}
                                    >
                                        {saving ? (
                                            <><Loader2 size={17} className="animate-spin" /> Creating Template...</>
                                        ) : (
                                            <><Check size={17} /> {isEditMode ? "Update Template" : "Create Template"}</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
