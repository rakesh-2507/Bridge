import { del, get, post, put } from "./http";

// Template
export interface Template {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
}

// Get templates response
export interface TemplatesResponse {
  templates: Template[];
  total: number;
}

// Create and update template payload
export interface TemplatePayload {
  name: string;
  name_desc: string;
  projecttype: number;
}

// Create template
export function createTemplate<T = Template>(
  payload: TemplatePayload,
): Promise<T> {
  return post<T>("/createtemplate", payload);
}

// Get all templates
export function getTemplates<T = TemplatesResponse>(): Promise<T> {
  return get<T>("/gettemplates");
}

// Get template by ID
export function getTemplate<T = Template>(
  tid: string | number,
): Promise<T> {
  return get<T>(
    `/gettemplate/${encodeURIComponent(String(tid))}`,
  );
}

// Update template
export function updateTemplate<T = Template>(
  tid: string | number,
  payload: TemplatePayload,
): Promise<T> {
  return put<T>(
    `/updatetemplate/${encodeURIComponent(String(tid))}`,
    payload,
  );
}

// Delete template
export function deleteTemplate<T = string>(
  tid: string | number,
): Promise<T> {
  return del<T>(
    `/deletetemplate/${encodeURIComponent(String(tid))}`,
  );
}

// Create complete template (existing endpoint preserved)
export function createTemplateComplete<T = unknown>(
  payload: TemplatePayload,
): Promise<T> {
  return post<T>("/createtemplatecomplete", payload);
}
