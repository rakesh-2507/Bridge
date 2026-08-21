const API_BASE_URL = "https://bridgeapi.sidpz.com";

interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

async function refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    const response = await fetch(
        `${API_BASE_URL}/api/refresh-token`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
            }),
        }
    );

    const data: RefreshResponse = await response.json();

    if (!response.ok) {
        // Refresh token is no longer valid
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");

        throw new Error(
            data &&
            typeof data === "object" &&
            "message" in data
                ? String(data.message)
                : "Session expired"
        );
    }

    // Save the new tokens
    localStorage.setItem(
        "access_token",
        data.access_token
    );

    localStorage.setItem(
        "refresh_token",
        data.refresh_token
    );

    localStorage.setItem(
        "token_type",
        data.token_type
    );

    return data.access_token;
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<T> {
    let accessToken =
        localStorage.getItem("access_token");

    let response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(accessToken
                    ? {
                          Authorization:
                              `Bearer ${accessToken}`,
                      }
                    : {}),

                ...options.headers,
            },
        }
    );

    // Access token expired
    if (
        response.status === 401 &&
        retry
    ) {
        try {
            // Get a new access token
            accessToken = await refreshAccessToken();

            // Retry the original request
            response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${accessToken}`,

                        ...options.headers,
                    },
                }
            );
        } catch {
            // Refresh failed
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("token_type");

            window.location.href = "/login";

            throw new Error(
                "Session expired. Please login again."
            );
        }
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.detail ||
            data?.error ||
            "Something went wrong"
        );
    }

    return data;
}