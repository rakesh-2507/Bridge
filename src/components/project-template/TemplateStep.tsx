import { useEffect, useState } from "react";

import type {
  ProjectTemplateDetails,
  ProjectType,
} from "../../types/projectTemplate";

import {
  checkProjectTemplateName,
} from "../../api/projectTemplates";

import {
  getProjectTypes,
  createProjectType,
} from "../../api/projectTypes";

interface TemplateStepProps {
  data: ProjectTemplateDetails;
  onChange: (data: ProjectTemplateDetails) => void;
  onNext: () => void;
}

type ValidationStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid";

function TemplateStep({
  data,
  onChange,
  onNext,
}: TemplateStepProps) {
  /* =====================================================
     TEMPLATE NAME
  ===================================================== */

  const [nameStatus, setNameStatus] =
    useState<ValidationStatus>("idle");

  const [nameError, setNameError] =
    useState("");

  const [validatedName, setValidatedName] =
    useState("");

  /* =====================================================
     PROJECT TYPES
  ===================================================== */

  const [projectTypes, setProjectTypes] =
    useState<ProjectType[]>([]);

  const [loadingProjectTypes, setLoadingProjectTypes] =
    useState(true);

  const [projectTypeLoadError, setProjectTypeLoadError] =
    useState("");

  /* =====================================================
     CREATE PROJECT TYPE
  ===================================================== */

  const [showAddType, setShowAddType] =
    useState(false);

  const [newProjectType, setNewProjectType] =
    useState("");

  const [projectTypeStatus, setProjectTypeStatus] =
    useState<ValidationStatus>("idle");

  const [createTypeError, setCreateTypeError] =
    useState("");

  const [validatedProjectType, setValidatedProjectType] =
    useState("");

  const [creatingProjectType, setCreatingProjectType] =
    useState(false);

  /* =====================================================
     LOAD PROJECT TYPES
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadProjectTypes = async () => {
      try {
        const response =
          await getProjectTypes();

        if (!cancelled) {
          setProjectTypes(
            response.projecttypes
          );
        }
      } catch (error) {
        console.error(
          "Failed to load project types:",
          error
        );

        if (!cancelled) {
          setProjectTypeLoadError(
            "Unable to load project types."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjectTypes(false);
        }
      }
    };

    loadProjectTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     TEMPLATE NAME VALIDATION
     
     Backend:
     /api/checkprojecttemplatename?name=...
     
     Validation happens after 500ms.
  ===================================================== */

  useEffect(() => {
    const name =
      data.name.trim();

    /*
     * Don't synchronously reset state here.
     *
     * The UI derives the empty state directly
     * from data.name.
     */
    if (!name) {
      return;
    }

    const timer = setTimeout(
      async () => {
        try {
          setNameStatus("checking");
          setNameError("");

          const response =
            await checkProjectTemplateName(
              name
            );

          /*
           * Ignore old API response if the
           * user has already changed the name.
           */
          if (
            name !== data.name.trim()
          ) {
            return;
          }

          if (!response.available) {
            setNameStatus("invalid");

            setNameError(
              response.message ||
                "Project template name already exists."
            );

            setValidatedName("");
          } else {
            setNameStatus("valid");

            setNameError("");

            setValidatedName(name);
          }
        } catch (error) {
          console.error(
            "Failed to validate template name:",
            error
          );

          if (
            name === data.name.trim()
          ) {
            setNameStatus("invalid");

            setNameError(
              "Unable to validate template name. Please try again."
            );

            setValidatedName("");
          }
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }, [data.name]);

  /* =====================================================
     PROJECT TYPE DUPLICATE VALIDATION
     
     Uses GET /api/getprojecttypes
     
     No hardcoded project types.
     
     Validation happens after 500ms.
  ===================================================== */

  useEffect(() => {
    const typeName =
      newProjectType.trim();

    /*
     * Don't synchronously reset state here.
     *
     * Empty state is derived from newProjectType.
     */
    if (!typeName) {
      return;
    }

    const timer = setTimeout(
      () => {
        const duplicate =
          projectTypes.some(
            (type) =>
              type.projecttype
                .trim()
                .toLowerCase() ===
              typeName.toLowerCase()
          );

        /*
         * Make sure this validation result
         * still belongs to the current input.
         */
        if (
          typeName !==
          newProjectType.trim()
        ) {
          return;
        }

        if (duplicate) {
          setProjectTypeStatus(
            "invalid"
          );

          setCreateTypeError(
            "This project type already exists. Please select it from the dropdown."
          );

          setValidatedProjectType("");
        } else {
          setProjectTypeStatus(
            "valid"
          );

          setCreateTypeError("");

          setValidatedProjectType(
            typeName
          );
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
    };
  }, [
    newProjectType,
    projectTypes,
  ]);

  /* =====================================================
     TEMPLATE FIELD CHANGE
  ===================================================== */

  const handleChange = (
    field: keyof ProjectTemplateDetails,
    value: string | number
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  /* =====================================================
     PROJECT TYPE INPUT CHANGE
  ===================================================== */

  const handleNewProjectTypeChange = (
    value: string
  ) => {
    setNewProjectType(value);

    /*
     * We intentionally don't reset validation
     * synchronously in an effect.
     *
     * The current input itself determines
     * whether the previous validation is still valid.
     */
  };

  /* =====================================================
     CREATE PROJECT TYPE
  ===================================================== */

  const handleCreateProjectType =
    async () => {
      const typeName =
        newProjectType.trim();

      if (!typeName) {
        setCreateTypeError(
          "Project type name is required."
        );

        return;
      }

      /*
       * Don't submit while validation
       * is still running.
       */
      if (
        projectTypeStatus ===
        "checking"
      ) {
        return;
      }

      /*
       * The current value must have
       * successfully passed validation.
       */
      if (
        projectTypeStatus !==
        "valid"
      ) {
        return;
      }

      if (
        validatedProjectType !==
        typeName
      ) {
        return;
      }

      try {
        setCreatingProjectType(true);

        setCreateTypeError("");

        /*
         * Backend creates the ID.
         */
        const created =
          await createProjectType({
            projecttype: typeName,
          });

        /*
         * Add newly created project
         * type to the dropdown.
         */
        setProjectTypes((prev) => [
          ...prev,
          created,
        ]);

        /*
         * Automatically select the
         * newly created project type.
         */
        handleChange(
          "project_type_id",
          created.ptypeid
        );

        /*
         * Close the add form.
         */
        setShowAddType(false);

        /*
         * Clear the add form.
         */
        setNewProjectType("");

        setValidatedProjectType("");

        setCreateTypeError("");

        setProjectTypeStatus(
          "idle"
        );
      } catch (error) {
        console.error(
          "Failed to create project type:",
          error
        );

        /*
         * If backend rejects the request
         * because another user created the
         * same type, show a useful message.
         */
        if (
          error instanceof Error
        ) {
          setCreateTypeError(
            error.message ||
              "Unable to create project type."
          );
        } else {
          setCreateTypeError(
            "Unable to create project type. Please try again."
          );
        }

        setProjectTypeStatus(
          "invalid"
        );
      } finally {
        setCreatingProjectType(false);
      }
    };

  /* =====================================================
     CLOSE ADD PROJECT TYPE
  ===================================================== */

  const handleCancelAddType = () => {
    if (creatingProjectType) {
      return;
    }

    setShowAddType(false);
    setNewProjectType("");
    setCreateTypeError("");
    setValidatedProjectType("");
    setProjectTypeStatus("idle");
  };

  /* =====================================================
     TEMPLATE NAME STATUS
  ===================================================== */

  const templateName =
    data.name.trim();

  const isTemplateNameEmpty =
    templateName === "";

  const isNameChecking =
    !isTemplateNameEmpty &&
    nameStatus === "checking";

  const isNameValid =
    !isTemplateNameEmpty &&
    nameStatus === "valid" &&
    validatedName ===
      templateName &&
    !nameError;

  /* =====================================================
     PROJECT TYPE STATUS
  ===================================================== */

  const projectTypeName =
    newProjectType.trim();

  const isProjectTypeEmpty =
    projectTypeName === "";

  /*
   * The current input is different from
   * the last validated value, therefore
   * validation is still pending.
   */
  const isProjectTypeChecking =
    !isProjectTypeEmpty &&
    projectTypeStatus ===
      "checking";

  const isProjectTypeValid =
    !isProjectTypeEmpty &&
    projectTypeStatus ===
      "valid" &&
    validatedProjectType ===
      projectTypeName &&
    !createTypeError;

  /* =====================================================
     STEP VALIDATION
  ===================================================== */

  const canGoNext =
    isNameValid &&
    Boolean(data.project_type_id);

  const canAddProjectType =
    isProjectTypeValid &&
    !creatingProjectType;

  /* =====================================================
     SUBMIT STEP
  ===================================================== */

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    /* Template name */

    if (!templateName) {
      setNameError(
        "Template name is required."
      );

      setNameStatus("invalid");

      return;
    }

    /* Template name still checking */

    if (isNameChecking) {
      return;
    }

    /* Template name wasn't validated */

    if (!isNameValid) {
      return;
    }

    /* Project type */

    if (!data.project_type_id) {
      setProjectTypeLoadError(
        "Please select a project type."
      );

      return;
    }

    onNext();
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ==========================================
          HEADER
      ========================================== */}

      <div>
        <h2 className="text-xl font-semibold">
          Create Project Template
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Enter the basic details for
          your project template.
        </p>
      </div>

      {/* ==========================================
          TEMPLATE NAME
      ========================================== */}

      <div>
        <label className="block text-sm font-medium mb-2">
          Template Name
        </label>

        <input
          type="text"
          value={data.name}
          onChange={(e) =>
            handleChange(
              "name",
              e.target.value
            )
          }
          placeholder="Enter template name"
          className={`w-full rounded-lg px-4 py-2.5 border ${
            nameError
              ? "border-red-500"
              : "border-gray-300"
          }`}
        />

        {/* Checking */}

        {isNameChecking && (
          <p className="text-sm text-gray-500 mt-2">
            Checking template name...
          </p>
        )}

        {/* Error */}

        {!isNameChecking &&
          nameError && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">
                ❌ {nameError}
              </p>
            </div>
          )}

        {/* Success */}

        {isNameValid && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Template name is available
          </p>
        )}
      </div>

      {/* ==========================================
          DESCRIPTION
      ========================================== */}

      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>

        <textarea
          value={data.description}
          onChange={(e) =>
            handleChange(
              "description",
              e.target.value
            )
          }
          placeholder="Enter template description"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        />
      </div>

      {/* ==========================================
          PROJECT TYPE
      ========================================== */}

      <div>
        <label className="block text-sm font-medium mb-2">
          Project Type
        </label>

        <select
          value={
            data.project_type_id || ""
          }
          onChange={(e) => {
            handleChange(
              "project_type_id",
              Number(e.target.value)
            );

            setProjectTypeLoadError("");
          }}
          disabled={
            loadingProjectTypes
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
        >
          <option value="">
            {loadingProjectTypes
              ? "Loading project types..."
              : "Select project type"}
          </option>

          {projectTypes.map(
            (type) => (
              <option
                key={type.ptypeid}
                value={type.ptypeid}
              >
                {type.projecttype}{" "}
                (ID: {type.ptypeid})
              </option>
            )
          )}
        </select>

        {/* Loading error / required error */}

        {projectTypeLoadError && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              ❌{" "}
              {projectTypeLoadError}
            </p>
          </div>
        )}

        {/* ========================================
            ADD PROJECT TYPE LINK
        ======================================== */}

        {!showAddType && (
          <button
            type="button"
            onClick={() => {
              setShowAddType(true);
              setNewProjectType("");
              setCreateTypeError("");
              setValidatedProjectType("");
              setProjectTypeStatus(
                "idle"
              );
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Project Type
          </button>
        )}

        {/* ========================================
            ADD PROJECT TYPE FORM
        ======================================== */}

        {showAddType && (
          <div className="mt-4 border rounded-xl p-5 bg-gray-50">
            <h3 className="font-semibold mb-3">
              Add New Project Type
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={
                  newProjectType
                }
                onChange={(e) =>
                  handleNewProjectTypeChange(
                    e.target.value
                  )
                }
                placeholder="Enter project type"
                disabled={
                  creatingProjectType
                }
                className={`flex-1 border rounded-lg px-3 py-2 ${
                  createTypeError
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />

              <button
                type="button"
                onClick={
                  handleCreateProjectType
                }
                disabled={
                  !canAddProjectType
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingProjectType
                  ? "Adding..."
                  : "Add"}
              </button>

              <button
                type="button"
                onClick={
                  handleCancelAddType
                }
                disabled={
                  creatingProjectType
                }
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
            </div>

            {/* Checking */}

            {isProjectTypeChecking && (
              <p className="text-sm text-gray-500 mt-2">
                Checking project type...
              </p>
            )}

            {/* Duplicate / error */}

            {!isProjectTypeChecking &&
              createTypeError && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">
                    ❌{" "}
                    {createTypeError}
                  </p>
                </div>
              )}

            {/* Available */}

            {isProjectTypeValid && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Project type name is
                available
              </p>
            )}
          </div>
        )}
      </div>

      {/* ==========================================
          NEXT
      ========================================== */}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!canGoNext}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Folders →
        </button>
      </div>
    </form>
  );
}

export default TemplateStep;