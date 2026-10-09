
const API_BASE_URL = "/api";

export interface LoginRequest {
  loginname: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

interface ApiErrorResponse {
  detail?: string | { msg?: string }[];
}

async function readResponse(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `Checking... (HTTP ${response.status}): ${
        text || "Empty response"
      }`,
    );
  }
}

function isApiErrorResponse(
  data: unknown,
): data is ApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "detail" in data
  );
}

function getErrorMessage(
  data: unknown,
  fallback: string,
): string {
  if (!isApiErrorResponse(data)) {
    return fallback;
  }

  const { detail } = data;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => item.msg)
      .filter((msg): msg is string => Boolean(msg))
      .join(", ");

    return message || fallback;
  }

  return fallback;
}

export async function login(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Login failed (HTTP ${response.status}).`,
      ),
    );
  }

  return data as AuthResponse;
}

export async function refreshToken(
  payload: RefreshTokenRequest,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Unable to refresh your session (HTTP ${response.status}).`,
      ),
    );
  }

  return data as AuthResponse;
}