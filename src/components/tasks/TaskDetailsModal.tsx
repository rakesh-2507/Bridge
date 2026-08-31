import { useState, type ReactNode } from "react";
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Folder,
    Layers3,
    Loader2,
    Pencil,
    Trash2,
    User,
    X,
} from "lucide-react";

import { deleteTask } from "../../api/tasks";
import type { Task } from "../../types/task";
import TaskModal from "./TaskModal";

interface TaskDetailsModalProps {
    task: Task | null;
    open: boolean;
    onClose: () => void;
    onUpdated: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

function TaskDetailsModal({
    task,
    open,
    onClose,
    onUpdated,
    onDeleted,
}: TaskDetailsModalProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] =
        useState(false);

    /*
     * ------------------------------------------------------------
     * Close details modal
     * ------------------------------------------------------------
     */
    const handleClose = () => {
        if (deleteLoading) {
            return;
        }

        setEditOpen(false);
        setShowDeleteConfirm(false);
        setDeleteError("");

        onClose();
    };

    /*
     * ------------------------------------------------------------
     * Open edit modal
     * ------------------------------------------------------------
     */
    const handleEdit = () => {
        setDeleteError("");
        setShowDeleteConfirm(false);
        setEditOpen(true);
    };

    /*
     * ------------------------------------------------------------
     * Close edit modal
     * ------------------------------------------------------------
     */
    const handleEditClose = () => {
        setEditOpen(false);
    };

    /*
     * ------------------------------------------------------------
     * Task successfully updated
     * ------------------------------------------------------------
     */
    const handleUpdated = (updatedTask: Task) => {
        setEditOpen(false);
        onUpdated(updatedTask);
    };

    /*
     * ------------------------------------------------------------
     * Open delete confirmation
     * ------------------------------------------------------------
     */
    const handleDeleteConfirmOpen = () => {
        setDeleteError("");
        setShowDeleteConfirm(true);
    };

    /*
     * ------------------------------------------------------------
     * Close delete confirmation
     * ------------------------------------------------------------
     */
    const handleDeleteConfirmClose = () => {
        if (deleteLoading) {
            return;
        }

        setShowDeleteConfirm(false);
        setDeleteError("");
    };

    /*
     * ------------------------------------------------------------
     * Delete task
     * ------------------------------------------------------------
     */
    const handleDelete = async () => {
        if (!task) {
            return;
        }

        setDeleteLoading(true);
        setDeleteError("");

        try {
            await deleteTask(task.task_id);

            setShowDeleteConfirm(false);

            onDeleted(task.task_id);
            onClose();
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

    /*
     * ------------------------------------------------------------
     * Do not render when closed or task is unavailable
     * ------------------------------------------------------------
     */
    if (!open || !task) {
        return null;
    }

    return (
        <>
            {/* =====================================================
                DETAILS MODAL
            ====================================================== */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
                onMouseDown={(event) => {
                    if (
                        event.target ===
                            event.currentTarget &&
                        !deleteLoading
                    ) {
                        handleClose();
                    }
                }}
            >
                <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                    {/* =================================================
                        HEADER
                    ================================================== */}
                    <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                        <div className="min-w-0 pr-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                                    {task.task_type ||
                                        "Untitled Task"}
                                </h2>

                                <TaskStatus
                                    status={task.status}
                                />
                            </div>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Task ID:{" "}
                                {task.task_id}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={deleteLoading}
                            aria-label="Close task details"
                            className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
                        >
                            <X size={19} />
                        </button>
                    </div>

                    {/* =================================================
                        BODY
                    ================================================== */}
                    <div className="min-h-0 overflow-y-auto">
                        <div className="space-y-6 p-6">
                            {/* Delete Error */}
                            {deleteError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                    {deleteError}
                                </div>
                            )}

                            {/* =================================================
                                DESCRIPTION
                            ================================================== */}
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

                            {/* =================================================
                                SCHEDULE
                            ================================================== */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Schedule
                                </h3>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <InfoCard
                                        icon={
                                            <CalendarDays
                                                size={17}
                                            />
                                        }
                                        label="Start Date"
                                        value={
                                            task.start_date ||
                                            "N/A"
                                        }
                                    />

                                    <InfoCard
                                        icon={
                                            <CalendarDays
                                                size={17}
                                            />
                                        }
                                        label="End Date"
                                        value={
                                            task.end_date ||
                                            "N/A"
                                        }
                                    />
                                </div>
                            </section>

                            {/* =================================================
                                LOCATION
                            ================================================== */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Location
                                </h3>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <InfoCard
                                        icon={
                                            <Layers3
                                                size={17}
                                            />
                                        }
                                        label="Project"
                                        value={String(
                                            task.project_id
                                        )}
                                    />

                                    <InfoCard
                                        icon={
                                            <Layers3
                                                size={17}
                                            />
                                        }
                                        label="Template"
                                        value={String(
                                            task.template_id
                                        )}
                                    />

                                    <InfoCard
                                        icon={
                                            <Folder
                                                size={17}
                                            />
                                        }
                                        label="Folder"
                                        value={String(
                                            task.folder_id
                                        )}
                                    />
                                </div>
                            </section>

                            {/* =================================================
                                ASSIGNMENT
                            ================================================== */}
                            <section>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                    Assignment
                                </h3>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <InfoCard
                                        icon={
                                            <User
                                                size={17}
                                            />
                                        }
                                        label="Assigned By"
                                        value={String(
                                            task.assigned_by
                                        )}
                                    />

                                    <InfoCard
                                        icon={
                                            <User
                                                size={17}
                                            />
                                        }
                                        label="Assigned To"
                                        value={String(
                                            task.assigned_to
                                        )}
                                    />
                                </div>
                            </section>

                            {/* =================================================
                                LEVELS
                            ================================================== */}
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

                            {/* =================================================
                                KEY PARAMETERS
                            ================================================== */}
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
                                                        key={
                                                            key
                                                        }
                                                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                                                    >
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            {
                                                                key
                                                            }
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

                    {/* =================================================
                        FOOTER
                    ================================================== */}
                    <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
                        <button
                            type="button"
                            onClick={
                                handleDeleteConfirmOpen
                            }
                            disabled={deleteLoading}
                            className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={
                                    deleteLoading
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                onClick={handleEdit}
                                disabled={
                                    deleteLoading
                                }
                                className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                                <Pencil size={16} />
                                Edit Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* =============================================================
                DELETE CONFIRMATION
            ============================================================== */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
                    <div
                        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-red-100 p-2.5 text-red-600 dark:bg-red-950 dark:text-red-400">
                                <Trash2 size={20} />
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Delete Task?
                                </h3>

                                <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                                    This action cannot be
                                    undone. The task will
                                    be permanently deleted.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={
                                    handleDeleteConfirmClose
                                }
                                disabled={
                                    deleteLoading
                                }
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    deleteLoading
                                }
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleteLoading && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {deleteLoading
                                    ? "Deleting..."
                                    : "Delete Task"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================================
                EDIT TASK MODAL
            ============================================================== */}
            <TaskModal
                open={editOpen}
                task={task}
                onClose={handleEditClose}
                onSuccess={handleUpdated}
            />
        </>
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
STATUS
============================================================ */

function TaskStatus({
    status,
}: {
    status?: number;
}) {
    if (status === 3) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 size={13} />
                Completed
            </span>
        );
    }

    if (status === 2) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Clock3 size={13} />
                In Progress
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            <Clock3 size={13} />
            Pending
        </span>
    );
}

/* ============================================================
VALUE FORMATTER
============================================================ */

function formatValue(value: unknown): string {
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

export default TaskDetailsModal;
