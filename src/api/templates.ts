import { apiRequest } from "./client";

export interface Template {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
}

export interface TemplatesResponse {
  templates: Template[];
  total: number;
}

export interface CreateTemplateData {
  name: string;
  name_desc: string;
  projecttype: number;
}

export async function getTemplates() {
  return apiRequest<TemplatesResponse>(
    "/api/gettemplates"
  );
}

export async function getTemplate(tid: number) {
  return apiRequest<Template>(
    `/api/gettemplate/${tid}`
  );
}

export async function createTemplate(
  data: CreateTemplateData
) {
  return apiRequest<Template>(
    "/api/createtemplate",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// Keep these for later CRUD work
export async function updateTemplate(
  tid: number,
  data: CreateTemplateData
) {
  return apiRequest<Template>(
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