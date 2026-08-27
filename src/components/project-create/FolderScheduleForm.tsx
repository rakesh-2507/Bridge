import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  Loader2,
} from "lucide-react";

import type { FolderSchedule } from "../../types/projectTemplate";

import type { Folder } from "../../api/folders";

interface FolderScheduleFormProps {
  folders: Folder[];

  projectStartDate: string;
  projectEndDate: string;

  initialSchedules: FolderSchedule[];

  isLoading?: boolean;

  onBack: () => void;

  onSubmit: (
    schedules: FolderSchedule[]
  ) => void | Promise<void>;
}

interface FolderNode {
  folder: Folder;
  children: FolderNode[];
}

export default function FolderScheduleForm({
  folders,
  projectStartDate,
  projectEndDate,
  initialSchedules,
  isLoading = false,
  onBack,
  onSubmit,
}: FolderScheduleFormProps) {
  /*
   * Local schedule state.
   *
   * No useEffect synchronization is needed.
   * The wizard owns the latest schedules and passes
   * them again whenever this step is mounted/rendered.
   */
  const [schedules, setSchedules] =
    useState<FolderSchedule[]>(initialSchedules);

  const [errors, setErrors] = useState<
    Record<number, string>
  >({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
   * ----------------------------------------
   * Build folder tree
   * ----------------------------------------
   */

  const folderTree = useMemo(() => {
    const folderMap = new Map<number, FolderNode>();

    folders.forEach((folder) => {
      folderMap.set(folder.fid, {
        folder,
        children: [],
      });
    });

    const roots: FolderNode[] = [];

    folders.forEach((folder) => {
      const node = folderMap.get(folder.fid);

      if (!node) {
        return;
      }

      /*
       * Root folder
       */
      if (
        !folder.pid ||
        folder.pid === 0 ||
        !folderMap.has(folder.pid)
      ) {
        roots.push(node);
        return;
      }

      /*
       * Child folder
       */
      const parent = folderMap.get(folder.pid);

      if (parent) {
        parent.children.push(node);
      }
    });

    return roots;
  }, [folders]);

  /*
   * ----------------------------------------
   * Get folder schedule
   * ----------------------------------------
   */

  function getSchedule(
    folderId: number
  ): FolderSchedule {
    const existing = schedules.find(
      (schedule) =>
        schedule.folder_id === folderId
    );

    if (existing) {
      return existing;
    }

    return {
      folder_id: folderId,
      start_date: projectStartDate,
      end_date: projectEndDate,
    };
  }

  /*
   * ----------------------------------------
   * Update folder date
   * ----------------------------------------
   */

  function updateSchedule(
    folderId: number,
    field: "start_date" | "end_date",
    value: string
  ) {
    setSchedules((current) => {
      const existingIndex = current.findIndex(
        (schedule) =>
          schedule.folder_id === folderId
      );

      if (existingIndex === -1) {
        return [
          ...current,
          {
            folder_id: folderId,
            start_date:
              field === "start_date"
                ? value
                : projectStartDate,
            end_date:
              field === "end_date"
                ? value
                : projectEndDate,
          },
        ];
      }

      return current.map(
        (schedule, index) => {
          if (index !== existingIndex) {
            return schedule;
          }

          return {
            ...schedule,
            [field]: value,
          };
        }
      );
    });

    /*
     * Clear validation error when
     * the user changes the field.
     */
    setErrors((current) => {
      if (!current[folderId]) {
        return current;
      }

      const updated = {
        ...current,
      };

      delete updated[folderId];

      return updated;
    });
  }

  /*
   * ----------------------------------------
   * Validate schedules
   * ----------------------------------------
   */

  function validate(): boolean {
    const validationErrors: Record<
      number,
      string
    > = {};

    folders.forEach((folder) => {
      const schedule = getSchedule(folder.fid);

      if (!schedule.start_date) {
        validationErrors[folder.fid] =
          "Start date is required.";

        return;
      }

      if (!schedule.end_date) {
        validationErrors[folder.fid] =
          "End date is required.";

        return;
      }

      if (
        projectStartDate &&
        schedule.start_date < projectStartDate
      ) {
        validationErrors[folder.fid] =
          "Folder start date cannot be before the project start date.";

        return;
      }

      if (
        projectEndDate &&
        schedule.end_date > projectEndDate
      ) {
        validationErrors[folder.fid] =
          "Folder end date cannot be after the project end date.";

        return;
      }

      if (
        schedule.start_date >
        schedule.end_date
      ) {
        validationErrors[folder.fid] =
          "Start date cannot be after the end date.";
      }
    });

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors).length === 0
    );
  }

  /*
   * ----------------------------------------
   * Submit
   * ----------------------------------------
   */

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    const completeSchedules: FolderSchedule[] =
      folders.map((folder) =>
        getSchedule(folder.fid)
      );

    try {
      setIsSubmitting(true);

      await onSubmit(completeSchedules);
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * ----------------------------------------
   * Recursive folder renderer
   * ----------------------------------------
   */

  function renderFolder(
    node: FolderNode,
    level = 0
  ): React.ReactNode {
    const folder = node.folder;

    const schedule = getSchedule(folder.fid);

    const hasError =
      Boolean(errors[folder.fid]);

    return (
      <div key={folder.fid}>
        <div
          className={`
            rounded-xl border
            ${
              hasError
                ? "border-red-300"
                : "border-gray-200"
            }
            bg-white
          `}
        >
          {/* Folder header */}

          <div
            className="
              flex
              items-start
              gap-3
              border-b
              border-gray-100
              px-4
              py-4
            "
            style={{
              paddingLeft: `${16 + level * 28}px`,
            }}
          >
            <div className="mt-0.5 shrink-0">
              {node.children.length > 0 ? (
                <FolderOpen
                  size={20}
                  className="text-blue-600"
                />
              ) : (
                <FolderIcon
                  size={20}
                  className="text-blue-500"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {folder.fname}
              </p>

              {folder.fnamedesc && (
                <p className="mt-1 text-xs text-gray-500">
                  {folder.fnamedesc}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}

          <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-2">
            {/* Start date */}

            <div>
              <label
                htmlFor={`folder-start-${folder.fid}`}
                className="
                  mb-2
                  flex
                  items-center
                  gap-1.5
                  text-xs
                  font-medium
                  text-gray-700
                "
              >
                <CalendarDays size={14} />

                Start Date
              </label>

              <input
                id={`folder-start-${folder.fid}`}
                type="date"
                min={
                  projectStartDate || undefined
                }
                max={
                  projectEndDate || undefined
                }
                value={schedule.start_date}
                onChange={(event) =>
                  updateSchedule(
                    folder.fid,
                    "start_date",
                    event.target.value
                  )
                }
                className={`
                  w-full
                  rounded-lg
                  border
                  px-3
                  py-2.5
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:ring-2
                  ${
                    hasError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                  }
                `}
              />
            </div>

            {/* End date */}

            <div>
              <label
                htmlFor={`folder-end-${folder.fid}`}
                className="
                  mb-2
                  flex
                  items-center
                  gap-1.5
                  text-xs
                  font-medium
                  text-gray-700
                "
              >
                <CalendarDays size={14} />

                End Date
              </label>

              <input
                id={`folder-end-${folder.fid}`}
                type="date"
                min={
                  schedule.start_date ||
                  projectStartDate ||
                  undefined
                }
                max={
                  projectEndDate || undefined
                }
                value={schedule.end_date}
                onChange={(event) =>
                  updateSchedule(
                    folder.fid,
                    "end_date",
                    event.target.value
                  )
                }
                className={`
                  w-full
                  rounded-lg
                  border
                  px-3
                  py-2.5
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:ring-2
                  ${
                    hasError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                  }
                `}
              />
            </div>
          </div>

          {/* Error */}

          {hasError && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">
                {errors[folder.fid]}
              </p>
            </div>
          )}
        </div>

        {/* Children */}

        {node.children.length > 0 && (
          <div className="mt-3 space-y-3">
            {node.children.map((child) =>
              renderFolder(
                child,
                level + 1
              )
            )}
          </div>
        )}
      </div>
    );
  }

  /*
   * ----------------------------------------
   * Loading
   * ----------------------------------------
   */

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading template folders...
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * No folders
   * ----------------------------------------
   */

  if (folders.length === 0) {
    return (
      <>
        <div className="p-8">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm font-medium text-yellow-900">
              No folders found
            </p>

            <p className="mt-1 text-sm text-yellow-700">
              The selected template does not
              contain any folders.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-medium
              text-gray-700
              hover:bg-gray-50
            "
          >
            <ChevronLeft size={17} />

            Back
          </button>
        </div>
      </>
    );
  }

  /*
   * ----------------------------------------
   * Main
   * ----------------------------------------
   */

  return (
    <>
      <div className="p-6 sm:p-8">
        {/* Header */}

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <FolderIcon
              size={20}
              className="text-blue-600"
            />

            <h2 className="text-lg font-semibold text-gray-900">
              Folder Schedule
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Set the start and end dates for every
            folder and subfolder.
          </p>
        </div>

        {/* Project date range */}

        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div>
              <p className="text-xs font-medium text-blue-700">
                Project Start
              </p>

              <p className="mt-0.5 text-sm font-semibold text-blue-900">
                {projectStartDate || "Not set"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-blue-700">
                Project End
              </p>

              <p className="mt-0.5 text-sm font-semibold text-blue-900">
                {projectEndDate || "Not set"}
              </p>
            </div>

            <div className="text-xs text-blue-700">
              Folder dates must stay within this
              project period.
            </div>
          </div>
        </div>

        {/* Folder tree */}

        <div className="space-y-3">
          {folderTree.map((node) =>
            renderFolder(node)
          )}
        </div>
      </div>

      {/* Footer */}

      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            border
            border-gray-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-gray-700
            transition
            hover:bg-gray-50
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <ChevronLeft size={17} />

          Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              Loading...
            </>
          ) : (
            <>
              Next: Members & Roles

              <ChevronRight size={17} />
            </>
          )}
        </button>
      </div>
    </>
  );
}