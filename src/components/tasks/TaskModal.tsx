import { useState } from "react";
import { Loader2, X } from "lucide-react";

import {
    createTask,
    updateTask,
} from "../../api/tasks";

import type {
    CreateTaskPayload,
    Task,
    UpdateTaskPayload,
} from "../../types/task";

interface TaskModalProps {
    open: boolean;
    task?: Task | null;
    onClose: () => void;
    onSuccess: (task: Task) => void;
}

const EMPTY_FORM: CreateTaskPayload = {
    project_id: 0,
    template_id: 0,
    folder_id: 0,

    task_type: "",
    task_description: "",

    key_params: {},
    levels: [],

    start_date: "",
    end_date: "",

    assigned_by: 0,
    assigned_to: 0,
};

function TaskModal({
    open,
    task,
    onClose,
    onSuccess,
}: TaskModalProps) {
    if (!open) {
        return null;
    }

    /*
     * Using a key forces a fresh form when:
     * - switching from create -> edit
     * - switching between different tasks
     * - switching from edit -> create
     */
    const formKey = task
        ? `edit-${task.task_id}`
        : "create";

    return (
        <TaskModalForm
            key={formKey}
            task={task}
            onClose={onClose}
            onSuccess={onSuccess}
        />
    );
}

/* ============================================================
   TASK MODAL FORM
============================================================ */

interface TaskModalFormProps {
    task?: Task | null;
    onClose: () => void;
    onSuccess: (task: Task) => void;
}

function TaskModalForm({
    task,
    onClose,
    onSuccess,
}: TaskModalFormProps) {
    const isEdit = Boolean(task);

    const [form, setForm] =
        useState<CreateTaskPayload>(() => {
            if (!task) {
                return {
                    ...EMPTY_FORM,
                    key_params: {},
                    levels: [],
                };
            }

            return {
                project_id: task.project_id,
                template_id: task.template_id,
                folder_id: task.folder_id,

                task_type:
                    task.task_type ?? "",

                task_description:
                    task.task_description ?? "",

                key_params:
                    task.key_params ?? {},

                levels:
                    task.levels ?? [],

                start_date:
                    task.start_date ?? "",

                end_date:
                    task.end_date ?? "",

                assigned_by:
                    task.assigned_by ?? 0,

                assigned_to:
                    task.assigned_to ?? 0,
            };
        });

    const [levelsInput, setLevelsInput] =
        useState(
            task?.levels?.join(", ") ?? ""
        );

    const [keyParamsInput, setKeyParamsInput] =
        useState(() =>
            task?.key_params
                ? JSON.stringify(
                      task.key_params,
                      null,
                      2
                  )
                : ""
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    /* ========================================================
       UPDATE FIELD
    ======================================================== */

    const updateField = <
        K extends keyof CreateTaskPayload
    >(
        field: K,
        value: CreateTaskPayload[K]
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    /* ========================================================
       SUBMIT
    ======================================================== */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");

        /* ----------------------------------------------------
           Validation
        ---------------------------------------------------- */

        if (form.project_id <= 0) {
            setError("Project ID is required.");
            return;
        }

        if (form.template_id <= 0) {
            setError("Template ID is required.");
            return;
        }

        if (form.folder_id <= 0) {
            setError("Folder ID is required.");
            return;
        }

        if (!form.task_type.trim()) {
            setError("Task type is required.");
            return;
        }

        if (!form.start_date) {
            setError("Start date is required.");
            return;
        }

        if (!form.end_date) {
            setError("End date is required.");
            return;
        }

        if (
            form.end_date <
            form.start_date
        ) {
            setError(
                "End date cannot be before start date."
            );
            return;
        }

        if (form.assigned_by <= 0) {
            setError(
                "Assigned by is required."
            );
            return;
        }

        if (form.assigned_to <= 0) {
            setError(
                "Assigned to is required."
            );
            return;
        }

        /* ----------------------------------------------------
           Parse levels
        ---------------------------------------------------- */

        const parsedLevels =
            levelsInput
                .split(",")
                .map((level) =>
                    level.trim()
                )
                .filter(Boolean);

        /* ----------------------------------------------------
           Parse key parameters
        ---------------------------------------------------- */

        let parsedKeyParams: Record<
            string,
            unknown
        > = {};

        if (keyParamsInput.trim()) {
            try {
                const parsed =
                    JSON.parse(
                        keyParamsInput
                    );

                if (
                    parsed === null ||
                    typeof parsed !== "object" ||
                    Array.isArray(parsed)
                ) {
                    setError(
                        "Key parameters must be a JSON object."
                    );
                    return;
                }

                parsedKeyParams =
                    parsed as Record<
                        string,
                        unknown
                    >;
            } catch {
                setError(
                    "Key parameters contain invalid JSON."
                );
                return;
            }
        }

        /* ----------------------------------------------------
           Create API payload
        ---------------------------------------------------- */

        const payload: CreateTaskPayload = {
            project_id: form.project_id,
            template_id: form.template_id,
            folder_id: form.folder_id,

            task_type:
                form.task_type.trim(),

            task_description:
                form.task_description.trim(),

            key_params:
                parsedKeyParams,

            levels:
                parsedLevels,

            start_date:
                form.start_date,

            end_date:
                form.end_date,

            assigned_by:
                form.assigned_by,

            assigned_to:
                form.assigned_to,
        };

        setLoading(true);

        try {
            let savedTask: Task;

            /* ------------------------------------------------
               UPDATE
            ------------------------------------------------ */

            if (isEdit && task) {
                const updatePayload:
                    UpdateTaskPayload = {
                    ...payload,

                    /*
                     * API requires status for update.
                     *
                     * Preserve the current status.
                     * If undefined, use Pending = 1.
                     */
                    status:
                        task.status ?? 1,
                };

                savedTask =
                    await updateTask(
                        task.task_id,
                        updatePayload
                    );
            }

            /* ------------------------------------------------
               CREATE
            ------------------------------------------------ */

            else {
                savedTask =
                    await createTask(
                        payload
                    );
            }

            /*
             * Notify parent.
             */
            onSuccess(savedTask);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : isEdit
                    ? "Failed to update task."
                    : "Failed to create task."
            );
        } finally {
            setLoading(false);
        }
    };

    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !loading
                ) {
                    onClose();
                }
            }}
        >
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isEdit
                                ? "Update Task"
                                : "Create Task"}
                        </h2>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {isEdit
                                ? "Update the task information below."
                                : "Enter the details to create a new task."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close task modal"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* =================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="min-h-0 overflow-y-auto"
                >
                    <div className="space-y-6 p-6">

                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {/* =================================================
                            TASK LOCATION
                        ================================================== */}

                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                Task Location
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                <NumberInput
                                    label="Project ID"
                                    value={
                                        form.project_id
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "project_id",
                                            value
                                        )
                                    }
                                    required
                                />

                                <NumberInput
                                    label="Template ID"
                                    value={
                                        form.template_id
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "template_id",
                                            value
                                        )
                                    }
                                    required
                                />

                                <NumberInput
                                    label="Folder ID"
                                    value={
                                        form.folder_id
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "folder_id",
                                            value
                                        )
                                    }
                                    required
                                />

                            </div>
                        </section>

                        {/* =================================================
                            TASK INFORMATION
                        ================================================== */}

                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                Task Information
                            </h3>

                            <div className="space-y-4">

                                <TextInput
                                    label="Task Type"
                                    value={
                                        form.task_type
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "task_type",
                                            value
                                        )
                                    }
                                    placeholder="e.g. Content Review"
                                    required
                                />

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Description
                                    </label>

                                    <textarea
                                        value={
                                            form.task_description
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            updateField(
                                                "task_description",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Describe the task..."
                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                    />
                                </div>

                            </div>
                        </section>

                        {/* =================================================
                            SCHEDULE
                        ================================================== */}

                        <section>
                            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                Schedule
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <TextInput
                                    label="Start Date"
                                    type="date"
                                    value={
                                        form.start_date
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "start_date",
                                            value
                                        )
                                    }
                                    required
                                />

                                <TextInput
                                    label="End Date"
                                    type="date"
                                    value={
                                        form.end_date
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "end_date",
                                            value
                                        )
                                    }
                                    required
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <NumberInput
                                    label="Assigned By"
                                    value={
                                        form.assigned_by
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "assigned_by",
                                            value
                                        )
                                    }
                                    required
                                />

                                <NumberInput
                                    label="Assigned To"
                                    value={
                                        form.assigned_to
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "assigned_to",
                                            value
                                        )
                                    }
                                    required
                                />

                            </div>
                        </section>

                        {/* =================================================
                            LEVELS
                        ================================================== */}

                        <section>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Levels
                            </label>

                            <input
                                type="text"
                                value={
                                    levelsInput
                                }
                                onChange={(
                                    event
                                ) =>
                                    setLevelsInput(
                                        event.target.value
                                    )
                                }
                                placeholder="Editor, Reviewer, Writer"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />

                            <p className="mt-1.5 text-xs text-gray-400">
                                Separate multiple levels with commas.
                            </p>
                        </section>

                        {/* =================================================
                            KEY PARAMETERS
                        ================================================== */}

                        <section>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Key Parameters
                            </label>

                            <textarea
                                value={
                                    keyParamsInput
                                }
                                onChange={(
                                    event
                                ) =>
                                    setKeyParamsInput(
                                        event.target.value
                                    )
                                }
                                rows={5}
                                placeholder={`{
  "priority": "high"
}`}
                                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-mono text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                            />

                            <p className="mt-1.5 text-xs text-gray-400">
                                Optional JSON object containing additional task parameters.
                            </p>
                        </section>

                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                        >
                            {loading && (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? isEdit
                                    ? "Updating..."
                                    : "Creating..."
                                : isEdit
                                ? "Update Task"
                                : "Create Task"}
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}

/* ============================================================
   TEXT INPUT
============================================================ */

interface TextInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

function TextInput({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    required = false,
}: TextInputProps) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                placeholder={placeholder}
                required={required}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
        </div>
    );
}

/* ============================================================
   NUMBER INPUT
============================================================ */

interface NumberInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    required?: boolean;
}

function NumberInput({
    label,
    value,
    onChange,
    required = false,
}: NumberInputProps) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            <input
                type="number"
                min="1"
                value={value || ""}
                onChange={(event) => {
                    const value =
                        event.target.value === ""
                            ? 0
                            : Number(
                                  event.target.value
                              );

                    onChange(value);
                }}
                required={required}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
        </div>
    );
}

export default TaskModal;
