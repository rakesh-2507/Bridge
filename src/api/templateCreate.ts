import { get, post, put, del } from "./http";

// -------------------- Request Types --------------------

export interface TemplateCreateChildFolder {
  fname: string;
  fnamedesc: string;
  children: TemplateCreateChildFolder[];
}

export interface TemplateCreateFolder {
  fname: string;
  fnamedesc: string;
  children: TemplateCreateChildFolder[];
}

export interface TemplateCompletePayload {
  name: string;
  name_desc: string;
  projecttype: number;
  folders: TemplateCreateFolder[];
  roles: string[];
}

// -------------------- Response Types --------------------

export interface CreatedTemplate {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
}

export interface CreatedTemplateFolder {
  fid?: number;
  fname: string;
  pid?: number;
  tid?: number;
  fnamedesc?: string;
  children?: (string | CreatedTemplateFolder)[];
}

export interface CreatedTemplateRole {
  roleid: number;
  rolename: string;
  tid: number;
}

export interface TemplateCompleteResponse {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
  folders: CreatedTemplateFolder[];
  roles: CreatedTemplateRole[];
  message?: string;
}

export interface TemplateListItem {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
}

// -------------------- API Functions --------------------

/**
 * Create a new template.
 * POST /api/template/create
 */
export function createTemplateComplete(
  payload: TemplateCompletePayload,
): Promise<TemplateCompleteResponse> {
  return post<TemplateCompleteResponse>("/template/create", payload);
}

/**
 * Get all templates.
 * GET /api/template/
 */
export function getTemplates(): Promise<TemplateListItem[]> {
  return get<TemplateListItem[]>("/template/");
}

/**
 * Get template details by ID.
 * GET /api/template/{tid}/details
 */
export function getTemplateDetails(
  tid: number,
): Promise<TemplateCompleteResponse> {
  return get<TemplateCompleteResponse>(`/template/${tid}/details`);
}

/**
 * Update an existing template.
 * PUT /api/template/{tid}
 */
export function updateTemplate(
  tid: number,
  payload: TemplateCompletePayload,
): Promise<TemplateCompleteResponse> {
  return put<TemplateCompleteResponse>(`/template/${tid}`, payload);
}

/**
 * Delete a template.
 * DELETE /api/template/{tid}
 */
export function deleteTemplate(tid: number): Promise<string> {
  return del<string>(`/template/${tid}`);
}
