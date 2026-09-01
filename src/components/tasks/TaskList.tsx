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
            <div className="relative z-50 shrink-0 border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Scroll Area */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                {tasks.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center p-5 text-center">
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
                    <div className="px-5 pb-5 pt-4">
                        <div className="flex flex-col gap-0">
                            {tasks.map((task, index) => {
                                const selected =
                                    selectedTask?.task_id ===
                                    task.task_id;

                                return (
                                    <div
                                        key={task.task_id}
                                        className="sticky"
                                        style={{
                                            top: `${index * 25}px`,
                                            zIndex: selected
                                                ? 1000
                                                : index + 1,
                                        }}
                                    >
                                        <div
                                            className={[
                                                "transition-all duration-200",
                                                index > 0
                                                    ? "-mt-3"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            <TaskCard
                                                task={task}
                                                selected={selected}
                                                color={
                                                    index % 2 === 0
                                                        ? "yellow"
                                                        : "purple"
                                                }
                                                onClick={() =>
                                                    onSelect(task)
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskList;
