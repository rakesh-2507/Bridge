// src/components/tasks/TaskCard.tsx

import {
    CalendarDays,
    Clock3,
    Folder,
} from "lucide-react";

import type { Task } from "../../types/task";
import TaskStatus from "./TaskStatus";

interface TaskCardProps {
    task: Task;
    selected?: boolean;
    onClick: () => void;
}

function TaskCard({
    task,
    selected = false,
    onClick,
}: TaskCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-xl border p-4 text-left transition",
                selected
                    ? "border-gray-900 bg-gray-50 shadow-sm dark:border-white dark:bg-gray-800"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700",
            ].join(" ")}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {task.task_type ||
                            "Untitled Task"}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                        Task #{task.task_id}
                    </p>
                </div>

                <TaskStatus
                    status={task.status}
                />
            </div>

            {/* Description */}
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                {task.task_description ||
                    "No description available."}
            </p>

            {/* Dates */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarDays size={14} />

                    <span>
                        {task.start_date ||
                            "N/A"}
                    </span>

                    <span>→</span>

                    <span>
                        {task.end_date ||
                            "N/A"}
                    </span>
                </div>
            </div>

            {/* Folder */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <Folder size={14} />

                <span>
                    Folder #{task.folder_id}
                </span>
            </div>

            {/* Time / status indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Clock3 size={13} />

                {task.status === 3
                    ? "Task completed"
                    : task.status === 2
                        ? "Currently in progress"
                        : "Waiting for completion"}
            </div>
        </button>
    );
}

export default TaskCard;