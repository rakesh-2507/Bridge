import { useState } from "react";

import {
    CalendarDays,
    Loader2,
    Pencil,
    Trash2,
    User,
} from "lucide-react";

import { deleteTask } from "../../api/tasks";
import type { Task } from "../../types/task";

import TaskStatus from "./TaskStatus";

type TaskCardColor = "yellow" | "purple";

interface TaskDetailsProps {
    task: Task | null;
    taskColor?: TaskCardColor;
    onEdit: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

function TaskDetails({
    task,
    // Keep this for later color support.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    taskColor,
    onEdit,
    onDeleted,
}: TaskDetailsProps) {
    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    const [deleteError, setDeleteError] =
        useState("");

    if (!task) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center border-l border-gray-200 bg-gray-50 px-6 text-center dark:border-gray-800 dark:bg-gray-950">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                        <Pencil
                            size={20}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select a task
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Select a task from the list to view
                        its details.
                    </p>
                </div>
            </div>
        );
    }

    const handleDelete = async () => {
        setDeleteLoading(true);
        setDeleteError("");

        try {
            await deleteTask(task.task_id);

            setShowDeleteConfirm(false);

            onDeleted(task.task_id);
        } catch (err) {
            setDeleteError(
                err instanceof Error
                    ? err.message
                    : "Failed to delete task."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">


            <div className="shrink-0 border-b border-gray-200 px-6 py-5 dark:border-gray-800">

                <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {task.task_type ||
                                    "Untitled Task"}
                            </h2>

                            <TaskStatus
                                status={task.status}
                            />
                        </div>

                        <p className="mt-1.5 text-xs font-medium text-gray-400">
                            Task #{task.task_id}
                        </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                onEdit(task)
                            }
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            <Pencil size={14} />
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDeleteError("");
                                setShowDeleteConfirm(true);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>

                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">

                <div className="space-y-7 p-6">

                    {deleteError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            {deleteError}
                        </div>
                    )}

                    {showDeleteConfirm && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">

                            <div className="flex items-start gap-3">

                                <Trash2
                                    size={18}
                                    className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                        Delete this task?
                                    </p>

                                    <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                        This action cannot be undone.
                                    </p>
                                </div>

                            </div>

                            <div className="mt-4 flex justify-end gap-2">

                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={() =>
                                        setShowDeleteConfirm(false)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                >
                                    {deleteLoading && (
                                        <Loader2
                                            size={14}
                                            className="animate-spin"
                                        />
                                    )}

                                    {deleteLoading
                                        ? "Deleting..."
                                        : "Delete Task"}
                                </button>

                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        <DateInfo
                            label="Start Date"
                            value={
                                task.start_date || "N/A"
                            }
                        />

                        <DateInfo
                            label="End Date"
                            value={
                                task.end_date || "N/A"
                            }
                        />

                    </div>
                    <section>

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Description:
                        </h3>

                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950">

                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                                {task.task_description ||
                                    "No description available."}
                            </p>

                        </div>

                    </section>
                    <section>

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Task Users:
                        </h3>

                        <div className="mt-4 space-y-3">

                            <TaskUser
                                label="Assigned By"
                                value={String(
                                    task.assigned_by ?? "N/A"
                                )}
                            />

                            <TaskUser
                                label="Assigned To"
                                value={String(
                                    task.assigned_to ?? "N/A"
                                )}
                            />

                        </div>

                    </section>

                </div>
            </div>
        </div>
    );
}

interface DateInfoProps {
    label: string;
    value: string;
}

function DateInfo({
    label,
    value,
}: DateInfoProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">

            <div className="flex items-center gap-2">

                <CalendarDays
                    size={16}
                    className="text-gray-400"
                />

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}
                </span>

            </div>

            <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                {value}
            </p>

        </div>
    );
}

interface TaskUserProps {
    label: string;
    value: string;
}

function TaskUser({
    label,
    value,
}: TaskUserProps) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-gray-900">

                <User
                    size={17}
                    className="text-gray-500 dark:text-gray-400"
                />

            </div>

            <div className="flex items-center gap-2">

                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {label}:
                </span>

                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    #{value}
                </span>

            </div>

        </div>
    );
}

export default TaskDetails;