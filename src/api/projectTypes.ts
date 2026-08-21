import { apiRequest } from "./client";

export interface ProjectType {
    ptypeid: number;
    name?: string;
    [key: string]: unknown;
}

export async function getProjectTypes() {
    return apiRequest<ProjectType[]>(
        "/api/getprojecttypes"
    );
}

export async function getProjectType(ptypeId: number) {
    return apiRequest<ProjectType>(
        `/api/getprojecttype/${ptypeId}`
    );
}

export async function createProjectType(data: unknown) {
    return apiRequest("/api/createprojecttype", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateProjectType(
    ptypeId: number,
    data: unknown
) {
    return apiRequest(
        `/api/updateprojecttype/${ptypeId}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteProjectType(ptypeId: number) {
    return apiRequest(
        `/api/deleteprojecttype/${ptypeId}`,
        {
            method: "DELETE",
        }
    );
}