// src/components/tasks/TaskStatus.tsx

import {
    CheckCircle2,
    Clock3,
} from "lucide-react";

interface TaskStatusProps {
    status?: number;
}

function TaskStatus({
    status,
}: TaskStatusProps) {
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

export default TaskStatus;