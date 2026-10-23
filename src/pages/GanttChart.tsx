import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import type { ITask } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";

import {
    Activity,
    AlertCircle,
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Folder,
    GitBranch,
    RefreshCw,
    Sparkles,
    UserRound,
} from "lucide-react";

import {
    getProjectFolderTimeline,
    type ProjectFolderTimelineItem,
    type ProjectFolderTimelineResponse,
} from "../api/projects";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(value: string | null | undefined): string {
    const date = parseDate(value);

    return date
        ? date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "Not scheduled";
}

function getProgress(folder: ProjectFolderTimelineItem): number {
    return Math.min(
        100,
        Math.max(0, Number(folder.progress_percentage ?? 0)),
    );
}

function getStatus(folder: ProjectFolderTimelineItem) {
    const value =
        folder.status === null ||
        folder.status === undefined ||
        folder.status === ""
            ? null
            : Number(folder.status);

    if (value === 2) {
        return { value, label: "Completed", type: "completed" };
    }

    if (value === 1) {
        return { value, label: "In Progress", type: "in-progress" };
    }

    if (value === 0) {
        return { value, label: "Pending", type: "pending" };
    }

    return {
        value,
        label: "Status unavailable",
        type: "pending",
    };
}

/* -------------------------------------------------------------------------- */
/* Task tooltip                                                               */
/* -------------------------------------------------------------------------- */

type BridgeTaskData = {
    id?: string | number;
    text?: string;
    type?: string;
    assignee?: string;
    keypersonid?: number | string | null;
    statusLabel?: string;
    startLabel?: string;
    endLabel?: string;
    daysLabel?: string;
    progressLabel?: string;
    remarks?: string;
    progressNotes?: string;
    hasChildren?: boolean;
};

type BridgeTaskTemplateProps = {
    data: ITask & BridgeTaskData;
    api: unknown;
    onAction: (event: {
        action: string;
        data: Record<string, unknown>;
    }) => void;
};

function BridgeTaskTemplate({ data }: BridgeTaskTemplateProps) {
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        if (!tooltip) return;

        const closeTooltip = () => setTooltip(null);

        window.addEventListener("pointerdown", closeTooltip);

        return () => {
            window.removeEventListener("pointerdown", closeTooltip);
        };
    }, [tooltip]);

    const assignedName =
        data.assignee?.trim() && data.assignee !== "Unassigned"
            ? `${data.assignee} (${data.keypersonid ?? "N/A"})`
            : "Unassigned";

    const label =
        data.assignee?.trim() && data.assignee !== "Unassigned"
            ? assignedName
            : data.text ?? "";

    const showTooltip = (
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        event.stopPropagation();

        setTooltip({
            x: Math.max(
                12,
                Math.min(event.clientX, window.innerWidth - 332),
            ),
            y: Math.max(
                12,
                Math.min(event.clientY + 12, window.innerHeight - 310),
            ),
        });
    };

    return (
        <>
            <div
                className="wx-content cursor-pointer"
                onClick={showTooltip}
                title="Click to view folder details"
            >
                {label}
            </div>

            {tooltip &&
                createPortal(
                    <div
                        className="fixed z-[99999] w-[320px] rounded-2xl
                            border border-orange-200 bg-white p-4
                            text-sm text-slate-800 shadow-2xl
                            dark:border-slate-700 dark:bg-slate-900
                            dark:text-slate-100"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y,
                        }}
                        onPointerDown={(event) =>
                            event.stopPropagation()
                        }
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="mb-1 text-[10px] font-semibold
                                    uppercase tracking-[0.18em] text-primary">
                                    Folder details
                                </p>

                                <h3 className="break-words font-semibold text-slate-900 dark:text-white">
                                    {data.text ?? "Folder details"}
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setTooltip(null)}
                                className="rounded-lg px-2 py-1 text-lg
                                    text-slate-500 transition
                                    hover:bg-orange-50 hover:text-primary
                                    dark:text-slate-400
                                    dark:hover:bg-slate-800"
                                aria-label="Close folder details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-3">
                            <DetailRow
                                label="Status"
                                value={data.statusLabel}
                            />
                            <DetailRow
                                label="Assigned user"
                                value={assignedName}
                            />
                            <DetailRow
                                label="Progress"
                                value={data.progressLabel}
                            />
                            <DetailRow
                                label="Start date"
                                value={data.startLabel}
                            />
                            <DetailRow
                                label="End date"
                                value={data.endLabel}
                            />
                            <DetailRow
                                label="Duration"
                                value={data.daysLabel}
                            />
                            <DetailRow
                                label="Remarks"
                                value={data.remarks}
                            />
                            <DetailRow
                                label="Progress notes"
                                value={data.progressNotes}
                            />
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    const displayValue =
        value == null ||
        value === "" ||
        value === "—" ||
        value === "_"
            ? "—"
            : value;

    return (
        <div className="grid grid-cols-[105px_1fr] gap-3">
            <span className="text-slate-500 dark:text-slate-400">
                {label}
            </span>

            <span className="break-words font-medium text-slate-800 dark:text-slate-200">
                {displayValue}
            </span>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Gantt configuration                                                        */
/* -------------------------------------------------------------------------- */

const taskTypes = [
    { id: "task", label: "Task" },
    { id: "pending", label: "Pending" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "parent-folder", label: "Parent folder" },
];

const columns = [
    {
        id: "text",
        header: "Folder / Subfolder",
        flexgrow: 2,
        sort: false,
    },
    {
        id: "daysLabel",
        header: "Days",
        width: 65,
        align: "center" as const,
        sort: false,
    },
];

/* -------------------------------------------------------------------------- */
/* Gantt theme: light by default, dark only inside .dark                      */
/* -------------------------------------------------------------------------- */

const styles = `
    .bridge-gantt {
        --bridge-primary: var(--color-primary, #ff6b35);
        --bridge-primary-light: var(--color-primary-light, #f8aa91);
        --wx-gantt-task-color: var(--bridge-primary);
        --wx-gantt-task-fill-color: var(--bridge-primary);
        --wx-gantt-task-border-color: var(--bridge-primary);
        --wx-gantt-task-font-color: #ffffff;
        --wx-gantt-link-color: var(--bridge-primary);
        --wx-gantt-link-marker-color: var(--bridge-primary);
        --wx-gantt-link-marker-background: #ffffff;

        background: #ffffff;
        color: #334155;
        border-radius: 12px;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        color-scheme: light;
    }

    /* LIGHT MODE */
    .bridge-gantt .wx-gantt,
    .bridge-gantt .wx-grid,
    .bridge-gantt .wx-grid-header,
    .bridge-gantt .wx-timeline,
    .bridge-gantt .wx-timeline-header,
    .bridge-gantt .wx-header,
    .bridge-gantt .wx-cell,
    .bridge-gantt .wx-table {
        background-color: #ffffff;
        color: #334155;
        border-color: #e2e8f0;
    }

    .bridge-gantt .wx-grid-header,
    .bridge-gantt .wx-timeline-header,
    .bridge-gantt .wx-header {
        background-color: #fff7f2;
        color: #334155;
        font-weight: 600;
    }

    .bridge-gantt .wx-cell {
        border-color: #f1f5f9;
        transition: background-color 150ms ease;
    }

    .bridge-gantt .wx-cell:hover {
        background-color: #fff4ed;
    }

    .bridge-gantt .wx-grid *,
    .bridge-gantt .wx-timeline *,
    .bridge-gantt .wx-gantt * {
        border-color: #e2e8f0;
        color:#000;
    }

    /* Task bars */
    .bridge-gantt .wx-bar.wx-task {
        border-radius: 6px;
        border-width: 1px;
        box-shadow: 0 3px 10px #ff6b3520;
        transition: filter 150ms ease, box-shadow 150ms ease;
    }

    .bridge-gantt .wx-bar.wx-task:hover {
        filter: brightness(1.06);
        box-shadow: 0 0 14px #ff6b3530;
    }

    .bridge-gantt .wx-bar.wx-task.pending {
        background: #94a3b8 !important;
        border-color: #64748b !important;
        color: #ffffff !important;
    }

    .bridge-gantt .wx-bar.wx-task.in-progress {
        background: linear-gradient(100deg, #ea580c, #ff8a50) !important;
        border-color: #ff6b35 !important;
        color: #ffffff !important;
    }

    .bridge-gantt .wx-bar.wx-task.completed {
        background: #16a34a !important;
        border-color: #15803d !important;
        color: #ffffff !important;
    }

    .bridge-gantt .wx-bar.wx-task.parent-folder {
        background: #ff6b35 !important;
        border-color: #e85a24 !important;
        color: #ffffff !important;
    }

    .bridge-gantt .wx-bar-label,
    .bridge-gantt .wx-content {
        color: #ffffff;
        font-weight: 500;
    }

    .bridge-gantt .wx-chart {
        scrollbar-width: thin;
        scrollbar-color: #ffb08f #fff7f2;
    }

    .bridge-gantt .wx-chart::-webkit-scrollbar {
        width: 7px;
        height: 7px;
    }

    .bridge-gantt .wx-chart::-webkit-scrollbar-thumb {
        background: #ffb08f;
        border-radius: 10px;
    }

    .bridge-gantt .wx-chart::-webkit-scrollbar-thumb:hover {
        background: #ff6b35;
    }

    .bridge-gantt .wx-task .wx-progress-percent {
        background: #ffffff40;
        border-radius: 5px;
    }

    /* DARK MODE OVERRIDES */
    .dark .bridge-gantt {
        background: #0b1325;
        color: #e2e8f0;
        color-scheme: dark;
        --wx-gantt-link-marker-background: #101a2d;
    }

    .dark .bridge-gantt .wx-gantt,
    .dark .bridge-gantt .wx-grid,
    .dark .bridge-gantt .wx-grid-header,
    .dark .bridge-gantt .wx-timeline,
    .dark .bridge-gantt .wx-timeline-header,
    .dark .bridge-gantt .wx-header,
    .dark .bridge-gantt .wx-cell,
    .dark .bridge-gantt .wx-table {
        background-color: #0f172a;
        color: #e2e8f0;
        border-color: #334155;
    }

    .dark .bridge-gantt .wx-grid-header,
    .dark .bridge-gantt .wx-timeline-header,
    .dark .bridge-gantt .wx-header {
        background-color: #111c30;
        color: #e2e8f0;
    }

    .dark .bridge-gantt .wx-cell {
        border-color: #253249;
    }

    .dark .bridge-gantt .wx-cell:hover {
        background-color: #17243a;
    }

    .dark .bridge-gantt .wx-grid *,
    .dark .bridge-gantt .wx-timeline *,
    .dark .bridge-gantt .wx-gantt * {
        border-color: #334155;
    }

    .dark .bridge-gantt .wx-bar.wx-task.pending {
        background: linear-gradient(100deg, #475569, #64748b) !important;
        border-color: #64748b !important;
        color: #ffffff !important;
    }

    .dark .bridge-gantt .wx-bar.wx-task.in-progress {
        background: linear-gradient(100deg, #ea580c, #fb923c) !important;
        border-color: #fdba74 !important;
        color: #ffffff !important;
    }

    .dark .bridge-gantt .wx-bar.wx-task.completed {
        background: linear-gradient(100deg, #047857, #10b981) !important;
        border-color: #34d399 !important;
        color: #ffffff !important;
    }

    .dark .bridge-gantt .wx-bar.wx-task.parent-folder {
        background: linear-gradient(100deg, #c2410c, #ff6b35) !important;
        border-color: #fb923c !important;
        color: #ffffff !important;
    }

    .dark .bridge-gantt .wx-chart {
        scrollbar-color: #475569 #0b1426;
    }

    .dark .bridge-gantt .wx-chart::-webkit-scrollbar-thumb {
        background: #475569;
    }

    .dark .bridge-gantt .wx-chart::-webkit-scrollbar-thumb:hover {
        background: #ff6b35;
    }

    /* Parent folders remain expandable headings */
    .bridge-gantt .wx-bar.wx-task.parent-folder {
        display: none !important;
    }
`;

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function GanttChart() {
    const { projectId: projectIdParam } = useParams();
    const navigate = useNavigate();
    const projectId = Number(projectIdParam);

    const [timeline, setTimeline] =
        useState<ProjectFolderTimelineResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTimeline = useCallback(async () => {
        if (!projectId || !Number.isFinite(projectId)) {
            setError("Project ID is missing or invalid.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await getProjectFolderTimeline(projectId);
            setTimeline(response);
        } catch (err) {
            console.error("Failed to load project timeline:", err);
            setError(
                "Failed to load project timeline. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        let cancelled = false;

        async function fetchTimeline() {
            if (!projectId || !Number.isFinite(projectId)) {
                setError("Project ID is missing or invalid.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response =
                    await getProjectFolderTimeline(projectId);

                if (!cancelled) {
                    setTimeline(response);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error(
                        "Failed to load project timeline:",
                        err,
                    );

                    setError(
                        "Failed to load project timeline. Please try again.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void fetchTimeline();

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    const chartData = useMemo(() => {
        if (!timeline) {
            return {
                tasks: [],
                links: [],
                unscheduledCount: 0,
                pendingCount: 0,
                inProgressCount: 0,
                completedCount: 0,
            };
        }

        const folders = timeline.folders ?? [];

        const folderIds = new Set(
            folders.map((folder) => Number(folder.fid)),
        );

        const parentFolderIds = new Set(
            folders
                .filter((folder) => folder.parent_fid != null)
                .map((folder) => Number(folder.parent_fid)),
        );

        const allDates = [
            parseDate(timeline.project_start_date),
            parseDate(timeline.project_end_date),
            ...folders.flatMap((folder) => [
                parseDate(folder.startdate),
                parseDate(folder.enddate),
            ]),
        ].filter((date): date is Date => date !== null);

        const fallbackDate = allDates.length
            ? new Date(
                  Math.min(
                      ...allDates.map((date) => date.getTime()),
                  ),
              )
            : new Date();

        let unscheduledCount = 0;
        let pendingCount = 0;
        let inProgressCount = 0;
        let completedCount = 0;

        const tasks = folders.map((folder) => {
            const startDate = parseDate(folder.startdate);
            const endDate = parseDate(folder.enddate);

            const hasChildren = parentFolderIds.has(
                Number(folder.fid),
            );

            const hasSchedule = Boolean(
                startDate &&
                    endDate &&
                    endDate >= startDate,
            );

            const start = hasSchedule ? startDate! : fallbackDate;

            const end = hasSchedule
                ? addDays(endDate!, 1)
                : addDays(start, 1);

            const status = getStatus(folder);

            if (!hasSchedule && !hasChildren) {
                unscheduledCount += 1;
            }

            if (!hasChildren) {
                if (status.value === 0) pendingCount += 1;
                if (status.value === 1) inProgressCount += 1;
                if (status.value === 2) completedCount += 1;
            }

            const person = folder.key_person_options?.find(
                (user) =>
                    Number(user.uid) === Number(folder.keypersonid),
            );

            const personName = person
                ? [
                      person.firstname,
                      person.lastname,
                  ]
                      .filter(Boolean)
                      .join(" ") || "Unassigned"
                : "Unassigned";

            const folderName =
                folder.fname || `Folder ${folder.fid}`;

            return {
                id: Number(folder.fid),

                parent:
                    folder.parent_fid != null &&
                    folderIds.has(Number(folder.parent_fid))
                        ? Number(folder.parent_fid)
                        : 0,

                open: Boolean(folder.is_parent),

                text:
                    hasChildren || hasSchedule
                        ? folderName
                        : `${folderName} (Unscheduled)`,

                start,
                end,

                progress: hasChildren ? 0 : getProgress(folder),

                type: hasChildren ? "parent-folder" : status.type,

                fid: folder.fid,
                parent_fid: folder.parent_fid,
                is_parent: folder.is_parent,
                predecessorsid: folder.predecessorsid,
                days: folder.days,
                progress_percentage: folder.progress_percentage,
                status_value: status.value,

                statusLabel: hasChildren ? "" : status.label,

                startLabel: hasChildren
                    ? ""
                    : formatDate(folder.startdate),

                endLabel: hasChildren
                    ? ""
                    : formatDate(folder.enddate),

                daysLabel: hasChildren
                    ? ""
                    : folder.days == null
                      ? "—"
                      : String(folder.days),

                progressLabel: hasChildren
                    ? ""
                    : `${getProgress(folder)}%`,

                assignee: hasChildren ? "" : personName,

                remarks: hasChildren
                    ? ""
                    : folder.remarks?.trim() || "—",

                progressNotes: hasChildren
                    ? ""
                    : folder.progress_notes?.trim() || "—",

                keypersonid: folder.keypersonid,
                key_person_options: folder.key_person_options,
                remarks_raw: folder.remarks,
                progress_notes_raw: folder.progress_notes,

                scheduled: hasSchedule && !hasChildren,
                hasChildren,
            };
        });

        const links = folders
            .filter((folder) => folder.predecessorsid != null)
            .filter((folder) =>
                folderIds.has(Number(folder.predecessorsid)),
            )
            .map((folder, index) => ({
                id: index + 1,
                source: Number(folder.predecessorsid),
                target: Number(folder.fid),
                type: "e2s" as const,
            }));

        return {
            tasks,
            links,
            unscheduledCount,
            pendingCount,
            inProgressCount,
            completedCount,
        };
    }, [timeline]);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center gap-3
                bg-slate-50 text-slate-500
                dark:bg-slate-950 dark:text-slate-400">
                <RefreshCw
                    size={21}
                    className="animate-spin text-primary"
                />
                <span className="text-sm">
                    Loading project timeline...
                </span>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-800
            dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
            <style>{styles}</style>

            <div className="mx-auto max-w-[1900px] space-y-7">
                {/* Header */}
                <header className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                            className="mb-5 inline-flex items-center gap-2
                                rounded-lg border border-slate-200
                                bg-white px-3 py-2 text-sm text-slate-600
                                shadow-sm transition hover:border-primary
                                hover:text-primary
                                dark:border-slate-700 dark:bg-slate-900
                                dark:text-slate-300"
                        >
                            <ArrowLeft size={16} />
                            Back to Projects
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-orange-200
                                bg-orange-50 p-3 text-primary
                                dark:border-orange-400/20
                                dark:bg-orange-500/10">
                                <GitBranch size={25} />
                            </div>

                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <Sparkles
                                        size={13}
                                        className="text-primary"
                                    />

                                    <span className="text-[10px] font-bold
                                        uppercase tracking-[0.2em] text-primary">
                                        Project workspace
                                    </span>
                                </div>

                                <h1 className="text-2xl font-bold tracking-tight
                                    text-slate-900 dark:text-white sm:text-3xl">
                                    Gantt Chart
                                </h1>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Project #{timeline?.project_id ?? projectId}
                                    <span className="mx-2 text-slate-300 dark:text-slate-600">
                                        /
                                    </span>
                                    Timeline &amp; dependencies
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadTimeline()}
                        className="inline-flex items-center gap-2 rounded-xl
                            bg-primary px-5 py-3 text-sm font-semibold
                            text-white shadow-lg shadow-orange-500/15
                            transition hover:-translate-y-0.5
                            hover:brightness-110"
                    >
                        <RefreshCw size={16} />
                        Refresh timeline
                    </button>
                </header>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-center gap-3 rounded-xl
                            border border-red-200 bg-red-50 p-4
                            text-sm text-red-700
                            dark:border-red-500/20 dark:bg-red-500/10
                            dark:text-red-300"
                    >
                        <AlertCircle size={19} />

                        <span className="flex-1">{error}</span>

                        <button
                            type="button"
                            onClick={() => void loadTimeline()}
                            className="font-semibold underline underline-offset-4"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {timeline && !error && (
                    <>
                        {/* Project metadata */}
                        <section className="flex flex-wrap items-center gap-x-8
                            gap-y-4 rounded-2xl border border-slate-200
                            bg-white p-5 shadow-sm
                            dark:border-slate-800 dark:bg-slate-900">
                            <MetadataItem
                                icon={<CalendarClock size={20} />}
                                label="Project start"
                                value={formatDate(timeline.project_start_date)}
                            />

                            <div className="hidden h-9 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

                            <MetadataItem
                                icon={<CalendarClock size={20} />}
                                label="Project end"
                                value={formatDate(timeline.project_end_date)}
                            />

                            <div className="hidden h-9 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

                            <MetadataItem
                                icon={<Folder size={20} />}
                                label="Total folders"
                                value={chartData.tasks.length}
                                iconColor="orange"
                            />

                            <div className="ml-auto hidden items-center gap-2
                                rounded-full border border-emerald-200
                                bg-emerald-50 px-3 py-2 text-xs
                                text-emerald-700 md:flex
                                dark:border-emerald-500/20
                                dark:bg-emerald-500/10 dark:text-emerald-300">
                                <span className="h-2 w-2 animate-pulse
                                    rounded-full bg-emerald-500" />
                                Timeline loaded
                            </div>
                        </section>

                        {/* Summary cards */}
                        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                            <SummaryCard
                                label="Total folders"
                                value={chartData.tasks.length}
                                description="Project structure"
                                icon={<Folder size={20} />}
                                color="blue"
                            />

                            <SummaryCard
                                label="Pending"
                                value={chartData.pendingCount}
                                description="Awaiting progress"
                                icon={<Clock3 size={20} />}
                                color="amber"
                            />

                            <SummaryCard
                                label="In progress"
                                value={chartData.inProgressCount}
                                description="Currently active"
                                icon={<Activity size={20} />}
                                color="orange"
                            />

                            <SummaryCard
                                label="Completed"
                                value={chartData.completedCount}
                                description="Finished folders"
                                icon={<CheckCircle2 size={20} />}
                                color="emerald"
                            />

                            <SummaryCard
                                label="Unscheduled"
                                value={chartData.unscheduledCount}
                                description="Dates not configured"
                                icon={<CalendarClock size={20} />}
                                color="violet"
                            />
                        </section>

                        {/* Gantt chart */}
                        <section className="overflow-hidden rounded-2xl
                            border border-slate-200 bg-white shadow-sm
                            dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex flex-wrap items-center
                                justify-between gap-4 border-b
                                border-slate-200 px-5 py-5
                                dark:border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-semibold
                                            text-slate-900 dark:text-slate-100">
                                            Timeline overview
                                        </h2>

                                        <span className="rounded-md
                                            border border-orange-200
                                            bg-orange-50 px-2 py-0.5
                                            text-[10px] font-medium
                                            text-primary
                                            dark:border-orange-500/20
                                            dark:bg-orange-500/10">
                                            LIVE DATA
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Folder schedules, progress and dependencies
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <StatusLegend
                                        color="bg-slate-400"
                                        label="Pending"
                                    />
                                    <StatusLegend
                                        color="bg-primary"
                                        label="In Progress"
                                    />
                                    <StatusLegend
                                        color="bg-emerald-500"
                                        label="Completed"
                                    />
                                </div>
                            </div>

                            {chartData.tasks.length === 0 ? (
                                <div className="flex min-h-72 flex-col
                                    items-center justify-center px-6 text-center">
                                    <div className="mb-4 rounded-2xl
                                        border border-orange-100
                                        bg-orange-50 p-4 text-primary
                                        dark:border-slate-700
                                        dark:bg-slate-800 dark:text-slate-300">
                                        <Folder size={28} />
                                    </div>

                                    <h3 className="font-semibold
                                        text-slate-800 dark:text-slate-200">
                                        No folders yet
                                    </h3>

                                    <p className="mt-2 max-w-sm text-sm
                                        text-slate-500 dark:text-slate-400">
                                        Folder timeline data is not available
                                        for this project.
                                    </p>
                                </div>
                            ) : (
                                <div className="bridge-gantt h-full
                                    w-full overflow-auto">
                                    <Willow>
                                        <Gantt
                                            tasks={chartData.tasks}
                                            links={chartData.links}
                                            taskTypes={taskTypes}
                                            columns={columns}
                                            taskTemplate={BridgeTaskTemplate}
                                        />
                                    </Willow>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center
                                justify-between gap-3 border-t
                                border-slate-200 bg-slate-50 px-5 py-3
                                dark:border-slate-800 dark:bg-slate-950">
                                <div className="flex items-center gap-2
                                    text-xs text-slate-500 dark:text-slate-400">
                                    <GitBranch size={14} />
                                    Dependencies connect predecessor folders
                                    to dependent folders.
                                </div>

                                <div className="flex items-center gap-2
                                    text-xs text-slate-500 dark:text-slate-400">
                                    <UserRound size={14} />
                                    Click a task to inspect its details.
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="flex flex-wrap items-center
                            justify-between gap-3 border-t
                            border-slate-200 pt-5 text-xs text-slate-500
                            dark:border-slate-800 dark:text-slate-400">
                            <span>
                                BRIDGE
                                <span className="mx-2 text-slate-300 dark:text-slate-700">
                                    ·
                                </span>
                                Build. Plan. Ship.
                            </span>

                            <span className="font-medium text-primary">
                                Great things take time. ✦
                            </span>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Metadata item                                                              */
/* -------------------------------------------------------------------------- */

function MetadataItem({
    icon,
    label,
    value,
    iconColor = "slate",
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    iconColor?: "slate" | "orange";
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={`rounded-xl p-2.5 ${
                    iconColor === "orange"
                        ? "bg-orange-50 text-primary dark:bg-orange-500/10"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
            >
                {icon}
            </div>

            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {label}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {value}
                </p>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Summary cards                                                              */
/* -------------------------------------------------------------------------- */

function SummaryCard({
    label,
    value,
    description,
    icon,
    color,
}: {
    label: string;
    value: number;
    description: string;
    icon: React.ReactNode;
    color: "blue" | "amber" | "orange" | "emerald" | "violet";
}) {
    const colorStyles = {
        blue: {
            border: "border-blue-200 dark:border-blue-500/20",
            background: "from-blue-50 dark:from-blue-500/[0.08]",
            icon: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
            number: "text-blue-700 dark:text-blue-300",
        },
        amber: {
            border: "border-amber-200 dark:border-amber-500/20",
            background: "from-amber-50 dark:from-amber-500/[0.08]",
            icon: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
            number: "text-amber-700 dark:text-amber-300",
        },
        orange: {
            border: "border-orange-200 dark:border-orange-500/20",
            background: "from-orange-50 dark:from-orange-500/[0.08]",
            icon: "bg-orange-50 text-primary dark:bg-orange-500/10 dark:text-orange-400",
            number: "text-orange-700 dark:text-orange-300",
        },
        emerald: {
            border: "border-emerald-200 dark:border-emerald-500/20",
            background: "from-emerald-50 dark:from-emerald-500/[0.08]",
            icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
            number: "text-emerald-700 dark:text-emerald-300",
        },
        violet: {
            border: "border-violet-200 dark:border-violet-500/20",
            background: "from-violet-50 dark:from-violet-500/[0.08]",
            icon: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
            number: "text-violet-700 dark:text-violet-300",
        },
    }[color];

    return (
        <div
            className={`rounded-2xl border ${colorStyles.border}
                bg-gradient-to-br ${colorStyles.background}
                to-white p-4 shadow-sm transition duration-200
                hover:-translate-y-0.5 hover:shadow-md sm:p-5
                dark:to-slate-900`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
                    {label}
                </span>

                <div className={`rounded-xl p-2 ${colorStyles.icon}`}>
                    {icon}
                </div>
            </div>

            <p className={`mt-4 text-3xl font-bold tracking-tight ${colorStyles.number}`}>
                {value}
            </p>

            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500 sm:text-xs">
                {description}
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Status legend                                                              */
/* -------------------------------------------------------------------------- */

function StatusLegend({
    color,
    label,
}: {
    color: string;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
        </span>
    );
}