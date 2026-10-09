import { del, get, post, put } from "./http";

// Folder
export interface Folder {
  fid: number;
  fname: string;
  pid: number;
  tid: number;
  fnamedesc: string;
}

// Request payload for create and update
export interface FolderPayload {
  fname: string;
  pid: number;
  tid: number;
  fnamedesc: string;
}

// Response for folder lists
export interface FoldersResponse {
  folders: Folder[];
  total: number;
}

// Create folder
export function createFolder<T = Folder>(
  payload: FolderPayload,
): Promise<T> {
  return post<T>("/createfolder", payload);
}

// Get all folders
export function getFolders<T = FoldersResponse>(): Promise<T> {
  return get<T>("/getfolders");
}

// Get folder by ID
export function getFolder<T = Folder>(
  fid: string | number,
): Promise<T> {
  return get<T>(`/getfolder/${encodeURIComponent(String(fid))}`);
}

// Update folder
export function updateFolder<T = Folder>(
  fid: string | number,
  payload: FolderPayload,
): Promise<T> {
  return put<T>(
    `/updatefolder/${encodeURIComponent(String(fid))}`,
    payload,
  );
}

// Delete folder
export function deleteFolder<T = string>(
  fid: string | number,
): Promise<T> {
  return del<T>(`/deletefolder/${encodeURIComponent(String(fid))}`);
}

// Get folders belonging to a template
export function getTemplateFolders<T = FoldersResponse>(
  tid: string | number,
): Promise<T> {
  return get<T>(
    `/gettemplatefolders/${encodeURIComponent(String(tid))}`,
  );
}
