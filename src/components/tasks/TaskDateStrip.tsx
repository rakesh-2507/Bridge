// src/components/tasks/TaskDateStrip.tsx

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface TaskDateStripProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
}

interface DateItem {
    date: Date;
    dateKey: string;
}

function TaskDateStrip({
    selectedDate,
    onDateChange,
}: TaskDateStripProps) {
    const dates = generateDates(
        selectedDate,
        30
    );

    const scrollByAmount = (
        amount: number
    ) => {
        const container =
            document.getElementById(
                "task-date-strip"
            );

        container?.scrollBy({
            left: amount,
            behavior: "smooth",
        });
    };

    return (
        <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center">
                {/* Previous */}
                <button
                    type="button"
                    onClick={() =>
                        scrollByAmount(-400)
                    }
                    className="flex h-20 w-12 shrink-0 items-center justify-center border-r border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    aria-label="Previous dates"
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Dates */}
                <div
                    id="task-date-strip"
                    className="flex min-w-0 flex-1 overflow-x-auto scrollbar-thin"
                >
                    {dates.map((item) => {
                        const isSelected =
                            item.dateKey ===
                            selectedDate;

                        const isToday =
                            item.dateKey ===
                            getDateKey(
                                new Date()
                            );

                        return (
                            <button
                                type="button"
                                key={
                                    item.dateKey
                                }
                                onClick={() =>
                                    onDateChange(
                                        item.dateKey
                                    )
                                }
                                className={[
                                    "flex h-20 min-w-[82px] shrink-0 flex-col items-center justify-center border-r border-gray-100 px-3 transition dark:border-gray-800",
                                    isSelected
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                                ].join(" ")}
                            >
                                <span className="text-[10px] font-medium uppercase">
                                    {item.date.toLocaleDateString(
                                        "en-US",
                                        {
                                            weekday:
                                                "short",
                                        }
                                    )}
                                </span>

                                <span className="mt-1 text-lg font-semibold">
                                    {item.date.getDate()}
                                </span>

                                <span className="text-[10px]">
                                    {item.date.toLocaleDateString(
                                        "en-US",
                                        {
                                            month:
                                                "short",
                                        }
                                    )}
                                </span>

                                {isToday && (
                                    <span
                                        className={[
                                            "mt-0.5 text-[9px] font-semibold",
                                            isSelected
                                                ? "text-gray-300 dark:text-gray-600"
                                                : "text-blue-600",
                                        ].join(
                                            " "
                                        )}
                                    >
                                        TODAY
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Next */}
                <button
                    type="button"
                    onClick={() =>
                        scrollByAmount(400)
                    }
                    className="flex h-20 w-12 shrink-0 items-center justify-center border-l border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                    aria-label="Next dates"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

/* ============================================================
   DATE HELPERS
============================================================ */

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

function generateDates(
    centerDate: string,
    totalDays: number
): DateItem[] {
    const center =
        new Date(
            `${centerDate}T00:00:00`
        );

    const half =
        Math.floor(totalDays / 2);

    const dates: DateItem[] = [];

    for (
        let index = -half;
        index <= half;
        index++
    ) {
        const date =
            new Date(center);

        date.setDate(
            center.getDate() + index
        );

        dates.push({
            date,
            dateKey: getDateKey(date),
        });
    }

    return dates;
}

export default TaskDateStrip;