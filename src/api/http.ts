
const API_BASE_URL = "/api";

interface ValidationError {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

interface ApiError {
  detail?: string | ValidationError[];
  message?: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return null;
  }

  // Share one refresh request if several API calls fail together.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/refresh-token`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
            }),
          },
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }

          return null;
        }

        const data =
          (await response.json()) as RefreshResponse;

        if (!data.access_token) {
          return null;
        }

        localStorage.setItem("access_token", data.access_token);

        // Some backends rotate refresh tokens; others keep the same one.
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }

        return data.access_token;
      } catch {
        // A network error shouldn't automatically erase the session.
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function sendRequest(
  path: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = localStorage.getItem("access_token");

  let response = await sendRequest(
    path,
    options,
    accessToken,
  );

  // Refresh once if an authenticated API request returns 401.
  if (
    response.status === 401 &&
    path !== "/login" &&
    path !== "/refresh-token"
  ) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      response = await sendRequest(
        path,
        options,
        newAccessToken,
      );
    }
  }

  const text = await response.text();
  let data: unknown;

  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error(
          `Request failed (${response.status}): ${text}`,
        );
      }

      throw new Error(
        "The server returned an invalid JSON response.",
      );
    }
  }

  if (!response.ok) {
    const error =
      typeof data === "object" && data !== null
        ? (data as ApiError)
        : undefined;

    const detail = error?.detail;
    let message = `Request failed (HTTP ${response.status}).`;

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message =
        detail
          .map((item) => {
            const location = item.loc?.join(".");
            return location
              ? `${location}: ${item.msg ?? "Invalid value"}`
              : item.msg ?? "";
          })
          .filter(Boolean)
          .join(", ") || message;
    } else if (error?.message) {
      message = error.message;
    }

    throw new Error(message);
  }

  return data as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function post<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function put<T>(
  path: string,
  payload: unknown,
): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}