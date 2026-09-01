import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    Loader2,
} from "lucide-react";

import {
    useNavigate,
    useParams,
    useLocation,
} from "react-router-dom";

import {
    getTask,
} from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskForm from "../../components/tasks/TaskForm";

function EditTaskPage() {
    const {
        taskId,
    } = useParams();

    const navigate = useNavigate();
    const location = useLocation();
    const existingTask =
        location.state?.task as Task | undefined;
    const [task, setTask] =
        useState<Task | null>(
            existingTask ?? null
        );

    const [loading, setLoading] =
        useState(!existingTask);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!taskId || existingTask) {
            return;
        }

        let cancelled = false;

        const loadTask = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getTask(
                        Number(taskId)
                    );

                if (cancelled) {
                    return;
                }

                setTask(response);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load task."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadTask();

        return () => {
            cancelled = true;
        };
    }, [taskId, existingTask]);

    if (!taskId) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl">

                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        Task ID is missing.
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/tasks")
                        }
                        className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                        <ArrowLeft size={16} />

                        Back to Tasks
                    </button>

                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">

                    <Loader2
                        size={30}
                        className="mx-auto animate-spin text-gray-400"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading task...
                    </p>

                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
                <div className="mx-auto max-w-3xl">

                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error || "Task not found."}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/tasks")
                        }
                        className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                    >
                        <ArrowLeft size={16} />

                        Back to Tasks
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
            <div className="mx-auto max-w-6xl">

                <div className="mb-6 flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/tasks`
                            )
                        }
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft size={19} />
                    </button>

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Update Task
                        </h1>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Update the task information.
                        </p>
                    </div>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                    <TaskForm
                        task={task}

                        onCancel={() =>
                            navigate(
                                `/tasks`
                            )
                        }

                        onSuccess={() =>
                            navigate(
                                `/tasks`
                            )
                        }
                    />

                </div>

            </div>
        </div>
    );
}

export default EditTaskPage;