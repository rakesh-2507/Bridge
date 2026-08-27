import { useState } from "react";
import WizardSteps from "./WizardSteps";
import TemplateStep from "./TemplateStep";
import FoldersStep from "./FoldersStep";
import RolesStep from "./RolesStep";

import { createProjectTemplate } from "../../api/projectTemplates";

import type {
  ProjectTemplateDetails,
  ProjectTemplateFolder,
  CreateProjectTemplatePayload,
  CreateProjectTemplateFolder,
} from "../../types/projectTemplate";

function TemplateWizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const [template, setTemplate] =
    useState<ProjectTemplateDetails>({
      name: "",
      description: "",
      project_type_id: 0,
    });

  const [folders, setFolders] = useState<
    ProjectTemplateFolder[]
  >([]);

  const [loading, setLoading] = useState(false);

  const buildApiFolders = (): CreateProjectTemplateFolder[] => {
    return folders.map((folder) => {
      let parentFolderIndex: number | null = null;

      if (folder.parentFolderId) {
        const index = folders.findIndex(
          (item) => item.id === folder.parentFolderId
        );

        parentFolderIndex =
          index >= 0 ? index : null;
      }

      return {
        name: folder.name,
        description: folder.description,
        parent_folder_index: parentFolderIndex,
        roles: folder.roles,
      };
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload: CreateProjectTemplatePayload = {
        project_template: template,
        folders: buildApiFolders(),
      };

      console.log(
        "Create Project Template Payload:",
        payload
      );

      await createProjectTemplate(payload);

      alert("Project template created successfully!");

      // Reset wizard
      setCurrentStep(1);

      setTemplate({
        name: "",
        description: "",
        project_type_id: 0,
      });

      setFolders([]);
    } catch (error) {
      console.error(
        "Failed to create project template:",
        error
      );

      alert(
        "Failed to create project template. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <WizardSteps currentStep={currentStep} />

          <div className="mt-8">
            {currentStep === 1 && (
              <TemplateStep
                data={template}
                onChange={setTemplate}
                onNext={() => setCurrentStep(2)}
              />
            )}

            {currentStep === 2 && (
              <FoldersStep
                folders={folders}
                setFolders={setFolders}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && (
              <RolesStep
                folders={folders}
                setFolders={setFolders}
                onBack={() => setCurrentStep(2)}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateWizard;