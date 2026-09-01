// src/pages/tasks/TodayTasksPage.tsx

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    getTasks,
} from "../../api/tasks";

import type { Task } from "../../types/task";

import TaskDateStrip from "../../components/tasks/TaskDateStrip";
import TaskList from "../../components/tasks/TaskList";
import TaskDetails from "../../components/tasks/TaskDetails";



function TodayTasksPage() {
    const navigate = useNavigate();

    const today =
        getDateKey(new Date());

    const [selectedDate, setSelectedDate] =
        useState(today);

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const getTaskCount = (
        date: string
    ): number => {
        return tasks.filter((task) => {
            if (
                !task.start_date ||
                !task.end_date
            ) {
                return false;
            }

            const start =
                normalizeDate(
                    task.start_date
                );

            const end =
                normalizeDate(
                    task.end_date
                );

            return (
                date >= start &&
                date <= end
            );
        }).length;
    };

    useEffect(() => {
        let cancelled = false;

        const loadTasks = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getTasks();

                if (!cancelled) {
                    setTasks(response);
                }
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

    const dateTasks =
        useMemo(() => {
            return tasks.filter(
                (task) => {
                    if (
                        !task.start_date ||
                        !task.end_date
                    ) {
                        return false;
                    }

                    const start =
                        normalizeDate(
                            task.start_date
                        );

                    const end =
                        normalizeDate(
                            task.end_date
                        );

                    return (
                        selectedDate >=
                        start &&
                        selectedDate <=
                        end
                    );
                }
            );
        }, [tasks, selectedDate]);

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

    const handleDateChange = (
        date: string
    ) => {
        setSelectedDate(date);

        setSelectedTask(
            (current) => {
                if (!current) {
                    return null;
                }

                if (
                    !current.start_date ||
                    !current.end_date
                ) {
                    return null;
                }

                const start =
                    normalizeDate(
                        current.start_date
                    );

                const end =
                    normalizeDate(
                        current.end_date
                    );

                if (
                    date >= start &&
                    date <= end
                ) {
                    return current;
                }

                return null;
            }
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <Loader2
                        size={30}
                        className="mx-auto animate-spin text-gray-400"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading today's tasks...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-64px)] min-w-0 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">

            <TaskDateStrip
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                getTaskCount={getTaskCount}
            />

            {error && (
                <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                    {error}
                </div>
            )}

            <div className="min-h-0 flex-1">
                <div className="grid h-full grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)]">
                    <TaskList
                        tasks={
                            dateTasks
                        }
                        selectedTask={
                            selectedTask
                        }
                        onSelect={
                            setSelectedTask
                        }
                        title={`Tasks for ${formatShortDate(
                            selectedDate
                        )}`}
                    />

                    <TaskDetails
                        task={selectedTask}
                        onEdit={(task) =>
                            navigate(
                                `/tasks/${task.task_id}/edit`,
                                {
                                    state: {
                                        task,
                                    },
                                }
                            )
                        }
                        onDeleted={handleDeleted}
                    />
                </div>
            </div>
        </div>
    );
}

function getDateKey(
    date: Date
): string {
    const year =
        date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function normalizeDate(
    date: string
): string {
    return date.slice(0, 10);
}

function formatShortDate(
    dateKey: string
): string {
    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
        }
    );
}

export default TodayTasksPage;