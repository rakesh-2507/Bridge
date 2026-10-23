import { del, get, post, put } from "./http";

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
  photo?: string | null;
  photo_url?: string | null;
  gender?: string | null;
  createddt: string;
  updatedt: string;
}

export interface UserPayload {
  title: string;
  firstname: string;
  lastname: string;
  loginname: string;
  password?: string;
  email: string;
  mobile: string;
  mtype: string;
  photo?: string | null;
  photo_url?: string | null;
  gender?: string | null;
}

export interface CreateUserPayload extends UserPayload {
  password: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export function getUsers(): Promise<UsersResponse> {
  return get<UsersResponse>("/getusers");
}

export function getUser(uid: number): Promise<User> {
  return get<User>(`/getuser/${uid}`);
}

export function deleteUser(uid: number): Promise<string> {
  return del<string>(`/deleteuser/${uid}`);
}

function toUserFormData(payload: UserPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return formData;
}

export function createUser(payload: CreateUserPayload): Promise<User> {
  return post<User>("/createuser", toUserFormData(payload));
}

export function updateUser(uid: number, payload: FormData): Promise<User> {
  return put<User>(`/updateuser/${uid}`, payload);
}
