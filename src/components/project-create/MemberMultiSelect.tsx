import { useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Search,
  User,
  X,
} from "lucide-react";

export interface MemberOption {
  id: number;
  name: string;
  username?: string;
}

interface MemberMultiSelectProps {
  members: MemberOption[];

  value: number[];

  onChange: (
    memberIds: number[]
  ) => void;

  placeholder?: string;

  disabled?: boolean;

  error?: string;

  maxHeight?: string;
}

export default function MemberMultiSelect({
  members,
  value,
  onChange,
  placeholder = "Select members...",
  disabled = false,
  error,
  maxHeight = "max-h-64",
}: MemberMultiSelectProps) {
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const selectedMembers =
    useMemo(() => {
      return members.filter((member) =>
        value.includes(member.id)
      );
    }, [members, value]);

  const filteredMembers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return members;
      }

      return members.filter(
        (member) =>
          member.name
            .toLowerCase()
            .includes(query) ||
          member.username
            ?.toLowerCase()
            .includes(query)
      );
    }, [members, search]);

  /*
   * ----------------------------------------
   * Toggle member
   * ----------------------------------------
   */

  function toggleMember(id: number) {
    if (value.includes(id)) {
      onChange(
        value.filter(
          (memberId) => memberId !== id
        )
      );
    } else {
      onChange([
        ...value,
        id,
      ]);
    }
  }

  /*
   * ----------------------------------------
   * Remove member
   * ----------------------------------------
   */

  function removeMember(id: number) {
    onChange(
      value.filter(
        (memberId) => memberId !== id
      )
    );
  }

  /*
   * ----------------------------------------
   * Select all filtered
   * ----------------------------------------
   */

  function selectAllFiltered() {
    const filteredIds =
      filteredMembers.map(
        (member) => member.id
      );

    const merged = Array.from(
      new Set([
        ...value,
        ...filteredIds,
      ])
    );

    onChange(merged);
  }

  /*
   * ----------------------------------------
   * Clear
   * ----------------------------------------
   */

  function clearAll() {
    onChange([]);
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Selected members / trigger */}

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen((current) => !current)
        }
        className={`
          flex
          min-h-[46px]
          w-full
          items-center
          justify-between
          gap-3
          rounded-lg
          border
          bg-white
          px-3
          py-2
          text-left
          transition
          ${
            error
              ? "border-red-400"
              : "border-gray-300"
          }
          ${
            disabled
              ? "cursor-not-allowed bg-gray-50 opacity-60"
              : "hover:border-gray-400"
          }
        `}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedMembers.length ===
          0 ? (
            <span className="py-1 text-sm text-gray-400">
              {placeholder}
            </span>
          ) : (
            selectedMembers.map(
              (member) => (
                <span
                  key={member.id}
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    bg-blue-50
                    px-2.5
                    py-1
                    text-xs
                    font-medium
                    text-blue-700
                  "
                >
                  <span className="max-w-[140px] truncate">
                    {member.name}
                  </span>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeMember(
                        member.id
                      );
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        event.stopPropagation();
                        removeMember(
                          member.id
                        );
                      }
                    }}
                    className="
                      cursor-pointer
                      rounded-full
                      p-0.5
                      hover:bg-blue-100
                    "
                  >
                    <X size={12} />
                  </span>
                </span>
              )
            )
          )}
        </div>

        <ChevronDown
          size={17}
          className={`
            shrink-0
            text-gray-400
            transition-transform
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {/* Error */}

      {error && (
        <p className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Dropdown */}

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">

          {/* Search */}

          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search
                size={16}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="text"
                autoFocus
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onClick={(event) =>
                  event.stopPropagation()
                }
                placeholder="Search members..."
                className="
                  w-full
                  rounded-md
                  border
                  border-gray-200
                  py-2.5
                  pl-9
                  pr-3
                  text-sm
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>
          </div>

          {/* Actions */}

          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="
                text-xs
                font-medium
                text-blue-600
                hover:text-blue-700
              "
            >
              Select all
            </button>

            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="
                  text-xs
                  font-medium
                  text-gray-500
                  hover:text-gray-700
                "
              >
                Clear
              </button>
            )}
          </div>

          {/* Members */}

          <div
            className={`${maxHeight} overflow-y-auto p-1`}
          >
            {filteredMembers.length ===
            0 ? (
              <div className="px-4 py-8 text-center">
                <User
                  size={28}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-2 text-sm text-gray-500">
                  No members found.
                </p>
              </div>
            ) : (
              filteredMembers.map(
                (member) => {
                  const selected =
                    value.includes(
                      member.id
                    );

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        toggleMember(
                          member.id
                        )
                      }
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-md
                        px-3
                        py-2.5
                        text-left
                        hover:bg-gray-50
                      "
                    >
                      {/* Checkbox */}

                      <span
                        className={`
                          flex
                          h-4
                          w-4
                          shrink-0
                          items-center
                          justify-center
                          rounded
                          border
                          ${
                            selected
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300 bg-white"
                          }
                        `}
                      >
                        {selected && (
                          <Check
                            size={12}
                            className="text-white"
                          />
                        )}
                      </span>

                      {/* Avatar */}

                      <span
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-gray-100
                          text-xs
                          font-medium
                          text-gray-600
                        "
                      >
                        {member.name
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      {/* Name */}

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {member.name}
                        </span>

                        {member.username && (
                          <span className="block truncate text-xs text-gray-400">
                            {
                              member.username
                            }
                          </span>
                        )}
                      </span>
                    </button>
                  );
                }
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}