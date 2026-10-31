import { API_BASE_URL } from "../config";


const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const LOGIN_USER_KEY = "login_user";

export interface LoginRequest {
  loginname: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface AuthUser {
  uid?: number;
  userid?: number;
  user_id?: number;
  id?: number;
  loginname?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  mtype?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

interface JwtClaims {
  sub?: string | number;
  exp?: number;
  loginname?: string;
  mtype?: string;
  role?: string;
  type?: string;
}

interface ApiErrorResponse {
  detail?: string | { msg?: string }[];
  message?: string;
  error?: string;
}

// ========================================
// Response Helpers
// ========================================

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    if (!response.ok) {
      throw new Error(`Request failed (HTTP ${response.status}).`);
    }

    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `Request failed (HTTP ${response.status}): ${
        text || "Invalid server response"
      }`,
    );
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return isObject(data);
}

function getErrorMessage(
  data: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!isApiErrorResponse(data)) {
    return fallback;
  }

  const { detail, message, error } = data;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        isObject(item) && typeof item.msg === "string" ? item.msg : "",
      )
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function isValidAuthUser(value: unknown): value is AuthUser {
  if (!isObject(value)) {
    return false;
  }

  return typeof value.mtype === "string" && value.mtype.trim().length > 0;
}

function isValidAuthResponse(value: unknown): value is AuthResponse {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.access_token === "string" &&
    value.access_token.trim().length > 0 &&
    typeof value.refresh_token === "string" &&
    value.refresh_token.trim().length > 0 &&
    (value.token_type === undefined || typeof value.token_type === "string") &&
    // Login requires a user profile. Refresh responses may omit it.
    (value.user === undefined || isValidAuthUser(value.user))
  );
}

// ========================================
// JWT Helpers
// ========================================

// Decode JWT claims for client-side use only.
// This does NOT verify the token signature.
function decodeAccessToken(): JwtClaims | null {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const decoded = atob(payload + "=".repeat((4 - (payload.length % 4)) % 4));

    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

function isValidUserId(value: unknown): boolean {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0;
}

// ========================================
// Token Storage
// ========================================

export function storeAuthTokens(response: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);

  localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// ========================================
// Current User
// ========================================

export function getCurrentUser(): AuthUser | null {
  try {
    const storedUser = localStorage.getItem(LOGIN_USER_KEY);

    if (storedUser) {
      const user: unknown = JSON.parse(storedUser);

      if (isObject(user)) {
        return user as AuthUser;
      }
    }
  } catch {
    // Fall back to the available access-token claims.
  }

  const claims = decodeAccessToken();

  if (!claims) {
    return null;
  }

  const user: AuthUser = {
    loginname: claims.loginname,
    mtype: claims.mtype,
    role: claims.role,
  };

  if (isValidUserId(claims.sub)) {
    user.uid = Number(claims.sub);
  }

  return user;
}

export function getCurrentUserId(): number | null {
  const user = getCurrentUser();

  const storedId = user?.uid ?? user?.userid ?? user?.user_id ?? user?.id;

  if (isValidUserId(storedId)) {
    return Number(storedId);
  }

  const claims = decodeAccessToken();

  if (!claims) {
    return null;
  }

  if (isValidUserId(claims.sub)) {
    return Number(claims.sub);
  }

  return null;
}

export function getUserRole(): string | null {
  const user = getCurrentUser();
  const role = user?.mtype ?? user?.role;

  if (typeof role !== "string" || !role.trim()) {
    return null;
  }

  return role.trim();
}

// ========================================
// Authentication & Authorization
// ========================================

export function isAuthenticated(): boolean {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  const claims = decodeAccessToken();

  if (!claims) {
    return false;
  }

  if (
    typeof claims.exp === "number" &&
    claims.exp <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  return true;
}

export function hasRole(allowedRoles: string[]): boolean {
  if (!isAuthenticated()) {
    return false;
  }

  const role = getUserRole();

  if (!role) {
    return false;
  }

  return allowedRoles.some(
    (allowedRole) => allowedRole.trim().toLowerCase() === role.toLowerCase(),
  );
}

export function canAccess(allowedRoles?: string[]): boolean {
  if (!isAuthenticated()) {
    return false;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return hasRole(allowedRoles);
}

// ========================================
// Logout
// ========================================

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LOGIN_USER_KEY);
}

// ========================================
// Login API
// ========================================

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
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
      getErrorMessage(data, `Login failed (HTTP ${response.status}).`),
    );
  }

  if (!isValidAuthResponse(data)) {
    throw new Error("The server returned an invalid authentication response.");
  }

  if (!isValidAuthUser(data.user)) {
    throw new Error(
      "The server did not return valid user details or a user role.",
    );
  }

  // Save the access and refresh tokens.
  storeAuthTokens(data);

  // Save the actual profile returned by the login API.
  localStorage.setItem(LOGIN_USER_KEY, JSON.stringify(data.user));

  return data;
}

// ========================================
// Refresh Token API
// ========================================

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

  if (!isValidAuthResponse(data)) {
    throw new Error("The server returned an invalid token refresh response.");
  }

  // Update tokens without removing the existing user profile.
  storeAuthTokens(data);

  // Replace the saved profile only if the refresh API supplies one.
  if (data.user) {
    localStorage.setItem(LOGIN_USER_KEY, JSON.stringify(data.user));
  }

  return data;
}
