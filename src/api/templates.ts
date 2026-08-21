import { apiRequest } from "./client";

export interface Template {
    tid: number;
    name?: string;
    [key: string]: unknown;
}

export async function getTemplates() {
    return apiRequest<Template[]>(
        "/api/gettemplates"
    );
}

export async function getTemplate(tid: number) {
    return apiRequest<Template>(
        `/api/gettemplate/${tid}`
    );
}

export async function createTemplate(data: unknown) {
    return apiRequest("/api/createtemplate", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateTemplate(
    tid: number,
    data: unknown
) {
    return apiRequest(
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