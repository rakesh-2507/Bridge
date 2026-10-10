import { del, get, post, put } from "./http";

// ==============================
// Project Types
// ==============================

export interface Project {
  project_id: number;
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  start_date: string | null;
  end_date: string | null;
  status: number;
  created_date: string | null;
  updated_date: string | null;
  coordinator: number | null;
  is_project_manage: number;
  projecttype: number | null;
  member_ids?: number[];
  folders?: ProjectFolder[];
}

export interface ProjectFolder {
  pfid: number;
  projectid: number;
  fid: number;
  fname: string;
  fdesc: string;
  pid: number | null;
  tid: number;
  userid: number;
  createddate: string;
  updateddate: string | null;
  isActive: number;
  children: ProjectFolder[];
}

// ==============================
// Project Payload Types
// ==============================

export interface ProjectPayload {
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  coordinator: number;
  is_project_manage: number;
  projecttype: number;
  member_ids: number[];
}

export interface UpdateProjectPayload extends ProjectPayload {
  start_date: string;
  end_date: string;
}

// ==============================
// API Response Types
// ==============================

// GET /api/getprojects returns a direct array.
export type ProjectsResponse = Project[];

// GET /api/coordinator/{coordinator_id}/projects
// Retained in case this endpoint returns a wrapped response.
export interface CoordinatorProjectsResponse {
  projects: Project[];
  total: number;
}

// ==============================
// Get All Projects
// GET /api/getprojects
// ==============================

export function getProjects<T = ProjectsResponse>(): Promise<T> {
  return get<T>("/getprojects");
}

// ==============================
// Get Project By ID
// GET /api/getproject/{project_id}
// ==============================

export function getProject<T = Project>(
  projectId: string | number,
): Promise<T> {
  return get<T>(
    `/getproject/${encodeURIComponent(String(projectId))}`,
  );
}

// ==============================
// Get Coordinator Projects
// GET /api/coordinator/{coordinator_id}/projects
// ==============================

export function getCoordinatorProjects<
  T = CoordinatorProjectsResponse,
>(
  coordinatorId: string | number,
): Promise<T> {
  return get<T>(
    `/coordinator/${encodeURIComponent(String(coordinatorId))}/projects`,
  );
}

// ==============================
// Create Project
// POST /api/createproject
// ==============================

export function createProject<T = Project>(
  payload: ProjectPayload,
): Promise<T> {
  return post<T>("/createproject", payload);
}

// ==============================
// Update Project
// PUT /api/updateproject/{project_id}
// ==============================

export function updateProject<T = Project>(
  projectId: string | number,
  payload: UpdateProjectPayload,
): Promise<T> {
  return put<T>(
    `/updateproject/${encodeURIComponent(String(projectId))}`,
    payload,
  );
}

// ==============================
// Delete Project
// DELETE /api/deleteproject/{project_id}
// ==============================

export function deleteProject<T = string>(
  projectId: string | number,
): Promise<T> {
  return del<T>(
    `/deleteproject/${encodeURIComponent(String(projectId))}`,
  );
}
