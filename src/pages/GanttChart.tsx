import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import type { ITask } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import {
    getProjectFolderTimeline,
    type ProjectFolderTimelineItem,
    type ProjectFolderTimelineResponse,
} from "../api/projects";

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
    return Math.min(100, Math.max(0, Number(folder.progress_percentage ?? 0)));
}

function getStatus(folder: ProjectFolderTimelineItem) {
    const value =
        folder.status === null || folder.status === undefined || folder.status === ""
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
    return { value, label: "Status unavailable", type: "pending" };
}

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

    const showTooltip = (event: React.MouseEvent<HTMLDivElement>) => {
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
                        className="fixed z-[99999] w-[320px] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y,
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <h3 className="font-semibold">
                                {data.text ?? "Folder details"}
                            </h3>

                            <button
                                type="button"
                                onClick={() => setTooltip(null)}
                                className="text-lg leading-none text-slate-500 hover:text-primary"
                                aria-label="Close folder details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-2">
                            <DetailRow label="Status" value={data.statusLabel} />
                            <DetailRow label="Assigned user" value={assignedName} />
                            <DetailRow label="Progress" value={data.progressLabel} />
                            <DetailRow label="Start date" value={data.startLabel} />
                            <DetailRow label="End date" value={data.endLabel} />
                            <DetailRow label="Duration" value={data.daysLabel} />
                            <DetailRow label="Remarks" value={data.remarks} />
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
    return (
        <div className="grid grid-cols-[105px_1fr] gap-2">
            <span className="text-slate-500 dark:text-slate-400">
                {label}
            </span>
            <span className="break-words font-medium">
                {value == null || value === "" || value === "—"
                    ? "—"
                    : value}
            </span>
        </div>
    );
}

const taskTypes = [
    { id: "task", label: "Task" },
    { id: "pending", label: "Pending" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "parent-folder", label: "Parent folder" },
];

const columns = [
    { id: "text", header: "Folder / Subfolder", flexgrow: 2, sort: false },
    { id: "daysLabel", header: "Days", width: 65, align: "center" as const, sort: false },
];

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
    color: #111827;
  }

  .dark .bridge-gantt { color: #e2e8f0; }
  .bridge-gantt .wx-gantt,
  .bridge-gantt .wx-grid,
  .bridge-gantt .wx-grid-header,
  .bridge-gantt .wx-timeline,
  .bridge-gantt .wx-timeline-header,
  .bridge-gantt .wx-header,
  .bridge-gantt .wx-cell,
  .bridge-gantt .wx-table {
    background: #ffffff;
    color: #111827;
  }
  .dark .bridge-gantt .wx-gantt,
  .dark .bridge-gantt .wx-grid,
  .dark .bridge-gantt .wx-grid-header,
  .dark .bridge-gantt .wx-timeline,
  .dark .bridge-gantt .wx-timeline-header,
  .dark .bridge-gantt .wx-header,
  .dark .bridge-gantt .wx-cell,
  .dark .bridge-gantt .wx-table {
    background: #0f172a;
    color: #e2e8f0;
    border-color: #334155;
  }
  .dark .bridge-gantt .wx-grid *,
  .dark .bridge-gantt .wx-timeline *,
  .dark .bridge-gantt .wx-gantt * { border-color: #334155; }
  .dark .bridge-gantt .wx-cell,
  .dark .bridge-gantt .wx-header,
  .dark .bridge-gantt .wx-bar-label { color: #e2e8f0; }

  .bridge-gantt .wx-bar.wx-task.pending {
    background-color: #9ca3af !important;
    border-color: #6b7280 !important;
    color: #ffffff !important;
  }
  .bridge-gantt .wx-bar.wx-task.in-progress {
    background-color: #ff7645 !important;
    border-color: #e85a24 !important;
    color: #ffffff !important;
  }
  .bridge-gantt .wx-bar.wx-task.completed {
    background-color: #16a34a !important;
    border-color: #15803d !important;
    color: #ffffff !important;
  }

  .bridge-gantt .wx-chart.wx-mR7v2Xag {
    scrollbar-width: thin;
    }

  .bridge-gantt .wx-task .wx-progress-percent.wx-GKbcLEGA {
    background-color: #16a34a;
    }

  /* Parent folders with children are headings, not scheduled tasks. */
  .bridge-gantt .wx-bar.wx-task.parent-folder {
    display: none !important;
  }
`;

export default function GanttChart() {
    const { projectId: projectIdParam } = useParams();
    const navigate = useNavigate();
    const projectId = Number(projectIdParam);

    const [timeline, setTimeline] = useState<ProjectFolderTimelineResponse | null>(null);
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
            setError("Failed to load project timeline. Please Try Again.");
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
                const response = await getProjectFolderTimeline(projectId);
                if (!cancelled) setTimeline(response);
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to load project timeline:", err);
                    setError("Failed to load project timeline. Please Try Again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void fetchTimeline();
        return () => { cancelled = true; };
    }, [projectId]);

    const chartData = useMemo(() => {
        if (!timeline) return { tasks: [], links: [], unscheduledCount: 0 };

        const folders = timeline.folders ?? [];
        const folderIds = new Set(folders.map((folder) => Number(folder.fid)));
        // A folder is a parent heading only when at least one API folder points to it.
        const parentFolderIds = new Set(
            folders
                .filter((folder) => folder.parent_fid != null)
                .map((folder) => Number(folder.parent_fid)),
        );
        const allDates = [
            parseDate(timeline.project_start_date),
            parseDate(timeline.project_end_date),
            ...folders.flatMap((folder) => [parseDate(folder.startdate), parseDate(folder.enddate)]),
        ].filter((date): date is Date => date !== null);
        const fallbackDate = allDates.length
            ? new Date(Math.min(...allDates.map((date) => date.getTime())))
            : new Date();

        let unscheduledCount = 0;
        const tasks = folders.map((folder) => {
            const startDate = parseDate(folder.startdate);
            const endDate = parseDate(folder.enddate);
            const hasChildren = parentFolderIds.has(Number(folder.fid));
            const hasSchedule = Boolean(startDate && endDate && endDate >= startDate);
            const start = hasSchedule ? startDate! : fallbackDate;
            // SVAR treats end as an exclusive boundary; add one day to include the API end date.
            const end = hasSchedule ? addDays(endDate!, 1) : addDays(start, 1);
            if (!hasSchedule && !hasChildren) unscheduledCount += 1;

            const status = getStatus(folder);
            const person = folder.key_person_options?.find(
                (user) => Number(user.uid) === Number(folder.keypersonid),
            );
            const personName = person
                ? [person.firstname, person.lastname].filter(Boolean).join(" ") || "Unassigned"
                : "Unassigned";
            const folderName = folder.fname || `Folder ${folder.fid}`;

            return {
                id: Number(folder.fid),
                parent: folder.parent_fid != null && folderIds.has(Number(folder.parent_fid))
                    ? Number(folder.parent_fid)
                    : 0,
                open: Boolean(folder.is_parent),
                text: hasChildren || hasSchedule ? folderName : `${folderName} (Unscheduled)`,
                start,
                end,
                progress: hasChildren ? 0 : getProgress(folder),
                type: hasChildren ? "parent-folder" : status.type,
                // Keep the API fields available to the grid and for future edit/save wiring.
                fid: folder.fid,
                parent_fid: folder.parent_fid,
                is_parent: folder.is_parent,
                predecessorsid: folder.predecessorsid,
                days: folder.days,
                progress_percentage: folder.progress_percentage,
                status_value: status.value,
                statusLabel: hasChildren ? "" : status.label,
                startLabel: hasChildren ? "" : formatDate(folder.startdate),
                endLabel: hasChildren ? "" : formatDate(folder.enddate),
                daysLabel: hasChildren ? "" : folder.days == null ? "_" : String(folder.days),
                progressLabel: hasChildren ? "" : `${getProgress(folder)}%`,
                assignee: hasChildren ? "" : personName,
                remarks: hasChildren ? "" : folder.remarks?.trim() || "_",
                progressNotes: hasChildren ? "" : folder.progress_notes?.trim() || "_",
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
            .filter((folder) => folderIds.has(Number(folder.predecessorsid)))
            .map((folder, index) => ({
                id: index + 1,
                source: Number(folder.predecessorsid),
                target: Number(folder.fid),
                type: "e2s" as const,
            }));

        return { tasks, links, unscheduledCount };
    }, [timeline]);

    if (loading) {
        return (
            <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
                <Loader2 size={22} className="animate-spin" />
                Loading project timeline...
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 p-4 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
            <style>{styles}</style>
            <div className="mx-auto max-w-[1800px] space-y-5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                            className="rounded-lg border border-slate-200 bg-white p-2 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900"
                            aria-label="Back to projects"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">Project Gantt Chart</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Project #{timeline?.project_id ?? projectId}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void loadTimeline()}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:brightness-90"
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </header>

                {error && (
                    <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle size={18} />
                        <span className="flex-1">{error}</span>
                        <button type="button" onClick={() => void loadTimeline()} className="font-semibold underline">Retry</button>
                    </div>
                )}

                {timeline && !error && (
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                            <h2 className="font-semibold">Project #{timeline.project_id}</h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {chartData.tasks.length} folders 
                                {chartData.unscheduledCount > 0 && (
                                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                                        Ã‚Â· {chartData.unscheduledCount} unscheduled
                                    </span>
                                )}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-gray-400" />Pending</span>
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-orange-500" />In Progress</span>
                                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-green-600" />Completed</span>
                                <span className="text-slate-500 dark:text-slate-400">Dependencies connect predecessor folders to dependent folders.</span>
                            </div>
                        </div>

                        {chartData.tasks.length === 0 ? (
                            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No folder timeline data is available for this project.
                            </div>
                        ) : (
                            <div className="bridge-gantt h-[650px] w-full overflow-auto scrollbar-hide bg-white dark:bg-slate-900">
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
                    </section>
                )}
            </div>
        </div>
    );
}
