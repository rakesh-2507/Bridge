import {
  del,
  get,
  post,
  put,
  getBlob,
  postWithProgress,
  type UploadProgress,
} from "./http";
// ==============================
// Project Types
// ==============================

export type ProjectViewType = "coordinator" | "member" | string;

export interface ProjectFolderAccess {
  fid: number;
  fname: string;
}

export interface ProjectRole {
  rollid: number;
  rolename: string;
  folder_access: ProjectFolderAccess[];
}

export interface ProjectMember {
  memberid: number;
  assigned_role_ids: number[];
}

export interface ProjectFolder {
  pfid?: number;
  projectid?: number;
  fid: number;
  fname: string;
  fdesc?: string;
  pid?: number | null;
  parent_fid?: number | null;
  tid?: number;
  userid?: number;
  createddate?: string | null;
  updateddate?: string | null;
  isActive?: number;
  startdate?: string | null;
  enddate?: string | null;
  days?: number | null;
  keypersonid?: number | null;
  predecessorsid?: number | null;
  predecessor_status?: number | string | null;
  can_start?: boolean;
  remarks?: string | null;
  status?: number | string;
  children?: ProjectFolder[];
  fileCount?: number;
}

export interface AssignedProjectRole {
  rollid: number;
  rolename: string;
}

export interface Project {
  project_id: number;
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  start_date: string | null;
  end_date: string | null;
  status: number;
  created_date: string | null;
  updated_date: string | null;
  coordinator: number | null;
  is_project_manage: number;
  projecttype: number | null;

  view_type?: ProjectViewType;

  member_ids?: number[];
  members?: ProjectMember[];

  folders?: ProjectFolder[];

  folder_access?: ProjectFolderAccess[];

  assigned_role_ids?: number[];
  assigned_roles?: AssignedProjectRole[];
  available_roles?: ProjectRole[];
}

// ==============================
// Project Payload Types
// ==============================

export interface ProjectPayload {
  tid: number;
  cid: number;
  projectname: string;
  projectdesc: string;
  coordinator: number;
  is_project_manage: number;
  projecttype: number;
  member_ids: number[];
}

export interface UpdateProjectPayload extends ProjectPayload {
  start_date?: string | null;
  end_date?: string | null;
}

// ==============================
// Project API Responses
// ==============================

export type ProjectsResponse = Project[];

export type ProjectDetailsResponse = Project;

export interface CoordinatorProjectsData {
  projects: Project[];
  total?: number;
}

export type CoordinatorProjectsResponse = Project[] | CoordinatorProjectsData;

// ==============================
// Get All Projects
// GET /api/getprojects
// ==============================

export function getProjects<T = ProjectsResponse>(): Promise<T> {
  return get<T>("/getprojects");
}

// ==============================
// Get Project By ID
// GET /api/getproject/{project_id}
// ==============================

export function getProject<T = Project>(
  projectId: string | number,
): Promise<T> {
  return get<T>(`/getproject/${encodeURIComponent(String(projectId))}`);
}

// ==============================
// Create Project
// POST /api/createproject
// ==============================

export function createProject<T = Project>(
  payload: ProjectPayload,
): Promise<T> {
  return post<T>("/createproject", payload);
}

// ==============================
// Update Project
// PUT /api/updateproject/{project_id}
// ==============================

export function updateProject<T = string>(
  projectId: string | number,
  payload: UpdateProjectPayload,
): Promise<T> {
  return put<T>(
    `/updateproject/${encodeURIComponent(String(projectId))}`,
    payload,
  );
}

// ==============================
// Delete Project
// DELETE /api/deleteproject/{project_id}
// ==============================

export function deleteProject<T = string>(
  projectId: string | number,
): Promise<T> {
  return del<T>(`/deleteproject/${encodeURIComponent(String(projectId))}`);
}

// ==============================
// Coordinator / Assigned Projects
// GET /api/coordinator/assignedprojects
// ==============================

export function getCoordinatorProjects(): Promise<CoordinatorProjectsResponse> {
  return get<CoordinatorProjectsResponse>("/coordinator/assignedprojects");
}

// ==============================
// Coordinator Project Setup
// PUT /api/coordinator/projects/{project_id}/setup
// ==============================

export interface ProjectAssignment {
  member_ids: number[];
  rollid: number;
}

export interface CoordinatorProjectSetupPayload {
  assignments: ProjectAssignment[];
}

export async function setupCoordinatorProject(
  projectId: number,
  payload: CoordinatorProjectSetupPayload,
) {
  return put(
    `/coordinator/projects/${encodeURIComponent(String(projectId))}/setup`,
    payload,
  );
}

// ==============================
// Folder Timeline Types
// ==============================

export interface FolderTimelineKeyPerson {
  uid: number;
  loginname: string;
  firstname: string;
  lastname: string;
}

export interface ProjectFolderTimelineItem {
  fid: number;
  fname: string;
  parent_fid: number | null;
  is_parent: boolean;
  is_top_level?: boolean;
  predecessorsid: number | null;
  days: number | null;
  startdate: string | null;
  enddate: string | null;

  keypersonid: number | null;
  key_person_options: FolderTimelineKeyPerson[];

  remarks: string | null;
  status: number | string | null;

  progress_percentage: number | null;
  progress_notes: string | null;
}

export interface ProjectFolderTimelineResponse {
  project_id: number;
  project_start_date: string | null;
  project_end_date: string | null;
  folders: ProjectFolderTimelineItem[];
}

// ==============================
// Get Folder Timeline
// GET /api/coordinator/projects/{project_id}/folder-timeline
// ==============================

export function getProjectFolderTimeline(
  projectId: number | string,
): Promise<ProjectFolderTimelineResponse> {
  return get<ProjectFolderTimelineResponse>(
    `/coordinator/projects/${encodeURIComponent(String(projectId))}/folder-timeline`,
  );
}

// ==============================
// Save Folder Timeline
// PUT /api/coordinator/projects/{project_id}/folder-timeline
// ==============================

export interface ProjectFolderTimelineSaveItem {
  fid: number;
  days: number | null;
  predecessorsid: number | null;
  keypersonid: number | null;
  remarks: string;
}

export interface SaveProjectFolderTimelinePayload {
  start_date: string;
  folders: ProjectFolderTimelineSaveItem[];
}

export function saveProjectFolderTimeline<T = unknown>(
  projectId: number | string,
  payload: SaveProjectFolderTimelinePayload,
): Promise<T> {
  return put<T>(
    `/coordinator/projects/${encodeURIComponent(String(projectId))}/folder-timeline`,
    payload,
  );
}

export async function startProjectFolder(projectId: number, fid: number) {
  return post(`/myprojects/${projectId}/folders/${fid}/start`, {});
}

export async function getProjectFolderFiles(
  projectId: number,
  folderId: number,
) {
  return get(`/${projectId}/folders/${folderId}/files`);
}

export async function uploadProjectFolderFiles<T = unknown>(
  projectId: number,
  folderId: number,
  files: File[],
  onProgress?: (progress: UploadProgress) => void,
): Promise<T> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file, file.name);

    const relativePath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name;

    formData.append("relative_paths", relativePath);
  });

  const path =
    `/${encodeURIComponent(String(projectId))}` +
    `/folders/${encodeURIComponent(String(folderId))}/files`;

  return postWithProgress<T>(path, formData, onProgress ?? (() => {}));
}

export async function deleteProjectFolderFile(
  projectId: number,
  folderId: number,
  fileId: number,
): Promise<unknown> {
  return del(`/${projectId}/folders/${folderId}/files/${fileId}`);
}

export interface UpdateProjectFolderProgressPayload {
  progress_percentage: number;
  progress_notes: string;
}

export async function updateProjectFolderProgress(
  projectId: number,
  folderId: number,
  payload: UpdateProjectFolderProgressPayload,
) {
  return put(
    `/projects/${encodeURIComponent(String(projectId))}/folders/${encodeURIComponent(String(folderId))}/progress`,
    payload,
  );
}

export async function completeProjectFolder(
  projectId: number,
  folderId: number,
) {
  return post(`/myprojects/${projectId}/folders/${folderId}/complete`, {});
}

export async function getProjectFolderProgress(
  projectId: number,
  folderId: number,
): Promise<FolderProgress> {
  const response = await get(
    `/projects/${projectId}/folders/${folderId}/progress`,
  );

  return response as FolderProgress;
}

export interface FolderProgress {
  progress_percentage?: number | null;
  progress_notes?: string | null;
  status?: number | string | null;
  keypersonid?: number | null;
}

export async function getProjectFolderFilePreview(
  projectId: number,
  folderId: number,
  fileId: number,
): Promise<Blob> {
  return getBlob(
    `/${encodeURIComponent(String(projectId))}/folders/${encodeURIComponent(String(folderId))}/files/${encodeURIComponent(String(fileId))}`,
  );
}

export interface FolderCommentRecipient {
  uid: number;
  firstname?: string;
  lastname?: string;
  loginname?: string;
  email?: string;
  title?: string;
}

export interface CreateFolderCommentPayload {
  recipient_ids: number[];
  subject: string;
  message: string;
}

export async function getProjectFolderCommentRecipients(
  projectId: number,
  folderId: number,
) {
  return get<FolderCommentRecipient[]>(
    `/projects/${projectId}/folders/${folderId}/comment-recipients`,
  );
}

export async function createProjectFolderComment(
  projectId: number,
  folderId: number,
  payload: CreateFolderCommentPayload,
) {
  return post(`/projects/${projectId}/folders/${folderId}/comments`, payload);
}

export interface Notification {
  notificationid: number;
  from: string;
  project_id: number;
  project_name: string | null;
  folder_id: number;
  folder_name: string | null;
  subject: string;
  date: string | null;
  status: number;
}

export interface NotificationsResponse {
  count: number;
  notifications: Notification[];
}

export async function getNotifications() {
  return get<NotificationsResponse>("/notifications");
}

export interface FolderFile {
  file_id?: number;
  id?: number;
  filename?: string;
  file_name?: string;
  name?: string;
  createduid?: number | string | null;
  createddate?: string | null;
  filesize?: number | string | null;
  mime_type?: string | null;
  file_url?: string;
  download_url?: string;
  url?: string;
  path?: string;
  [key: string]: unknown;
}

export interface ProjectFolder {
  fid: number;
  fname: string;
  parent_fid?: number | null;
  keypersonid?: number | null;
  status?: number | string;
  progress_percentage?: number | null;
  progress_notes?: string | null;
  children?: ProjectFolder[];
  fileCount?: number;
}

export interface FolderNavigationState {
  project?: Project;
  folder?: ProjectFolder;
  folderName?: string;
}

export interface FolderProgress {
  progress_percentage?: number | null;
  progress_notes?: string | null;
  status?: number | string | null;
}

export async function getProjectFolderFileCounts(
  projectId: number | string,
): Promise<unknown> {
  return get<unknown>(
    `/projects/${encodeURIComponent(String(projectId))}/folder-file-counts`,
  );
}
