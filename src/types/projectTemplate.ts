export interface ProjectType {
  ptypeid: number;
  projecttype: string;
}

export interface ProjectTemplate {
  tid: number;
  name: string;
  name_desc: string;
  projecttype: number;
}

export interface ProjectTemplateListResponse {
  templates: ProjectTemplate[];
  total: number;
}

export interface ProjectTemplateDetails {
  name: string;
  description: string;
  project_type_id: number;
}

export interface ProjectTemplateFolder {
  id: string;
  name: string;
  description: string;
  parentFolderId: string | null;
  roles: string[];
}

export interface CreateProjectTemplateFolder {
  name: string;
  description: string;
  parent_folder_index: number | null;
  roles: string[];
}

export interface CreateProjectTemplatePayload {
  project_template: ProjectTemplateDetails;
  folders: CreateProjectTemplateFolder[];
}

/* ----------------------------------------
 * Create Project From Template
 * ---------------------------------------- */

export interface CreateProjectFromTemplateDetails {
  template_id: number;
  company_id: number;

  project_name: string;
  project_description: string;

  start_date: string;
  end_date: string;

  /*
   * Keep member_id for now.
   *
   * We will change this only after
   * confirming the backend payload for
   * multiple project members.
   */
  member_ids: number[];
  /*
   * Single coordinator.
   */
  coordinator: number;

  is_project_manage: number;

  po: string;
  costhead: string;
  projectno: string;

  projecttype: number;
  department: string;
}

/* ----------------------------------------
 * Folder Schedule
 * ---------------------------------------- */

export interface FolderSchedule {
  folder_id: number;
  start_date: string;
  end_date: string;
}

/* ----------------------------------------
 * Template Folder Roles
 * ---------------------------------------- */

/*
 * The API returns role objects, not strings.
 *
 * Example:
 *
 * {
 *   "fid": 10,
 *   "role": "Manager",
 *   "id": 1
 * }
 */
export interface TemplateFolderRoleItem {
  fid: number;
  role: string;
  id: number;
}

export interface TemplateFolderRole {
  folder_id: number;
  folder_name: string;
  roles: TemplateFolderRoleItem[];
}

export interface TemplateFolderRolesResponse {
  template_id: number;
  folders: TemplateFolderRole[];
}

/* ----------------------------------------
 * Folder User Assignment
 * ---------------------------------------- */

export interface RoleAssignment {
  role: string;
  user_id: number;
}

export interface FolderAssignment {
  folder_id: number;
  start_date: string;
  end_date: string;
  role_assignments: RoleAssignment[];
}

/* ----------------------------------------
 * Final Create Project API Payload
 * ---------------------------------------- */

export interface CreateProjectFromTemplatePayload {
  project: CreateProjectFromTemplateDetails;
  folder_assignments: FolderAssignment[];
}

/* ----------------------------------------
 * Create Project Wizard State
 * ---------------------------------------- */

export interface CreateProjectWizardData {
  project: CreateProjectFromTemplateDetails;

  /*
   * Step 2
   */
  folderSchedules: FolderSchedule[];

  /*
   * Step 3
   */
  folderAssignments: FolderAssignment[];
}
