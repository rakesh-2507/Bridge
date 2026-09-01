import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface TaskDateStripProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    getTaskCount: (date: string) => number;
}

interface DateItem {
    date: Date;
    dateKey: string;
}

function TaskDateStrip({
    selectedDate,
    onDateChange,
    getTaskCount,
}: TaskDateStripProps) {


    const dates = generateDates(
        selectedDate,
        7
    );

    const moveDate = (
        direction: "prev" | "next"
    ) => {
        const current =
            new Date(
                `${selectedDate}T00:00:00`
            );

        current.setDate(
            current.getDate() +
            (direction === "next"
                ? 1
                : -1)
        );

        onDateChange(
            getDateKey(current)
        );
    };

    return (
        <div className="w-full min-w-0 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">

            <div className="flex w-full min-w-0 items-center">

                {/* Previous */}
                <button
                    type="button"
                    onClick={() =>
                        moveDate("prev")
                    }
                    className="flex h-20 w-12 shrink-0 items-center justify-center border-r border-gray-200 text-gray-500 transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
                    aria-label="Previous day"
                >
                    <ChevronLeft size={14} />
                </button>

                <div className="grid min-w-0 flex-1 grid-cols-7">
                    {dates.map((item) => {
                        const isSelected =
                            item.dateKey ===
                            selectedDate;



                        return (
                            <button
                                type="button"
                                key={item.dateKey}
                                onClick={() =>
                                    onDateChange(item.dateKey)
                                }
                                className={[
                                    "grid h-20 min-w-0 grid-cols-[auto_auto]",
                                    "items-center justify-center gap-8",
                                    "border-r border-gray-100 px-2 transition",
                                    "dark:border-gray-800",

                                    isSelected
                                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                                ].join(" ")}
                            >
                                {/* Day + Date */}
                                <div className="text-left leading-tight">
                                    <div className="text-[10px] font-medium uppercase">
                                        {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "short",
                                            }
                                        )}
                                    </div>

                                    <div className="mt-0.5 text-sm font-semibold">
                                        {item.date.toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                            }
                                        )}
                                        -
                                        {String(
                                            item.date.getDate()
                                        ).padStart(2, "0")}
                                    </div>
                                </div>

                                {/* Count */}
                                <span
                                    className={[
                                        "flex h-6 min-w-6 items-center justify-center",
                                        "rounded-full border px-1.5",
                                        "text-[10px] font-semibold",

                                        isSelected
                                            ? "border-white/30 bg-white/20 text-white dark:border-gray-900/20 dark:bg-gray-900/10 dark:text-gray-900"
                                            : "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
                                    ].join(" ")}
                                >
                                    {getTaskCount(item.dateKey)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() =>
                        moveDate("next")
                    }
                    className="flex h-20 w-12 shrink-0 items-center justify-center border-l border-gray-200 text-gray-500 transition hover:bg-gray-50 active:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
                    aria-label="Next day"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

/*
 * Generate 7 dates:
 *
 * -3
 * -2
 * -1
 *  0
 * +1
 * +2
 * +3
 */
function generateDates(
    centerDate: string,
    totalDays: number
): DateItem[] {
    const center =
        new Date(
            `${centerDate}T00:00:00`
        );

    const half =
        Math.floor(
            totalDays / 2
        );

    const dates: DateItem[] = [];

    for (
        let index = -half;
        index <= half;
        index++
    ) {
        const date =
            new Date(center);

        date.setDate(
            center.getDate() +
            index
        );

        dates.push({
            date,
            dateKey:
                getDateKey(date),
        });
    }

    return dates;
}

function getDateKey(
    date: Date
): string {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default TaskDateStrip;

