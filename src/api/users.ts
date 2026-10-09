
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

export function createUser(
  payload: CreateUserPayload,
): Promise<User> {
  return post<User>("/createuser", payload);
}

export function updateUser(
  uid: number,
  payload: UserPayload,
): Promise<User> {
  return put<User>(`/updateuser/${uid}`, payload);
}

export function deleteUser(uid: number): Promise<string> {
  return del<string>(`/deleteuser/${uid}`);
}