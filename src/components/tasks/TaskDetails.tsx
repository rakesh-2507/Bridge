// src/components/tasks/TaskDetails.tsx

import { useState, type ReactNode } from "react";
import {
    CalendarDays,
    Folder,
    Layers3,
    Loader2,
    Pencil,
    Trash2,
    User,
} from "lucide-react";

import { deleteTask } from "../../api/tasks";
import type { Task } from "../../types/task";

import TaskStatus from "./TaskStatus";

interface TaskDetailsProps {
    task: Task | null;
    onEdit: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

function TaskDetails({
    task,
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
            <div className="flex min-h-[500px] items-center justify-center border-l border-gray-200 bg-white px-6 text-center dark:border-gray-800 dark:bg-gray-900">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        <Layers3
                            size={22}
                            className="text-gray-400"
                        />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Select a task
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Select a task from the list to view its details.
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
        <div className="flex min-h-0 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="shrink-0 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {task.task_type ||
                                    "Untitled Task"}
                            </h2>

                            <TaskStatus
                                status={task.status}
                            />
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Task ID: {task.task_id}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        <Pencil size={14} />
                        Edit
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 p-6">
                    {/* Delete error */}
                    {deleteError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                            {deleteError}
                        </div>
                    )}

                    {/* Description */}
                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                            Description
                        </h3>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-950">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-400">
                                {task.task_description ||
                                    "No description available."}
                            </p>
                        </div>
                    </section>

                    {/* Schedule */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Schedule
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoCard
                                icon={
                                    <CalendarDays size={17} />
                                }
                                label="Start Date"
                                value={
                                    task.start_date ||
                                    "N/A"
                                }
                            />

                            <InfoCard
                                icon={
                                    <CalendarDays size={17} />
                                }
                                label="End Date"
                                value={
                                    task.end_date ||
                                    "N/A"
                                }
                            />
                        </div>
                    </section>

                    {/* Location */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Location
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <InfoCard
                                icon={
                                    <Layers3 size={17} />
                                }
                                label="Project"
                                value={String(
                                    task.project_id
                                )}
                            />

                            <InfoCard
                                icon={
                                    <Layers3 size={17} />
                                }
                                label="Template"
                                value={String(
                                    task.template_id
                                )}
                            />

                            <InfoCard
                                icon={
                                    <Folder size={17} />
                                }
                                label="Folder"
                                value={String(
                                    task.folder_id
                                )}
                            />
                        </div>
                    </section>

                    {/* Assignment */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Assignment
                        </h3>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InfoCard
                                icon={
                                    <User size={17} />
                                }
                                label="Assigned By"
                                value={String(
                                    task.assigned_by
                                )}
                            />

                            <InfoCard
                                icon={
                                    <User size={17} />
                                }
                                label="Assigned To"
                                value={String(
                                    task.assigned_to
                                )}
                            />
                        </div>
                    </section>

                    {/* Levels */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Levels
                        </h3>

                        {task.levels &&
                        task.levels.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {task.levels.map(
                                    (
                                        level,
                                        index
                                    ) => (
                                        <span
                                            key={`${level}-${index}`}
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                        >
                                            {level}
                                        </span>
                                    )
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No levels assigned.
                            </p>
                        )}
                    </section>

                    {/* Key Parameters */}
                    <section>
                        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Key Parameters
                        </h3>

                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                            {task.key_params &&
                            Object.keys(
                                task.key_params
                            ).length > 0 ? (
                                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {Object.entries(
                                        task.key_params
                                    ).map(
                                        ([
                                            key,
                                            value,
                                        ]) => (
                                            <div
                                                key={key}
                                                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                                            >
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    {key}
                                                </span>

                                                <span className="break-all text-sm text-gray-900 dark:text-white sm:max-w-[65%] sm:text-right">
                                                    {formatValue(
                                                        value
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    No key parameters.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
                {!showDeleteConfirm ? (
                    <button
                        type="button"
                        onClick={() => {
                            setDeleteError("");
                            setShowDeleteConfirm(
                                true
                            );
                        }}
                        className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                        <Trash2 size={16} />
                        Delete Task
                    </button>
                ) : (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
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
                                disabled={
                                    deleteLoading
                                }
                                onClick={() =>
                                    setShowDeleteConfirm(
                                        false
                                    )
                                }
                                className="rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    deleteLoading
                                }
                                onClick={handleDelete}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
            </div>
        </div>
    );
}

/* ============================================================
   INFO CARD
============================================================ */

interface InfoCardProps {
    icon: ReactNode;
    label: string;
    value: string;
}

function InfoCard({
    icon,
    label,
    value,
}: InfoCardProps) {
    return (
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-gray-400">
                {icon}

                <span className="text-xs">
                    {label}
                </span>
            </div>

            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

/* ============================================================
   VALUE FORMATTER
============================================================ */

function formatValue(
    value: unknown
): string {
    if (
        value === null ||
        value === undefined
    ) {
        return "—";
    }

    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    return String(value);
}

export default TaskDetails;