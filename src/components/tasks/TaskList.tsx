// src/components/tasks/TaskList.tsx

import type { Task } from "../../types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
    tasks: Task[];
    selectedTask: Task | null;
    onSelect: (task: Task) => void;
    title?: string;
}

function TaskList({
    tasks,
    selectedTask,
    onSelect,
    title = "Pending Tasks",
}: TaskListProps) {
    return (
        <div className="flex min-h-0 flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Cards */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {tasks.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center text-center">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                No tasks found
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                There are no tasks to display.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.task_id}
                                task={task}
                                selected={
                                    selectedTask?.task_id ===
                                    task.task_id
                                }
                                onClick={() =>
                                    onSelect(task)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskList;