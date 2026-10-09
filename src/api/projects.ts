import { del, get, post, put } from "./http";

export interface Project {
  project_id: number;
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  start_date: string;
  end_date: string;
  status: number;
  created_date: string;
  updated_date: string;
  coordinator: number;
  is_project_manage: number;
  projecttype: number;
}

export interface ProjectPayload {
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  start_date: string;
  end_date: string;
  member_ids: number[];
  coordinator: number;
  is_project_manage: number;
  projecttype: number;
  status?: number;
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
}

export function getProjects<T = ProjectsResponse>(): Promise<T> {
  return get<T>("/getprojects");
}

export function getProject<T = Project>(
  projectId: string | number,
): Promise<T> {
  return get<T>(
    `/getproject/${encodeURIComponent(String(projectId))}`,
  );
}

export function createProject<T = Project>(
  payload: ProjectPayload,
): Promise<T> {
  return post<T>("/createproject", payload);
}

export function updateProject<T = Project>(
  projectId: string | number,
  payload: ProjectPayload,
): Promise<T> {
  return put<T>(
    `/updateproject/${encodeURIComponent(String(projectId))}`,
    payload,
  );
}

export function deleteProject<T = string>(
  projectId: string | number,
): Promise<T> {
  return del<T>(
    `/deleteproject/${encodeURIComponent(String(projectId))}`,
  );
}
