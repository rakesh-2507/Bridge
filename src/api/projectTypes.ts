import { apiRequest } from "./client";

export interface ProjectType {
  ptypeid: number;
  projecttype: string;
}

export interface ProjectTypesResponse {
  projecttypes: ProjectType[];
  total: number;
}

export interface CreateProjectTypeData {
  projecttype: string;
}

export async function getProjectTypes() {
  return apiRequest<ProjectTypesResponse>(
    "/api/getprojecttypes"
  );
}

export async function getProjectType(ptypeId: number) {
  return apiRequest<ProjectType>(
    `/api/getprojecttype/${ptypeId}`
  );
}

export async function createProjectType(
  data: CreateProjectTypeData
) {
  return apiRequest<ProjectType>(
    "/api/createprojecttype",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateProjectType(
  ptypeId: number,
  data: CreateProjectTypeData
) {
  return apiRequest<ProjectType>(
    `/api/updateprojecttype/${ptypeId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteProjectType(
  ptypeId: number
) {
  return apiRequest(
    `/api/deleteprojecttype/${ptypeId}`,
    {
      method: "DELETE",
    }
  );
}