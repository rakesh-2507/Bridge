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
  members?: ProjectMember[];

  folders?: ProjectFolder[];
  available_roles?: ProjectRole[];
}

export interface ProjectMember {
  memberid: number;
  assigned_role_ids: number[];
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
  start_date?: string | null;
  end_date?: string | null;
}

// GET /api/getprojects
export type ProjectsResponse = Project[];

// GET /api/getproject/{project_id}
export type ProjectDetailsResponse = Project;

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
  return get<T>(`/getproject/${encodeURIComponent(String(projectId))}`);
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

export function updateProject<T = string>(
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
  return del<T>(`/deleteproject/${encodeURIComponent(String(projectId))}`);
}

// ==============================
// Coordinator API
// GET /api/coordinator/assignedprojects
// ==============================

export interface CoordinatorProjectsData {
  projects: Project[];
  total?: number;
}

export type CoordinatorProjectsResponse = Project[] | CoordinatorProjectsData;

export function getCoordinatorProjects(): Promise<CoordinatorProjectsResponse> {
  return get<CoordinatorProjectsResponse>("/coordinator/assignedprojects");
}

export interface ProjectAssignment {
  member_ids: number[];
  rollid: number;
}

export interface CoordinatorProjectSetupPayload {
  assignments: ProjectAssignment[];
}

export async function setupCoordinatorProject(
  projectId: number,
  payload: CoordinatorProjectSetupPayload,
) {
  return put(`/coordinator/projects/${projectId}/setup`, payload);
}

export interface ProjectRole {
  rollid: number;
  rolename: string;
  folder_access: {
    fid: number;
    fname: string;
  }[];
}

export interface FolderTimelineKeyPerson {
  uid: number;
  loginname: string;
  firstname: string;
  lastname: string;
}

export interface ProjectFolderTimelineItem {
  fid: number;
  fname: string;

  parent_fid: number | null;
  is_parent: boolean;

  predecessorsid: number | null;
  days: number | null;
  startdate: string | null;
  enddate: string | null;

  keypersonid: number | null;
  key_person_options: FolderTimelineKeyPerson[];

  remarks: string | null;
  status: string;
}

export interface ProjectFolderTimelineResponse {
  project_id: number;
  project_start_date: string | null;
  project_end_date: string | null;
  folders: ProjectFolderTimelineItem[];
}

export function getProjectFolderTimeline(
  projectId: number | string,
): Promise<ProjectFolderTimelineResponse> {
  return get<ProjectFolderTimelineResponse>(
    `/coordinator/projects/${encodeURIComponent(String(projectId))}/folder-timeline`,
  );
}


export interface ProjectFolderTimelineSaveItem {
    fid: number;
    predecessorsid: number;
    days: number;
    keypersonid: number;
    remarks: string;
}

export interface SaveProjectFolderTimelinePayload {
    start_date: string;
    folders: ProjectFolderTimelineSaveItem[];
}


export function saveProjectFolderTimeline<T = unknown>(
  projectId: number | string,
  payload: SaveProjectFolderTimelinePayload,
): Promise<T> {
  return put<T>(
    `/coordinator/projects/${encodeURIComponent(String(projectId))}/folder-timeline`,
    payload,
  );
}
