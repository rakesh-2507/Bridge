import { apiRequest } from "./client";

export interface Project {
  project_id: number;
  tid?: number;
  cid?: number;
  member_id?: number;
  projectname?: string;
  projectdesc?: string;
  status?: number;
  created_by?: string;
  updated_by?: string;
  coordinator?: number;
  is_project_manage?: number;
  po?: string;
  costhead?: string;
  projectno?: string;
  projecttype?: number;
  department?: string;
  [key: string]: unknown;
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
}

/**
 * Payload used when creating a project.
 */
export interface CreateProjectData {
  tid: number;
  cid: number;
  member_id?: number;
  projectname: string;
  projectdesc?: string;
  coordinator?: number;
  is_project_manage?: number;
  po?: string;
  costhead?: string;
  projectno?: string;
  projecttype?: number;
  department?: string;
}

/**
 * Get all projects
 */
export async function getProjects() {
  return apiRequest<ProjectsResponse>("/api/getprojects");
}

/**
 * Get single project
 */
export async function getProject(projectId: number) {
  return apiRequest<Project>(
    `/api/getproject/${projectId}`
  );
}

/**
 * Create project
 */
export async function createProject(
  data: CreateProjectData
) {
  return apiRequest<Project>(
    "/api/createproject",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update project
 */
export async function updateProject(
  projectId: number,
  data: Partial<CreateProjectData>
) {
  return apiRequest<Project>(
    `/api/updateproject/${projectId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete project
 */
export async function deleteProject(
  projectId: number
) {
  return apiRequest(
    `/api/deleteproject/${projectId}`,
    {
      method: "DELETE",
    }
  );
}