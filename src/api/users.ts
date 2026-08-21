import { apiRequest } from "./client";

/*
 * User returned by the API
 */
export interface User {
  uid: number;
  title: string;
  firstname: string;
  lastname: string;
  loginname: string;
  email: string;
  mobile: string;
  status: string;
  mtype: string;
  createddt: string;
  updatedt: string;
}

/*
 * GET /api/getusers
 */
export interface GetUsersResponse {
  users: User[];
  total: number;
}

export async function getUsers(): Promise<GetUsersResponse> {
  return apiRequest<GetUsersResponse>("/api/getusers");
}

/*
 * GET /api/getuser/{uid}
 */
export async function getUser(uid: number): Promise<User> {
  return apiRequest<User>(`/api/getuser/${uid}`);
}

/*
 * POST /api/createuser
 */
export interface CreateUserData {
  title: string;
  firstname: string;
  lastname: string;
  loginname: string;
  password: string;
  email: string;
  mobile: string;
  mtype: string;
}

export async function createUser(
  data: CreateUserData
): Promise<User> {
  return apiRequest<User>("/api/createuser", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/*
 * PUT /api/updateuser/{uid}
 */
export interface UpdateUserData {
  title: string;
  firstname: string;
  lastname: string;
  loginname: string;
  password: string;
  email: string;
  mobile: string;
  mtype: string;
}

export async function updateUser(
  uid: number,
  data: UpdateUserData
): Promise<User> {
  return apiRequest<User>(`/api/updateuser/${uid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/*
 * DELETE /api/deleteuser/{uid}
 */
export async function deleteUser(uid: number): Promise<string> {
  return apiRequest<string>(`/api/deleteuser/${uid}`, {
    method: "DELETE",
  });
}