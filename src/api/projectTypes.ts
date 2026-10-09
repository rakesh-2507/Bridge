import { del, get, post, put } from "./http";

// Project Type
export interface ProjectType {
  ptypeid: number;
  projecttype: string;
}

// Get all project types response
export interface ProjectTypesResponse {
  projecttypes: ProjectType[];
  total: number;
}

// Create and update request payload
export interface ProjectTypePayload {
  projecttype: string;
}

// Create project type
export function createProjectType<T = ProjectType>(
  payload: ProjectTypePayload,
): Promise<T> {
  return post<T>("/createprojecttype", payload);
}

// Get all project types
export function getProjectTypes<T = ProjectTypesResponse>(): Promise<T> {
  return get<T>("/getprojecttypes");
}

// Get a project type by ID
export function getProjectType<T = ProjectType>(
  ptypeid: string | number,
): Promise<T> {
  return get<T>(
    `/getprojecttype/${encodeURIComponent(String(ptypeid))}`,
  );
}

// Update a project type
export function updateProjectType<T = ProjectType>(
  ptypeid: string | number,
  payload: ProjectTypePayload,
): Promise<T> {
  return put<T>(
    `/updateprojecttype/${encodeURIComponent(String(ptypeid))}`,
    payload,
  );
}

// Delete a project type
export function deleteProjectType<T = string>(
  ptypeid: string | number,
): Promise<T> {
  return del<T>(
    `/deleteprojecttype/${encodeURIComponent(String(ptypeid))}`,
  );
}
