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

// ----------------------------------------
// Folder Roles
// ----------------------------------------

export interface FolderRoleItem {
  fid: number;
  role: string;
  id: number;
}

export interface FolderRole {
  folder_id: number;
  folder_name: string;
  roles: FolderRoleItem[];
}

export interface FolderRolesResponse {
  template_id: number;
  folders: FolderRole[];
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

// Get folders and their configured roles for a template
export async function getTemplateFolderRoles(
  templateId: number
) {
  return apiRequest<FolderRolesResponse>(
    `/api/folders/${templateId}/roles`
  );
}