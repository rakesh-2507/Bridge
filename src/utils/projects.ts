import type {
  CoordinatorProjectsResponse,
  Project,
} from "../api/projects";

/** The coordinator endpoint returns either a bare array or { projects }. */
export function normalizeCoordinatorProjects(
  response: CoordinatorProjectsResponse,
): Project[] {
  if (Array.isArray(response)) return response;

  return response?.projects ?? [];
}
