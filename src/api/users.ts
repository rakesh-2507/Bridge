import { apiRequest } from "./client";

export interface User {
    uid: number;
    name?: string;
    email?: string;
    organization?: string;
    designation?: string;
    [key: string]: unknown;
}

export async function getUsers() {
    return apiRequest<User[]>("/api/getusers");
}

export async function getUser(uid: number) {
    return apiRequest<User>(`/api/getuser/${uid}`);
}

export async function createUser(data: unknown) {
    return apiRequest("/api/createuser", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateUser(
    uid: number,
    data: unknown
) {
    return apiRequest(`/api/updateuser/${uid}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteUser(uid: number) {
    return apiRequest(`/api/deleteuser/${uid}`, {
        method: "DELETE",
    });
}