import { apiRequest } from "./client";
import type { CreateProjectTemplatePayload } from "../types/projectTemplate";

export const createProjectTemplate = async (
  data: CreateProjectTemplatePayload
) => {
  return apiRequest("/api/createprojecttemplate", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export interface CheckTemplateNameResponse {
  available: boolean;
  code?: string;
  message: string;
}

export const checkProjectTemplateName = async (
  name: string
): Promise<CheckTemplateNameResponse> => {
  return apiRequest(
    `/api/checkprojecttemplatename?name=${encodeURIComponent(name)}`,
    {
      method: "GET",
    }
  );
};