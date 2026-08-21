import { apiRequest } from "./client";

export interface Folder {
    fid: number;
    name?: string;
    [key: string]: unknown;
}

export async function getFolders() {
    return apiRequest<Folder[]>("/api/getfolders");
}

export async function getFolder(fid: number) {
    return apiRequest<Folder>(
        `/api/getfolder/${fid}`
    );
}

export async function createFolder(data: unknown) {
    return apiRequest("/api/createfolder", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateFolder(
    fid: number,
    data: unknown
) {
    return apiRequest(
        `/api/updatefolder/${fid}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        }
    );
}

export async function deleteFolder(fid: number) {
    return apiRequest(
        `/api/deletefolder/${fid}`,
        {
            method: "DELETE",
        }
    );
}

export async function getTemplateFolders(tid: number) {
    return apiRequest<Folder[]>(
        `/api/gettemplatefolders/${tid}`
    );
}