
import { get } from "./http";

export function getUserLogs<T = unknown>(): Promise<T> {
  return get<T>("/userlogs/");
}