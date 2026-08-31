import { apiRequest } from "./client";

export interface LoginRequest {
    loginname: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface JwtPayload {
    sub?: string;
    loginname?: string;
    login_type?: string;
    role?: string;
    exp?: number;
    type?: string;
    [key: string]: unknown;
}

/**
 * Login
 */
export async function login(
    credentials: LoginRequest
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
        "/api/login",
        {
            method: "POST",
            body: JSON.stringify(credentials),
        }
    );
}

/**
 * Refresh access token
 */
export async function refreshToken(
    refresh_token: string
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>(
        "/api/refresh-token",
        {
            method: "POST",
            body: JSON.stringify({
                refresh_token,
            }),
        }
    );
}

/**
 * Decode JWT payload
 */
export function getJwtPayload(
    token: string
): JwtPayload | null {
    try {
        const parts = token.split(".");

        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1];

        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = atob(base64);

        return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
        console.error(
            "Failed to decode JWT:",
            error
        );

        return null;
    }
}

/**
 * Get login type from JWT
 */
export function getLoginType(
    token: string
): string {
    const payload =
        getJwtPayload(token);

    if (!payload) {
        return "";
    }

    /*
     * Prefer an actual role/login_type
     * if the backend provides one.
     */
    const loginType =
        payload.login_type ??
        payload.role ??
        payload.loginname ??
        "";

    return String(loginType)
        .trim()
        .toLowerCase();
}

/**
 * Check whether logged-in user is admin
 */
export function isAdminUser(
    token: string
): boolean {
    const loginType =
        getLoginType(token);

    return (
        loginType === "admin" ||
        loginType === "sysadmin" ||
        loginType === "administrator"
    );
}
