
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCw,
    Loader2,
    AlertCircle,
    X,
} from "lucide-react";

import {
    getProjectFolderTimeline,
    type ProjectFolderTimelineResponse,
    type ProjectFolderTimelineItem,
} from "../api/projects";

function parseDate(value: string | null): Date | null {
    if (!value) return null;

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string | null): string {
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

type TaskStatus = {
    value: number | null;
    label: string;
    barClass: string;
    fillClass: string;
    badgeClass: string;
};

function getTaskStatus(folder: ProjectFolderTimelineItem): TaskStatus {
    const rawStatus = folder.status;
    const value =
        rawStatus === null || rawStatus === undefined || rawStatus === ""
            ? null
            : Number(rawStatus);

    if (value === 2) {
        return {
            value,
            label: "Completed",
            barClass: "bg-green-100 dark:bg-green-950/60",
            fillClass: "bg-green-600",
            badgeClass:
                "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
        };
    }

    if (value === 1) {
        return {
            value,
            label: "In progress",
            barClass: "bg-blue-100 dark:bg-blue-950/60",
            fillClass: "bg-blue-600",
            badgeClass:
                "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
        };
    }

    if (value === 0) {
        return {
            value,
            label: "Pending",
            barClass: "bg-slate-200 dark:bg-slate-700",
            fillClass: "bg-slate-500",
            badgeClass:
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        };
    }

    return {
        value,
        label: "Status unavailable",
        barClass: "bg-slate-200 dark:bg-slate-700",
        fillClass: "bg-primary",
        badgeClass:
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
}

interface DependencyLine {
    fid: number;
    path: string;
}

interface DependencyLayout {
    width: number;
    height: number;
    lines: DependencyLine[];
}

export default function GanttChart() {
    const { projectId: projectIdParam } = useParams();
    const navigate = useNavigate();
    const projectId = Number(projectIdParam);

    const [timeline, setTimeline] =
        useState<ProjectFolderTimelineResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedProgressFolderId, setSelectedProgressFolderId] =
        useState<number | null>(null);

    const [popupPosition, setPopupPosition] = useState<{
        top: number;
        left: number;
        placement: "above" | "below";
    } | null>(null);

    const chartRef = useRef<HTMLDivElement | null>(null);
    const barRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    const [dependencyLayout, setDependencyLayout] =
        useState<DependencyLayout>({
            width: 0,
            height: 0,
            lines: [],
        });

    const loadTimeline = useCallback(async () => {
        if (!projectId) {
            setError("Project ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await getProjectFolderTimeline(projectId);
            setTimeline(response);
            setSelectedProgressFolderId(null);
            setPopupPosition(null);
        } catch (err) {
            console.error("Failed to load project timeline:", err);
            setError("Failed to load project timeline. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        let cancelled = false;

        async function fetchTimeline() {
            if (!projectId) {
                setError("Project ID is missing.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await getProjectFolderTimeline(projectId);

                if (!cancelled) {
                    setTimeline(response);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to load project timeline:", err);
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

    const rows = useMemo(() => {
        if (!timeline) return [];

        const folders = timeline.folders ?? [];
        const folderMap = new Map(
            folders.map((folder) => [folder.fid, folder]),
        );

        function getDepth(folder: ProjectFolderTimelineItem) {
            let depth = 0;
            let parentId = folder.parent_fid;
            const visited = new Set<number>([folder.fid]);

            while (parentId != null && folderMap.has(parentId)) {
                if (visited.has(parentId)) break;

                visited.add(parentId);
                depth += 1;
                parentId = folderMap.get(parentId)?.parent_fid ?? null;
            }

            return depth;
        }

        return folders.map((folder) => ({
            ...folder,
            depth: getDepth(folder),
        }));
    }, [timeline]);

    const dateRange = useMemo(() => {
        if (!timeline) return null;

        const dates = [
            parseDate(timeline.project_start_date),
            parseDate(timeline.project_end_date),
            ...(timeline.folders ?? []).flatMap((folder) => [
                parseDate(folder.startdate),
                parseDate(folder.enddate),
            ]),
        ].filter((date): date is Date => date !== null);

        if (dates.length === 0) return null;

        const start = new Date(
            Math.min(...dates.map((date) => date.getTime())),
        );

        const lastDate = new Date(
            Math.max(...dates.map((date) => date.getTime())),
        );

        // Exclusive end boundary gives the final scheduled day a full width.
        const end = new Date(lastDate);
        end.setDate(end.getDate() + 1);

        return { start, end };
    }, [timeline]);

    const totalDays = dateRange
        ? Math.max(
              1,
              Math.round(
                  (dateRange.end.getTime() - dateRange.start.getTime()) /
                      86400000,
              ),
          )
        : 0;

    function getBar(folder: ProjectFolderTimelineItem) {
        if (!dateRange || totalDays <= 0) return null;

        const start = parseDate(folder.startdate);
        const end = parseDate(folder.enddate);

        if (!start || !end || end < start) return null;

        const dayMs = 86400000;
        const timelineStart = dateRange.start.getTime();

        const left =
            ((start.getTime() - timelineStart) / dayMs / totalDays) * 100;

        const width =
            (((end.getTime() - start.getTime()) / dayMs + 1) /
                totalDays) *
            100;

        const safeLeft = Math.max(0, Math.min(100, left));
        const safeWidth = Math.max(0, Math.min(width, 100 - safeLeft));

        return {
            left: safeLeft,
            width: safeWidth,
        };
    }

    useLayoutEffect(() => {
        const chart = chartRef.current;

        if (!chart || rows.length === 0) {
            setDependencyLayout({ width: 0, height: 0, lines: [] });
            return;
        }

        const calculateConnections = () => {
            const chartRect = chart.getBoundingClientRect();
            const width = chart.scrollWidth;
            const height = chart.scrollHeight;
            const lines: DependencyLine[] = [];

            rows.forEach((folder) => {
                if (folder.predecessorsid == null) return;

                const predecessorId = Number(folder.predecessorsid);

                if (!Number.isFinite(predecessorId)) return;

                const predecessorBar = barRefs.current.get(predecessorId);
                const dependentBar = barRefs.current.get(folder.fid);

                // A connector can only be drawn when both tasks have scheduled bars.
                if (!predecessorBar || !dependentBar) return;

                const predecessorRect = predecessorBar.getBoundingClientRect();
                const dependentRect = dependentBar.getBoundingClientRect();

                // Start at the predecessor's right edge and end at the dependent's left edge.
                const x1 = predecessorRect.right - chartRect.left;
                const y1 =
                    predecessorRect.top +
                    predecessorRect.height / 2 -
                    chartRect.top;

                const x2 = dependentRect.left - chartRect.left;
                const y2 =
                    dependentRect.top +
                    dependentRect.height / 2 -
                    chartRect.top;

                // Use a right-angle route for a clear, readable dependency connection.
                const middleX = x1 + (x2 - x1) / 2;
                const path = [
                    `M ${x1} ${y1}`,
                    `H ${middleX}`,
                    `V ${y2}`,
                    `H ${x2}`,
                ].join(" ");

                lines.push({ fid: folder.fid, path });
            });

            setDependencyLayout({ width, height, lines });
        };

        calculateConnections();

        const observer = new ResizeObserver(calculateConnections);
        observer.observe(chart);
        window.addEventListener("resize", calculateConnections);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", calculateConnections);
        };
    }, [rows, dateRange, loading]);

    const selectedProgressFolder = rows.find(
        (folder) => folder.fid === selectedProgressFolderId,
    );

    const openProgressPopup = (
        event: ReactMouseEvent<HTMLButtonElement>,
        folder: ProjectFolderTimelineItem,
    ) => {
        if (folder.is_parent) return;

        if (selectedProgressFolderId === folder.fid) {
            setSelectedProgressFolderId(null);
            setPopupPosition(null);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const popupWidth = Math.min(320, window.innerWidth - 16);
        const popupHeight = 260;

        const left = Math.max(
            8,
            Math.min(
                rect.left,
                window.innerWidth - popupWidth - 8,
            ),
        );

        const hasRoomAbove = rect.top >= popupHeight + 16;

        setPopupPosition({
            top: hasRoomAbove ? rect.top - 8 : rect.bottom + 8,
            left,
            placement: hasRoomAbove ? "above" : "below",
        });

        setSelectedProgressFolderId(folder.fid);
    };

    useEffect(() => {
        if (selectedProgressFolderId === null) return;

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedProgressFolderId(null);
                setPopupPosition(null);
            }
        };

        const closeOnScroll = () => {
            setSelectedProgressFolderId(null);
            setPopupPosition(null);
        };

        window.addEventListener("keydown", closeOnEscape);
        window.addEventListener("scroll", closeOnScroll, true);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
            window.removeEventListener("scroll", closeOnScroll, true);
        };
    }, [selectedProgressFolderId]);

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
            <div className="mx-auto max-w-[1600px] space-y-5">
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
                            <h1 className="text-xl font-bold">
                                Project Gantt Chart
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Project #{projectId}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadTimeline()}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:brightness-90"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                    >
                        <AlertCircle size={18} />
                        <span className="flex-1">{error}</span>
                        <button
                            type="button"
                            onClick={() => void loadTimeline()}
                            className="font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {timeline && !error && (
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                            <h2 className="font-semibold">Folder Timeline</h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {rows.length} folders Â· Project #
                                {timeline.project_id}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-sm bg-slate-500" />
                                    Pending
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-sm bg-blue-600" />
                                    In progress
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-sm bg-green-600" />
                                    Completed
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <svg width="34" height="12" viewBox="0 0 34 12" aria-hidden="true">
                                        <path d="M1 6 H27" stroke="#ff6b35" strokeWidth="2" />
                                        <path d="M24 2 L31 6 L24 10 Z" fill="#ff6b35" />
                                    </svg>
                                    Predecessor dependency
                                </span>
                            </div>

                            {!dateRange && (
                                <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm text-slate-600 dark:text-slate-300">
                                    No schedule dates are available yet. Save
                                    the project start date and schedule the
                                    folders to display their timeline bars.
                                </p>
                            )}
                        </div>

                        {rows.length === 0 ? (
                            <div className="p-12 text-center text-sm text-slate-500">
                                No folders available for this project.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <div ref={chartRef} className="relative min-w-[900px]">
                                    <div className="grid grid-cols-[280px_minmax(600px,1fr)] border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                                        <div className="p-4 text-xs font-semibold uppercase">
                                            Folder / Assignee
                                        </div>

                                        <div className="p-4 text-xs text-slate-500">
                                            {dateRange
                                                ? `${formatDate(
                                                      dateRange.start
                                                          .toISOString(),
                                                  )} â€“ ${formatDate(
                                                      new Date(
                                                          dateRange.end.getTime() -
                                                              86400000,
                                                      ).toISOString(),
                                                  )}`
                                                : "Calendar dates unavailable"}
                                        </div>
                                    </div>

                                    {rows.map((folder) => {
                                        const bar = getBar(folder);

                                        const person =
                                            folder.key_person_options?.find(
                                                (user) =>
                                                    user.uid ===
                                                    folder.keypersonid,
                                            );

                                        const personName = person
                                            ? [
                                                  person.firstname,
                                                  person.lastname,
                                              ]
                                                  .filter(Boolean)
                                                  .join(" ")
                                            : "Unassigned";

                                        const progress = getProgress(folder);

                                        return (
                                            <div
                                                key={folder.fid}
                                                className="grid grid-cols-[280px_minmax(600px,1fr)] border-b border-slate-100 last:border-0 dark:border-slate-800"
                                            >
                                                <div className="min-w-0 p-3">
                                                    <div
                                                        className="min-w-0"
                                                        style={{
                                                            paddingLeft: `${folder.depth * 20}px`,
                                                        }}
                                                    >
                                                        <p className="break-words text-sm font-medium">
                                                            {folder.fname}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {folder.is_parent
                                                                ? "Parent folder"
                                                                : personName}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatDate(
                                                                folder.startdate,
                                                            )}{" "}
                                                            â€“{" "}
                                                            {formatDate(
                                                                folder.enddate,
                                                            )}
                                                        </p>

                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTaskStatus(folder).badgeClass}`}
                                                            >
                                                                {getTaskStatus(folder).label}
                                                            </span>
                                                            {!folder.is_parent && (
                                                                <span className="text-xs text-slate-500">
                                                                    Progress: {progress}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex min-h-[88px] items-center px-3">
                                                    {dateRange ? (
                                                        <div className="relative h-9 w-full rounded bg-slate-50 dark:bg-slate-950">
                                                            {bar ? (
                                                                <button
                                                                    ref={(element) => {
                                                                        if (element) {
                                                                            barRefs.current.set(folder.fid, element);
                                                                        } else {
                                                                            barRefs.current.delete(folder.fid);
                                                                        }
                                                                    }}
                                                                    type="button"
                                                                    title={
                                                                        folder.is_parent
                                                                            ? folder.fname
                                                                            : `View progress notes for ${folder.fname}`
                                                                    }
                                                                    onClick={(
                                                                        event,
                                                                    ) =>
                                                                        openProgressPopup(
                                                                            event,
                                                                            folder,
                                                                        )
                                                                    }
                                                                    className={`absolute top-1 z-20 h-7 cursor-pointer overflow-hidden rounded-md border-0 p-0 text-left focus:outline-none focus:ring-2 focus:ring-primary ${getTaskStatus(folder).barClass} ${
                                                                        folder.is_parent ? "cursor-default" : ""
                                                                    }`}
                                                                    style={{
                                                                        left: `${bar.left}%`,
                                                                        width: `${bar.width}%`,
                                                                        minWidth:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    {!folder.is_parent && (
                                                                        <>
                                                                            <div
                                                                                className={`absolute inset-y-0 left-0 rounded-l-md ${getTaskStatus(folder).fillClass} transition-[width] duration-500`}
                                                                                style={{
                                                                                    width: `${progress}%`,
                                                                                }}
                                                                            />

                                                                            <span className="absolute inset-0 flex items-center justify-center">
                                                                                <span className="whitespace-nowrap rounded-sm bg-white/90 px-1 text-[10px] font-bold text-slate-900 shadow-sm dark:bg-slate-950/90 dark:text-white">
                                                                                    {
                                                                                        progress
                                                                                    }
                                                                                    %
                                                                                </span>
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                                                                    Not
                                                                    scheduled
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            Dates required to
                                                            position this task
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {dependencyLayout.lines.length > 0 && (
                                        <svg
                                            className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible"
                                            width={dependencyLayout.width}
                                            height={dependencyLayout.height}
                                            viewBox={`0 0 ${dependencyLayout.width} ${dependencyLayout.height}`}
                                            fill="none"
                                            aria-label="Task dependency connections"
                                        >
                                            <defs>
                                                <marker
                                                    id="dependency-arrow"
                                                    markerWidth="8"
                                                    markerHeight="8"
                                                    refX="6"
                                                    refY="3"
                                                    orient="auto"
                                                    markerUnits="userSpaceOnUse"
                                                >
                                                    <path
                                                        d="M0,0 L6,3 L0,6 Z"
                                                        fill="#ff6b35"
                                                    />
                                                </marker>
                                            </defs>

                                            {dependencyLayout.lines.map((line) => (
                                                <path
                                                    key={line.fid}
                                                    d={line.path}
                                                    stroke="#ff6b35"
                                                    strokeWidth="2"
                                                    strokeLinejoin="round"
                                                    strokeLinecap="round"
                                                    markerEnd="url(#dependency-arrow)"
                                                    opacity="0.95"
                                                />
                                            ))}
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>

            {selectedProgressFolder &&
                popupPosition &&
                !selectedProgressFolder.is_parent &&
                createPortal(
                    <div
                        role="dialog"
                        aria-label={`${selectedProgressFolder.fname} progress notes`}
                        className="fixed z-[99999] w-80 max-w-[calc(100vw-16px)] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        style={{
                            top: popupPosition.top,
                            left: popupPosition.left,
                            transform:
                                popupPosition.placement === "above"
                                    ? "translateY(-100%)"
                                    : "none",
                        }}
                    >
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="break-words font-semibold text-slate-900 dark:text-white">
                                    {selectedProgressFolder.fname}
                                </h3>

                                <p className="mt-1 text-xs font-medium text-primary">
                                    Progress:{" "}
                                    {getProgress(selectedProgressFolder)}%
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedProgressFolderId(null);
                                    setPopupPosition(null);
                                }}
                                className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                aria-label="Close progress notes"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-3">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Progress Notes
                            </p>

                            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                {selectedProgressFolder.progress_notes?.trim() ||
                                    "No progress notes added yet."}
                            </p>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            <p>
                                Assignee:{" "}
                                {(() => {
                                    const person =
                                        selectedProgressFolder.key_person_options?.find(
                                            (user) =>
                                                user.uid ===
                                                selectedProgressFolder.keypersonid,
                                        );

                                    return person
                                        ? [
                                              person.firstname,
                                              person.lastname,
                                          ]
                                              .filter(Boolean)
                                              .join(" ") || "Unassigned"
                                        : "Unassigned";
                                })()}
                            </p>

                            <p>
                                Start:{" "}
                                {formatDate(
                                    selectedProgressFolder.startdate,
                                )}
                            </p>

                            <p>
                                End:{" "}
                                {formatDate(selectedProgressFolder.enddate)}
                            </p>
                            {selectedProgressFolder.predecessorsid != null && (
                                <p>
                                    Depends on folder ID:{" "}
                                    {selectedProgressFolder.predecessorsid}
                                </p>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
