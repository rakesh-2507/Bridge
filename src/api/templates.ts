import { apiRequest } from "./client";
import type {
  ProjectTemplate,
  ProjectTemplateListResponse,
} from "../types/projectTemplate";

export async function getTemplates() {
  return apiRequest<ProjectTemplateListResponse>(
    "/api/gettemplates"
  );
}

export async function getTemplate(tid: number) {
  return apiRequest<ProjectTemplate>(
    `/api/gettemplate/${tid}`
  );
}

export interface CreateTemplateData {
  name: string;
  name_desc: string;
  projecttype: number;
}

export async function createTemplate(
  data: CreateTemplateData
) {
  return apiRequest<ProjectTemplate>(
    "/api/createtemplate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateTemplate(
  tid: number,
  data: CreateTemplateData
) {
  return apiRequest<ProjectTemplate>(
    `/api/updatetemplate/${tid}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteTemplate(tid: number) {
  return apiRequest(
    `/api/deletetemplate/${tid}`,
    {
      method: "DELETE",
    }
  );
}