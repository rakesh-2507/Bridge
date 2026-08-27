import { useState } from "react";
import { Check } from "lucide-react";

import ProjectDetailsForm from "./ProjectDetailsForm";
import FolderScheduleForm from "./FolderScheduleForm";
import FolderAssignmentForm from "./FolderAssignmentForm";

import {
  getTemplateFolders,
  getTemplateFolderRoles,
} from "../../api/folders";

import {
  createProjectFromTemplate,
} from "../../api/projects";

import type {
  CreateProjectFromTemplateDetails,
  FolderAssignment,
  FolderSchedule,
  CreateProjectFromTemplatePayload,
} from "../../types/projectTemplate";

import type {
  Folder,
  FolderRolesResponse,
} from "../../api/folders";

type Step = 1 | 2 | 3;

/* ----------------------------------------
 * Initial Project
 * ---------------------------------------- */

const initialProject: CreateProjectFromTemplateDetails = {
  template_id: 0,
  company_id: 0,

  project_name: "",
  project_description: "",

  start_date: "",
  end_date: "",

  member_ids: [],
  coordinator: 0,

  is_project_manage: 0,

  po: "",
  costhead: "",
  projectno: "",

  projecttype: 0,
  department: "",
};

export default function CreateProjectWizard() {
  /* ----------------------------------------
   * Step
   * ---------------------------------------- */

  const [step, setStep] =
    useState<Step>(1);

  /* ----------------------------------------
   * Project
   * ---------------------------------------- */

  const [project, setProject] =
    useState<CreateProjectFromTemplateDetails>(
      initialProject
    );

  /* ----------------------------------------
   * Template folders
   * ---------------------------------------- */

  const [folders, setFolders] =
    useState<Folder[]>([]);

  /* ----------------------------------------
   * Folder roles
   * ---------------------------------------- */

  const [folderRoles, setFolderRoles] =
    useState<FolderRolesResponse | null>(
      null
    );

  /* ----------------------------------------
   * Folder schedules
   * ---------------------------------------- */

  const [folderSchedules, setFolderSchedules] =
    useState<FolderSchedule[]>([]);

  /* ----------------------------------------
   * Folder assignments
   * ---------------------------------------- */

  const [folderAssignments, setFolderAssignments] =
    useState<FolderAssignment[]>([]);

  /* ----------------------------------------
   * Loading
   * ---------------------------------------- */

  const [isLoadingFolders, setIsLoadingFolders] =
    useState(false);

  const [isLoadingRoles, setIsLoadingRoles] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* ----------------------------------------
   * Error
   * ---------------------------------------- */

  const [error, setError] =
    useState<string | null>(null);

  /* ========================================
   * STEP 1
   * Project Details
   * ======================================== */

  const handleProjectSubmit = async (
    data: CreateProjectFromTemplateDetails
  ) => {
    setError(null);

    /*
     * Save project details.
     */

    setProject(data);

    /*
     * Load folders for selected template.
     */

    try {
      setIsLoadingFolders(true);

      const response =
        await getTemplateFolders(
          data.template_id
        );

      setFolders(response.folders);

      /*
       * Initialize schedule
       * for every folder.
       */

      const schedules: FolderSchedule[] =
        response.folders.map(
          (folder) => ({
            folder_id: folder.fid,
            start_date: "",
            end_date: "",
          })
        );

      setFolderSchedules(schedules);

      /*
       * Move to Step 2.
       */

      setStep(2);
    } catch (err) {
      console.error(
        "Failed to load template folders:",
        err
      );

      setError(
        "Unable to load the folders for the selected template."
      );
    } finally {
      setIsLoadingFolders(false);
    }
  };

  /* ========================================
   * STEP 2
   * Folder Schedule
   * ======================================== */

  const handleFolderScheduleSubmit = async (
    schedules: FolderSchedule[]
  ) => {
    setError(null);

    setFolderSchedules(schedules);

    try {
      setIsLoadingRoles(true);

      /*
       * Load roles configured for
       * the selected template.
       */

      const response =
        await getTemplateFolderRoles(
          project.template_id
        );

      setFolderRoles(response);

      /*
       * Create initial folder assignments.
       *
       * Dates are copied from Step 2.
       */

      const assignments: FolderAssignment[] =
        schedules.map(
          (schedule) => ({
            folder_id:
              schedule.folder_id,

            start_date:
              schedule.start_date,

            end_date:
              schedule.end_date,

            role_assignments: [],
          })
        );

      setFolderAssignments(
        assignments
      );

      /*
       * Move to Step 3.
       */

      setStep(3);
    } catch (err) {
      console.error(
        "Failed to load folder roles:",
        err
      );

      setError(
        "Unable to load the roles for the selected template."
      );
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /* ========================================
   * STEP 3
   * Create Project
   * ======================================== */

  const handleCreateProject = async (
    assignments: FolderAssignment[]
  ) => {
    setError(null);

    setFolderAssignments(assignments);

    /*
     * Final API payload.
     */

    const payload: CreateProjectFromTemplatePayload =
    {
      project,
      folder_assignments:
        assignments,
    };

    try {
      setIsSubmitting(true);

      await createProjectFromTemplate(
        payload
      );

      console.log(
        "Project created successfully"
      );

      alert(
        "Project created successfully!"
      );

      /*
       * Later:
       *
       * navigate("/projects");
       */

    } catch (err) {
      console.error(
        "Failed to create project:",
        err
      );

      setError(
        "Unable to create the project. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ========================================
   * BACK
   * ======================================== */

  const handleBack = () => {
    setError(null);

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
    }
  };

  /* ========================================
   * STEP INDICATOR
   * ======================================== */

  const steps = [
    {
      number: 1,
      title: "Project Details",
    },
    {
      number: 2,
      title: "Folder Schedule",
    },
    {
      number: 3,
      title: "Members & Roles",
    },
  ];

  /* ========================================
   * RENDER
   * ======================================== */

  return (
    <div className="mx-auto w-full max-w-6xl">

      {/* ------------------------------------
          Header
      ------------------------------------ */}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create Project
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a project from an existing
          template.
        </p>
      </div>

      {/* ------------------------------------
          Step Indicator
      ------------------------------------ */}

      <div className="mb-8">
        <div className="flex items-center">

          {steps.map(
            (item, index) => {
              const completed =
                step > item.number;

              const active =
                step === item.number;

              return (
                <div
                  key={item.number}
                  className="flex flex-1 items-center"
                >

                  {/* Step */}

                  <div className="flex items-center gap-3">

                    <div
                      className={`
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        border
                        text-sm
                        font-medium
                        ${completed
                          ? "border-green-600 bg-green-600 text-white"
                          : active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white text-gray-500"
                        }
                      `}
                    >
                      {completed ? (
                        <Check size={18} />
                      ) : (
                        item.number
                      )}
                    </div>

                    <div className="hidden sm:block">
                      <p
                        className={`
                          text-sm
                          font-medium
                          ${active
                            ? "text-gray-900"
                            : "text-gray-500"
                          }
                        `}
                      >
                        {item.title}
                      </p>
                    </div>

                  </div>

                  {/* Connector */}

                  {index <
                    steps.length - 1 && (
                      <div
                        className={`
                        mx-4
                        h-px
                        flex-1
                        ${step >
                            item.number
                            ? "bg-green-600"
                            : "bg-gray-200"
                          }
                      `}
                      />
                    )}

                </div>
              );
            }
          )}

        </div>
      </div>

      {/* ------------------------------------
          Error
      ------------------------------------ */}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ------------------------------------
          Form Container
      ------------------------------------ */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* ==================================
            STEP 1
        ================================== */}

        {step === 1 && (
          <ProjectDetailsForm
            initialData={project}
            onSubmit={
              handleProjectSubmit
            }
          />
        )}

        {/* ==================================
            STEP 2
        ================================== */}

        {step === 2 && (
          <FolderScheduleForm
            folders={folders}
            projectStartDate={
              project.start_date
            }
            projectEndDate={
              project.end_date
            }
            initialSchedules={
              folderSchedules
            }
            isLoading={
              isLoadingFolders
            }
            onBack={handleBack}
            onSubmit={
              handleFolderScheduleSubmit
            }
          />
        )}

        {/* ==================================
            STEP 3
        ================================== */}

        {step === 3 && (
          <FolderAssignmentForm
            folders={folders}
            folderRoles={folderRoles}
            schedules={folderSchedules}
            initialAssignments={
              folderAssignments
            }
            isLoading={
              isLoadingRoles
            }
            isSubmitting={
              isSubmitting
            }
            onBack={handleBack}
            onSubmit={
              handleCreateProject
            }
          />
        )}

      </div>
    </div>
  );
}