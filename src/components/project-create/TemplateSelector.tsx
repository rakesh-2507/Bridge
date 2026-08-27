import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Search,
  FileText,
} from "lucide-react";

import type {
  ProjectTemplate,
} from "../../types/projectTemplate";

interface TemplateSelectorProps {
  templates: ProjectTemplate[];

  value: number | null;

  onChange: (
    template: ProjectTemplate | null
  ) => void;

  disabled?: boolean;

  error?: string;
}

export default function TemplateSelector({
  templates,
  value,
  onChange,
  disabled = false,
  error,
}: TemplateSelectorProps) {
  const [open, setOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const selectedTemplate =
    templates.find(
      (template) =>
        template.tid === value
    ) ?? null;

  const filteredTemplates =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return templates;
      }

      return templates.filter(
        (template) =>
          template.name
            .toLowerCase()
            .includes(query) ||
          template.name_desc
            ?.toLowerCase()
            .includes(query)
      );
    }, [templates, search]);

  function handleSelect(
    template: ProjectTemplate
  ) {
    onChange(template);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Project Template
        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      {/* Selected template */}

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
          rounded-lg
          border
          bg-white
          px-3
          py-2.5
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
        <div className="flex min-w-0 items-center gap-3">
          <FileText
            size={18}
            className="shrink-0 text-blue-600"
          />

          {selectedTemplate ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {selectedTemplate.name}
              </p>

              {selectedTemplate.name_desc && (
                <p className="truncate text-xs text-gray-500">
                  {
                    selectedTemplate.name_desc
                  }
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">
              Select a project template...
            </span>
          )}
        </div>

        <ChevronDown
          size={18}
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
                placeholder="Search templates..."
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

          {/* Templates */}

          <div className="max-h-72 overflow-y-auto p-1">
            {filteredTemplates.length ===
            0 ? (
              <div className="px-4 py-8 text-center">
                <FileText
                  size={28}
                  className="mx-auto text-gray-300"
                />

                <p className="mt-2 text-sm text-gray-500">
                  No templates found.
                </p>
              </div>
            ) : (
              filteredTemplates.map(
                (template) => {
                  const selected =
                    template.tid === value;

                  return (
                    <button
                      key={template.tid}
                      type="button"
                      onClick={() =>
                        handleSelect(
                          template
                        )
                      }
                      className={`
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-md
                        px-3
                        py-3
                        text-left
                        transition
                        ${
                          selected
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }
                      `}
                    >
                      {/* Icon */}

                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          ${
                            selected
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }
                        `}
                      >
                        <FileText
                          size={17}
                          className={
                            selected
                              ? "text-blue-600"
                              : "text-gray-500"
                          }
                        />
                      </span>

                      {/* Details */}

                      <span className="min-w-0 flex-1">
                        <span
                          className={`
                            block
                            truncate
                            text-sm
                            ${
                              selected
                                ? "font-semibold text-blue-900"
                                : "font-medium text-gray-800"
                            }
                          `}
                        >
                          {template.name}
                        </span>

                        {template.name_desc && (
                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {
                              template.name_desc
                            }
                          </span>
                        )}
                      </span>

                      {/* Selected */}

                      {selected && (
                        <Check
                          size={18}
                          className="shrink-0 text-blue-600"
                        />
                      )}
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