import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    CalendarDays,
    ListTodo,
    Loader2,
    Plus,
    Search,
    XCircle,
} from "lucide-react";

import { getTasks } from "../api/tasks";

import type { Task } from "../types/task";

import TaskModal from "../components/tasks/TaskModal";
import TaskDetailsModal from "../components/tasks/TaskDetailsModal";
import TaskCalendarModal from "../components/tasks/TaskCalendarModal";

type TaskFilter =
    | "all"
    | "pending"
    | "today"
    | "in-progress"
    | "completed";

function TaskManagement() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [activeFilter, setActiveFilter] =
        useState<TaskFilter>("all");

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [taskModalOpen, setTaskModalOpen] =
        useState(false);

    const [calendarOpen, setCalendarOpen] =
        useState(false);

    /*
     * ------------------------------------------------------------
     * Today's date
     * ------------------------------------------------------------
     *
     * Use local date instead of toISOString()
     * to avoid timezone-related date problems.
     */
    const today = useMemo(() => {
        const date = new Date();

        const year = date.getFullYear();

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }, []);

    /*
     * ------------------------------------------------------------
     * Load tasks
     * ------------------------------------------------------------
     */
    const fetchTasks = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getTasks();

            setTasks(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load tasks"
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * ------------------------------------------------------------
     * Initial task loading
     * ------------------------------------------------------------
     *
     * Do not call setState directly inside the effect.
     *
     * The async function performs the API request first,
     * then updates state when the response arrives.
     */
    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            setError("");

            try {
                const data = await getTasks();

                if (!cancelled) {
                    setTasks(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load tasks"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadTasks();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * ------------------------------------------------------------
     * Search + filtering
     * ------------------------------------------------------------
     */
    const filteredTasks = useMemo(() => {
        const searchValue = search
            .trim()
            .toLowerCase();

        return tasks.filter((task) => {
            const matchesSearch =
                !searchValue ||
                [
                    task.task_type,
                    task.task_description,
                    task.start_date,
                    task.end_date,
                    task.project_id,
                    task.template_id,
                    task.folder_id,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(searchValue);

            if (!matchesSearch) {
                return false;
            }

            switch (activeFilter) {
                case "pending":
                    return (
                        !task.status ||
                        task.status === 1
                    );

                case "today":
                    return (
                        today >= task.start_date &&
                        today <= task.end_date
                    );

                case "in-progress":
                    return task.status === 2;

                case "completed":
                    return task.status === 3;

                case "all":
                default:
                    return true;
            }
        });
    }, [
        tasks,
        search,
        activeFilter,
        today,
    ]);

    /*
     * ------------------------------------------------------------
     * Statistics
     * ------------------------------------------------------------
     */
    const pendingCount = useMemo(
        () =>
            tasks.filter(
                (task) =>
                    !task.status ||
                    task.status === 1
            ).length,
        [tasks]
    );

    const todayCount = useMemo(
        () =>
            tasks.filter(
                (task) =>
                    today >= task.start_date &&
                    today <= task.end_date
            ).length,
        [tasks, today]
    );

    const inProgressCount = useMemo(
        () =>
            tasks.filter(
                (task) => task.status === 2
            ).length,
        [tasks]
    );

    const completedCount = useMemo(
        () =>
            tasks.filter(
                (task) => task.status === 3
            ).length,
        [tasks]
    );

    /*
     * ------------------------------------------------------------
     * Create task
     * ------------------------------------------------------------
     */
    const handleCreateTask = () => {
        setTaskModalOpen(true);
    };

    /*
     * ------------------------------------------------------------
     * Task successfully created
     * ------------------------------------------------------------
     */
    const handleTaskSaved = () => {
        setTaskModalOpen(false);

        void fetchTasks();
    };

    /*
     * ------------------------------------------------------------
     * Today calendar
     * ------------------------------------------------------------
     */
    const handleTodayClick = () => {
        setCalendarOpen(true);
    };

    /*
     * ------------------------------------------------------------
     * Filter cards
     * ------------------------------------------------------------
     */
    const handleFilterClick = (
        filter: TaskFilter
    ) => {
        setActiveFilter(filter);
    };

    /*
     * ------------------------------------------------------------
     * Updated task from TaskDetailsModal
     * ------------------------------------------------------------
     */
    const handleTaskUpdated = (
        updatedTask: Task
    ) => {
        setTasks((previousTasks) =>
            previousTasks.map((item) =>
                item.task_id ===
                    updatedTask.task_id
                    ? updatedTask
                    : item
            )
        );

        setSelectedTask(updatedTask);
    };

    /*
     * ------------------------------------------------------------
     * Deleted task from TaskDetailsModal
     * ------------------------------------------------------------
     */
    const handleTaskDeleted = (
        taskId: number
    ) => {
        setTasks((previousTasks) =>
            previousTasks.filter(
                (item) =>
                    item.task_id !== taskId
            )
        );

        setSelectedTask(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-6 dark:bg-gray-950 sm:px-6">
            <div className="mx-auto max-w-7xl">

                {/* =====================================================
                    HEADER
                ====================================================== */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Task Management
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage and track your assigned tasks
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateTask}
                        className="flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        <Plus size={17} />
                        Create Task
                    </button>
                </div>

                {/* =====================================================
                    ERROR
                ====================================================== */}
                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        <XCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span>{error}</span>
                    </div>
                )}

                {/* =====================================================
                    STATISTICS
                ====================================================== */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                    {/* Pending */}
                    <button
                        type="button"
                        onClick={() =>
                            handleFilterClick(
                                "pending"
                            )
                        }
                        className={`rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${activeFilter === "pending"
                                ? "border-gray-900 ring-1 ring-gray-900 dark:border-white dark:ring-white"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pending
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    {pendingCount}
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-2.5 dark:bg-gray-800">
                                <Clock3
                                    size={21}
                                    className="text-gray-500"
                                />
                            </div>
                        </div>
                    </button>

                    {/* Today */}
                    <button
                        type="button"
                        onClick={handleTodayClick}
                        className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Today
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    {todayCount}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Open calendar
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-2.5 dark:bg-gray-800">
                                <CalendarDays
                                    size={21}
                                    className="text-gray-500"
                                />
                            </div>
                        </div>
                    </button>

                    {/* In Progress */}
                    <button
                        type="button"
                        onClick={() =>
                            handleFilterClick(
                                "in-progress"
                            )
                        }
                        className={`rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${activeFilter ===
                                "in-progress"
                                ? "border-gray-900 ring-1 ring-gray-900 dark:border-white dark:ring-white"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    In Progress
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    {inProgressCount}
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-2.5 dark:bg-gray-800">
                                <ListTodo
                                    size={21}
                                    className="text-gray-500"
                                />
                            </div>
                        </div>
                    </button>

                    {/* Completed */}
                    <button
                        type="button"
                        onClick={() =>
                            handleFilterClick(
                                "completed"
                            )
                        }
                        className={`rounded-xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900 ${activeFilter ===
                                "completed"
                                ? "border-gray-900 ring-1 ring-gray-900 dark:border-white dark:ring-white"
                                : "border-gray-200 dark:border-gray-800"
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Completed
                                </p>

                                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                                    {completedCount}
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-100 p-2.5 dark:bg-gray-800">
                                <CheckCircle2
                                    size={21}
                                    className="text-gray-500"
                                />
                            </div>
                        </div>
                    </button>
                </div>

                {/* =====================================================
                    TASKS
                ====================================================== */}
                <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

                    {/* Toolbar */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-semibold text-gray-900 dark:text-white">
                                    {activeFilter === "pending"
                                        ? "Pending Tasks"
                                        : activeFilter === "today"
                                            ? "Today's Tasks"
                                            : activeFilter ===
                                                "in-progress"
                                                ? "In Progress Tasks"
                                                : activeFilter ===
                                                    "completed"
                                                    ? "Completed Tasks"
                                                    : "My Tasks"}
                                </h2>

                                {activeFilter !== "all" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveFilter(
                                                "all"
                                            )
                                        }
                                        className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                    >
                                        Clear filter
                                    </button>
                                )}
                            </div>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {filteredTasks.length} task
                                {filteredTasks.length !== 1
                                    ? "s"
                                    : ""}
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-72">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search tasks..."
                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2
                                size={30}
                                className="animate-spin text-gray-500"
                            />

                            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                Loading tasks...
                            </p>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading &&
                        filteredTasks.length === 0 && (
                            <div className="px-6 py-16 text-center">
                                <ListTodo
                                    size={42}
                                    className="mx-auto text-gray-400"
                                />

                                <p className="mt-4 font-medium text-gray-900 dark:text-white">
                                    {search.trim()
                                        ? "No matching tasks"
                                        : activeFilter !== "all"
                                            ? "No tasks in this category"
                                            : "No tasks found"}
                                </p>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {search.trim()
                                        ? "Try changing your search."
                                        : "You don't have any tasks assigned yet."}
                                </p>
                            </div>
                        )}

                    {/* Task List */}
                    {!loading &&
                        filteredTasks.length > 0 && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {filteredTasks.map(
                                    (task) => (
                                        <button
                                            type="button"
                                            key={task.task_id}
                                            onClick={() =>
                                                setSelectedTask(
                                                    task
                                                )
                                            }
                                            className="block w-full p-5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                                {/* Task Information */}
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {task.task_type ||
                                                                "Untitled Task"}
                                                        </h3>

                                                        <TaskStatus
                                                            status={
                                                                task.status
                                                            }
                                                        />
                                                    </div>

                                                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {task.task_description ||
                                                            "No description available"}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span>
                                                            Project:{" "}
                                                            {
                                                                task.project_id
                                                            }
                                                        </span>

                                                        <span>
                                                            Template:{" "}
                                                            {
                                                                task.template_id
                                                            }
                                                        </span>

                                                        <span>
                                                            Folder:{" "}
                                                            {
                                                                task.folder_id
                                                            }
                                                        </span>

                                                        <span>
                                                            Start:{" "}
                                                            {
                                                                task.start_date
                                                            }
                                                        </span>

                                                        <span>
                                                            End:{" "}
                                                            {
                                                                task.end_date
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                </div>
            </div>

            {/* =========================================================
                CREATE TASK MODAL
            ========================================================== */}
            <TaskModal
                open={taskModalOpen}
                task={null}
                onClose={() =>
                    setTaskModalOpen(false)
                }
                onSuccess={handleTaskSaved}
            />

            {/* =========================================================
                TASK DETAILS MODAL
            ========================================================== */}
            <TaskDetailsModal
                task={selectedTask}
                open={selectedTask !== null}
                onClose={() =>
                    setSelectedTask(null)
                }
                onUpdated={handleTaskUpdated}
                onDeleted={handleTaskDeleted}
            />

            {/* =========================================================
                CALENDAR MODAL
            ========================================================== */}
            <TaskCalendarModal
                open={calendarOpen}
                tasks={tasks}
                onClose={() => setCalendarOpen(false)}
                onUpdated={(updatedTask: Task) => {
                    setTasks((previousTasks) =>
                        previousTasks.map((item) =>
                            item.task_id === updatedTask.task_id
                                ? updatedTask
                                : item
                        )
                    );
                }}
                onDeleted={(taskId: number) => {
                    setTasks((previousTasks) =>
                        previousTasks.filter(
                            (item) => item.task_id !== taskId
                        )
                    );
                }}
            />
        </div>
    );
}

/*
 * ============================================================
 * TASK STATUS
 * ============================================================
 */
function TaskStatus({
    status,
}: {
    status?: number;
}) {
    if (status === 3) {
        return (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                Completed
            </span>
        );
    }

    if (status === 2) {
        return (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                In Progress
            </span>
        );
    }

    return (
        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            Pending
        </span>
    );
}

export default TaskManagement;
