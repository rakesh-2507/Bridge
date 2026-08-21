import { apiRequest } from "./client";

export interface Company {
    cid: number;
    name?: string;
    [key: string]: unknown;
}

export async function getCompanies() {
    return apiRequest<Company[]>(
        "/api/getcompanies"
    );
}

export async function getCompany(cid: number) {
    return apiRequest<Company>(
        `/api/getcompany/${cid}`
    );
}

export async function createCompany(data: unknown) {
    return apiRequest("/api/createcompany", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateCompany(
    cid: number,
    data: unknown
) {
    return apiRequest(
        `/api/updatecompany/${cid}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteCompany(cid: number) {
    return apiRequest(
        `/api/deletecompany/${cid}`,
        {
            method: "DELETE",
        }
    );
}