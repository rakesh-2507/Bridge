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

export async function login(
    credentials: LoginRequest
): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

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