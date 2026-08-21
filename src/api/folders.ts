import { apiRequest } from "./client";

export interface Folder {
  fid: number;
  fname: string;
  pid: number;
  tid: number;
  fnamedesc: string;
}

export interface FoldersResponse {
  folders: Folder[];
  total: number;
}

export interface CreateFolderData {
  fname: string;
  pid: number;
  tid: number;
  fnamedesc: string;
}

export interface UpdateFolderData {
  fname: string;
  pid: number;
  tid: number;
  fnamedesc: string;
}

export async function getFolders() {
  return apiRequest<FoldersResponse>("/api/getfolders");
}

export async function getFolder(fid: number) {
  return apiRequest<Folder>(
    `/api/getfolder/${fid}`
  );
}

export async function createFolder(
  data: CreateFolderData
) {
  return apiRequest<Folder>("/api/createfolder", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFolder(
  fid: number,
  data: UpdateFolderData
) {
  return apiRequest<Folder>(
    `/api/updatefolder/${fid}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteFolder(fid: number) {
  return apiRequest<string>(
    `/api/deletefolder/${fid}`,
    {
      method: "DELETE",
    }
  );
}

export async function getTemplateFolders(tid: number) {
  return apiRequest<FoldersResponse>(
    `/api/gettemplatefolders/${tid}`
  );
}