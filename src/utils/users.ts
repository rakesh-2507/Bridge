import { API_ORIGIN } from "../config";
import type { User } from "../api/users";

/** Resolves a user's stored photo path to an absolute URL, or null if none. */
export function getUserPhotoUrl(user: User | undefined): string | null {
  const photo = user?.photo?.trim();

  if (!photo) return null;

  if (/^https?:\/\//i.test(photo)) return photo;

  return `${API_ORIGIN}/${photo.replace(/^\/+/, "")}`;
}
