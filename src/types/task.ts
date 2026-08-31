export interface Task {
task_id: number;

project_id: number;
template_id: number;
folder_id: number;

task_type: string;
task_description: string;

key_params: Record<string, unknown>;

levels: string[];

start_date: string;
end_date: string;

assigned_by: number;
assigned_to: number;

/**
 * 1 / undefined = Pending
 * 2 = In Progress
 * 3 = Completed
 */
status?: number;

}

export interface CreateTaskPayload {
project_id: number;
template_id: number;
folder_id: number;

task_type: string;
task_description: string;

key_params: Record<string, unknown>;

levels: string[];

start_date: string;
end_date: string;

assigned_by: number;
assigned_to: number;

}

export interface UpdateTaskPayload
extends CreateTaskPayload {
status: number;
}
