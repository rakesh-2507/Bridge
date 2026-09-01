import {
    CalendarDays,
    Clock3,
    Folder,
} from "lucide-react";

import type { Task } from "../../types/task";
import TaskStatus from "./TaskStatus";

type TaskCardColor =
    | "yellow"
    | "purple";

interface TaskCardProps {
    task: Task;
    selected?: boolean;
    color?: TaskCardColor;
    onClick: () => void;
}

function TaskCard({
    task,
    selected = false,
    color = "yellow",
    onClick,
}: TaskCardProps) {
    const colorClasses: Record<
        TaskCardColor,
        string
    > = {
        yellow:
            "border-yellow-300 bg-yellow-500",

        purple:
            "border-purple-300 bg-purple-500",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full rounded-xl border p-4 text-left transition-all duration-200",
                colorClasses[color],

                selected
                    ? "shadow-lg ring-2 ring-gray-900/20"
                    : "hover:-translate-y-0.5 hover:shadow-md",
            ].join(" ")}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">
                        {task.task_type ||
                            "Untitled Task"}
                    </h3>

                    <p className="mt-1 text-xs text-white/70">
                        Task #{task.task_id}
                    </p>
                </div>

                <TaskStatus
                    status={task.status}
                />
            </div>

            {/* Description */}
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/80">
                {task.task_description ||
                    "No description available."}
            </p>

            {/* Dates */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-xs text-white/80">
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
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
                <Folder size={14} />

                <span>
                    Folder #{task.folder_id}
                </span>
            </div>

            {/* Time / status indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
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
