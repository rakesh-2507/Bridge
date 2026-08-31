import { useMemo, useState } from "react";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    X,
} from "lucide-react";

import type { Task } from "../../types/task";
import TaskDetailsModal from "./TaskDetailsModal";

interface TaskCalendarModalProps {
    open: boolean;
    tasks: Task[];
    onClose: () => void;
    onUpdated: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

function TaskCalendarModal({
    open,
    tasks,
    onClose,
    onUpdated,
    onDeleted,
}: TaskCalendarModalProps) {
    const today = getDateKey(new Date());

    const [selectedDate, setSelectedDate] = useState(today);

    const [visibleMonth, setVisibleMonth] = useState(() => {
        const date = new Date();

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            1
        );
    });

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    /*
     * Calendar days for the visible month.
     *
     * Complete weeks are rendered so the calendar
     * always has a consistent 7-column layout.
     */
    const calendarDays = useMemo(() => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();

        const firstDay = new Date(
            year,
            month,
            1
        );

        const lastDay = new Date(
            year,
            month + 1,
            0
        );

        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const previousMonthLastDate = new Date(
            year,
            month,
            0
        ).getDate();

        const days: CalendarDay[] = [];

        // Previous month's days
        for (
            let index = startOffset - 1;
            index >= 0;
            index--
        ) {
            const day =
                previousMonthLastDate - index;

            const date = new Date(
                year,
                month - 1,
                day
            );

            days.push({
                date,
                dateKey: getDateKey(date),
                isCurrentMonth: false,
            });
        }

        // Current month's days
        for (
            let day = 1;
            day <= totalDays;
            day++
        ) {
            const date = new Date(
                year,
                month,
                day
            );

            days.push({
                date,
                dateKey: getDateKey(date),
                isCurrentMonth: true,
            });
        }

        // Next month's days
        let nextDay = 1;

        while (days.length % 7 !== 0) {
            const date = new Date(
                year,
                month + 1,
                nextDay
            );

            days.push({
                date,
                dateKey: getDateKey(date),
                isCurrentMonth: false,
            });

            nextDay++;
        }

        return days;
    }, [visibleMonth]);

    /*
     * Tasks active on the selected date.
     */
    const selectedDateTasks = useMemo(() => {
        return tasks.filter((task) => {
            if (
                !task.start_date ||
                !task.end_date
            ) {
                return false;
            }

            return (
                selectedDate >=
                    normalizeDate(task.start_date) &&
                selectedDate <=
                    normalizeDate(task.end_date)
            );
        });
    }, [tasks, selectedDate]);

    if (!open) {
        return null;
    }

    const goToPreviousMonth = () => {
        setVisibleMonth((previous) => {
            return new Date(
                previous.getFullYear(),
                previous.getMonth() - 1,
                1
            );
        });
    };

    const goToNextMonth = () => {
        setVisibleMonth((previous) => {
            return new Date(
                previous.getFullYear(),
                previous.getMonth() + 1,
                1
            );
        });
    };

    const goToToday = () => {
        const date = new Date();

        setVisibleMonth(
            new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            )
        );

        setSelectedDate(
            getDateKey(date)
        );
    };

    const handleClose = () => {
        setSelectedTask(null);
        onClose();
    };

    return (
        <>
            {/* =========================================================
                CALENDAR MODAL
            ========================================================== */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        handleClose();
                    }
                }}
            >
                <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">

                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                        <div className="flex items-center gap-3">

                            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                                <CalendarDays
                                    size={19}
                                    className="text-gray-600 dark:text-gray-300"
                                />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Task Calendar
                                </h2>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    View tasks day by day
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
                            aria-label="Close calendar"
                        >
                            <X size={19} />
                        </button>

                    </div>

                    {/* Content */}
                    <div className="min-h-0 overflow-y-auto">

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">

                            {/* Calendar */}
                            <div className="border-b border-gray-200 p-5 lg:border-b-0 lg:border-r dark:border-gray-800">

                                {/* Month Navigation */}
                                <div className="mb-5 flex items-center justify-between">

                                    <div className="flex items-center gap-2">

                                        <button
                                            type="button"
                                            onClick={
                                                goToPreviousMonth
                                            }
                                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                                            aria-label="Previous month"
                                        >
                                            <ChevronLeft
                                                size={17}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                goToNextMonth
                                            }
                                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                                            aria-label="Next month"
                                        >
                                            <ChevronRight
                                                size={17}
                                            />
                                        </button>

                                    </div>

                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                        {visibleMonth.toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "long",
                                                year: "numeric",
                                            }
                                        )}
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={
                                            goToToday
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Today
                                    </button>

                                </div>

                                {/* Weekday Header */}
                                <div className="grid grid-cols-7 border-b border-gray-200 pb-2 dark:border-gray-800">

                                    {[
                                        "Sun",
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="text-center text-xs font-medium text-gray-400"
                                        >
                                            {day}
                                        </div>
                                    ))}

                                </div>

                                {/* Calendar Grid */}
                                <div className="mt-2 grid grid-cols-7 overflow-hidden rounded-lg border-l border-t border-gray-200 dark:border-gray-800">

                                    {calendarDays.map(
                                        (calendarDay) => {
                                            const dayTasks =
                                                getTasksForDate(
                                                    tasks,
                                                    calendarDay.dateKey
                                                );

                                            const isToday =
                                                calendarDay.dateKey ===
                                                today;

                                            const isSelected =
                                                calendarDay.dateKey ===
                                                selectedDate;

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        calendarDay.dateKey
                                                    }
                                                    onClick={() =>
                                                        setSelectedDate(
                                                            calendarDay.dateKey
                                                        )
                                                    }
                                                    className={[
                                                        "relative min-h-[92px] border-b border-r border-gray-200 p-2 text-left transition dark:border-gray-800",
                                                        "hover:bg-gray-50 dark:hover:bg-gray-800/70",
                                                        calendarDay.isCurrentMonth
                                                            ? "bg-white dark:bg-gray-900"
                                                            : "bg-gray-50/70 dark:bg-gray-950/50",
                                                        isSelected
                                                            ? "ring-2 ring-inset ring-gray-900 dark:ring-white"
                                                            : "",
                                                    ].join(" ")}
                                                >
                                                    {/* Day Number */}
                                                    <div className="flex items-center justify-between">

                                                        <span
                                                            className={[
                                                                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                                                                isToday
                                                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                                                    : calendarDay.isCurrentMonth
                                                                    ? "text-gray-700 dark:text-gray-300"
                                                                    : "text-gray-400",
                                                            ].join(" ")}
                                                        >
                                                            {calendarDay.date.getDate()}
                                                        </span>

                                                        {dayTasks.length >
                                                            0 && (
                                                            <span className="text-[10px] font-medium text-gray-400">
                                                                {
                                                                    dayTasks.length
                                                                }
                                                            </span>
                                                        )}

                                                    </div>

                                                    {/* Task Indicators */}
                                                    <div className="mt-2 space-y-1">

                                                        {dayTasks
                                                            .slice(0, 2)
                                                            .map(
                                                                (
                                                                    task
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            task.task_id
                                                                        }
                                                                        className={[
                                                                            "truncate rounded px-1.5 py-1 text-[10px] font-medium",
                                                                            getTaskIndicatorClass(
                                                                                task.status
                                                                            ),
                                                                        ].join(
                                                                            " "
                                                                        )}
                                                                    >
                                                                        {task.task_type ||
                                                                            "Untitled"}
                                                                    </div>
                                                                )
                                                            )}

                                                        {dayTasks.length >
                                                            2 && (
                                                            <div className="px-1 text-[10px] text-gray-400">
                                                                +
                                                                {dayTasks.length -
                                                                    2}{" "}
                                                                more
                                                            </div>
                                                        )}

                                                    </div>
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </div>

                            {/* Selected Day */}
                            <div className="flex min-h-[400px] flex-col">

                                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        Selected Day
                                    </p>

                                    <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                                        {formatSelectedDate(
                                            selectedDate
                                        )}
                                    </h3>

                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {
                                            selectedDateTasks.length
                                        }{" "}
                                        task
                                        {selectedDateTasks.length !==
                                        1
                                            ? "s"
                                            : ""}
                                    </p>

                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto">

                                    {selectedDateTasks.length ===
                                    0 ? (
                                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">

                                            <CalendarDays
                                                size={36}
                                                className="text-gray-300 dark:text-gray-700"
                                            />

                                            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                                                No tasks
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                There are no
                                                tasks scheduled
                                                for this date.
                                            </p>

                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-200 dark:divide-gray-800">

                                            {selectedDateTasks.map(
                                                (
                                                    task
                                                ) => (
                                                    <button
                                                        type="button"
                                                        key={
                                                            task.task_id
                                                        }
                                                        onClick={() =>
                                                            setSelectedTask(
                                                                task
                                                            )
                                                        }
                                                        className="block w-full p-4 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">

                                                            <div className="min-w-0">

                                                                <div className="flex items-center gap-2">

                                                                    <span
                                                                        className={[
                                                                            "h-2 w-2 shrink-0 rounded-full",
                                                                            getTaskDotClass(
                                                                                task.status
                                                                            ),
                                                                        ].join(
                                                                            " "
                                                                        )}
                                                                    />

                                                                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                                        {task.task_type ||
                                                                            "Untitled Task"}
                                                                    </p>

                                                                </div>

                                                                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                                                    {task.task_description ||
                                                                        "No description available."}
                                                                </p>

                                                            </div>

                                                            <TaskStatus
                                                                status={
                                                                    task.status
                                                                }
                                                            />

                                                        </div>

                                                        <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">

                                                            <Clock3
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            {task.start_date}{" "}
                                                            →{" "}
                                                            {task.end_date}

                                                        </div>

                                                    </button>
                                                )
                                            )}

                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 justify-end border-t border-gray-200 px-5 py-3 dark:border-gray-800">

                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Close
                        </button>

                    </div>

                </div>
            </div>

            {/* Task Details */}
            <TaskDetailsModal
                open={Boolean(selectedTask)}
                task={selectedTask}
                onClose={() =>
                    setSelectedTask(null)
                }
                onUpdated={(updatedTask) => {
                    setSelectedTask(updatedTask);
                    onUpdated(updatedTask);
                }}
                onDeleted={(taskId) => {
                    setSelectedTask(null);
                    onDeleted(taskId);
                }}
            />
        </>
    );
}

/* ============================================================
   TYPES
============================================================ */

interface CalendarDay {
    date: Date;
    dateKey: string;
    isCurrentMonth: boolean;
}

/* ============================================================
   DATE HELPERS
============================================================ */

/**
 * Returns YYYY-MM-DD.
 */
function getDateKey(date: Date): string {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * Normalize an API date.
 *
 * Only the date portion is used so timezone
 * conversion does not move a task to another day.
 */
function normalizeDate(date: string): string {
    return date.slice(0, 10);
}

/**
 * Get all tasks active on a date.
 */
function getTasksForDate(
    tasks: Task[],
    date: string
): Task[] {
    return tasks.filter((task) => {
        if (
            !task.start_date ||
            !task.end_date
        ) {
            return false;
        }

        return (
            date >= normalizeDate(task.start_date) &&
            date <= normalizeDate(task.end_date)
        );
    });
}

/**
 * Display selected date.
 */
function formatSelectedDate(
    dateKey: string
): string {
    const date = new Date(
        `${dateKey}T00:00:00`
    );

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }
    );
}

/* ============================================================
   TASK COLORS
============================================================ */

function getTaskIndicatorClass(
    status?: number
): string {
    if (status === 3) {
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
    }

    if (status === 2) {
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    }

    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
}

function getTaskDotClass(
    status?: number
): string {
    if (status === 3) {
        return "bg-green-500";
    }

    if (status === 2) {
        return "bg-blue-500";
    }

    return "bg-yellow-500";
}

/* ============================================================
   STATUS
============================================================ */

function TaskStatus({
    status,
}: {
    status?: number;
}) {
    if (status === 3) {
        return (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                Completed
            </span>
        );
    }

    if (status === 2) {
        return (
            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                In Progress
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            Pending
        </span>
    );
}

export default TaskCalendarModal;

