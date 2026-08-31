import { apiRequest } from "./client";

import type {
Task,
CreateTaskPayload,
UpdateTaskPayload,
} from "../types/task";

/**

* Normalize different API response formats into Task[].
*
* Supported:
* * Task[]
* * { tasks: Task[] }
* * { data: Task[] }
* * { items: Task[] }
    */
    function normalizeTasksResponse(
    response: unknown
    ): Task[] {
    if (Array.isArray(response)) {
    return response as Task[];
    }

  if (
  response !== null &&
  typeof response === "object"
  ) {
  const data =
  response as Record<string, unknown>;

   if (Array.isArray(data.tasks)) {
       return data.tasks as Task[];
   }

   if (Array.isArray(data.data)) {
       return data.data as Task[];
   }

   if (Array.isArray(data.items)) {
       return data.items as Task[];
   }

  }

  console.error(
  "Unexpected tasks API response:",
  response
  );

  return [];
  }

/**

* Create a new task
  */
  export async function createTask(
  payload: CreateTaskPayload
  ): Promise<Task> {
  return apiRequest<Task>(
  "/api/createtask",
  {
  method: "POST",
  body: JSON.stringify(payload),
  }
  );
  }

/**

* Get all tasks
  */
  export async function getTasks(): Promise<Task[]> {
  const response = await apiRequest<unknown>(
  "/api/gettasks",
  {
  method: "GET",
  }
  );

  return normalizeTasksResponse(response);
  }

/**

* Get a single task
  */
  export async function getTask(
  taskId: number
  ): Promise<Task> {
  return apiRequest<Task>(
  `/api/gettask/${taskId}`,
  {
  method: "GET",
  }
  );
  }

/**

* Get tasks belonging to a project
  */
  export async function getProjectTasks(
  projectId: number
  ): Promise<Task[]> {
  const response = await apiRequest<unknown>(
  `/api/gettasks/project/${projectId}`,
  {
  method: "GET",
  }
  );

  return normalizeTasksResponse(response);
  }

/**

* Get tasks belonging to a folder
  */
  export async function getFolderTasks(
  folderId: number
  ): Promise<Task[]> {
  const response = await apiRequest<unknown>(
  `/api/gettasks/folder/${folderId}`,
  {
  method: "GET",
  }
  );

  return normalizeTasksResponse(response);
  }

/**

* Update an existing task
  */
  export async function updateTask(
  taskId: number,
  payload: UpdateTaskPayload
  ): Promise<Task> {
  return apiRequest<Task>(
  `/api/updatetask/${taskId}`,
  {
  method: "PUT",
  body: JSON.stringify(payload),
  }
  );
  }

/**

* Delete a task
  */
  export async function deleteTask(
  taskId: number
  ): Promise<unknown> {
  return apiRequest(
  `/api/deletetask/${taskId}`,
  {
  method: "DELETE",
  }
  );
  }
