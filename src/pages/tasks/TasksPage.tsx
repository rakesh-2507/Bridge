// src/pages/tasks/TasksPage.tsx

import {
    useEffect,
    useState,
} from "react";

import {
    CalendarDays,
    Loader2,
    Plus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getTasks } from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";

function TasksPage() {
    const navigate = useNavigate();

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * ========================================================
     * LOAD TASKS
     * ========================================================
     */

    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getTasks();

                if (cancelled) {
                    return;
                }

                /*
                 * getTasks() returns Task[]
                 */
                setTasks(response ?? []);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load tasks."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadTasks();

        return () => {
            cancelled = true;
        };
    }, []);

    /*
     * ========================================================
     * PENDING TASKS
     * ========================================================
     */

    const pendingTasks =
        tasks.filter(
            (task) =>
                task.status !== 3
        );

    /*
     * ========================================================
     * DELETE
     * ========================================================
     */

    const handleDeleted = (
        taskId: number
    ) => {
        setTasks((previous) =>
            previous.filter(
                (task) =>
                    task.task_id !==
                    taskId
            )
        );

        setSelectedTask(null);
    };

    /*
     * ========================================================
     * LOADING
     * ========================================================
     */

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <Loader2
                        size={30}
                        className="mx-auto animate-spin text-gray-400"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading tasks...
                    </p>
                </div>
            </div>
        );
    }

    /*
     * ========================================================
     * PAGE
     * ========================================================
     */

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col bg-gray-50 dark:bg-gray-950">

            {/* =================================================
                HEADER
            ================================================== */}

            <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">

                <div className="flex items-center justify-between gap-4">

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Tasks
                        </h1>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Manage and track your pending tasks.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        {/* Today Tasks */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/tasks/today"
                                )
                            }
                            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <CalendarDays
                                size={16}
                            />

                            Today Tasks
                        </button>

                        {/* Create Task */}

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/tasks/create"
                                )
                            }
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            <Plus
                                size={16}
                            />

                            Create Task
                        </button>

                    </div>
                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* =================================================
                MASTER / DETAIL
            ================================================== */}

            <div className="min-h-0 flex-1">

                <div className="grid h-full grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">

                    {/* =================================================
                        LEFT - TASK LIST
                    ================================================== */}

                    <TaskList
                        tasks={pendingTasks}
                        selectedTask={selectedTask}
                        onSelect={setSelectedTask}
                    />

                    {/* =================================================
                        RIGHT - TASK DETAILS
                    ================================================== */}

                    <TaskDetails
                        task={selectedTask}
                        onEdit={(task) =>
                            navigate(
                                `/tasks/${task.task_id}/edit`
                            )
                        }
                        onDeleted={handleDeleted}
                    />

                </div>
            </div>
        </div>
    );
}

export default TasksPage;