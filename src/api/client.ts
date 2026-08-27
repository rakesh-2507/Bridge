const API_BASE_URL = "https://bridgeapi.sidpz.com";

interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

function getErrorMessage(data: unknown): string {
    if (typeof data === "string") {
        return data;
    }

    if (!data || typeof data !== "object") {
        return "Something went wrong";
    }

    const errorData = data as Record<string, unknown>;

    // Simple message
    if (typeof errorData.message === "string") {
        return errorData.message;
    }

    if (typeof errorData.error === "string") {
        return errorData.error;
    }

    // FastAPI commonly uses `detail`
    if (typeof errorData.detail === "string") {
        return errorData.detail;
    }

    // FastAPI/Pydantic validation errors
    if (Array.isArray(errorData.detail)) {
        return errorData.detail
            .map((item) => {
                if (
                    item &&
                    typeof item === "object"
                ) {
                    const validationError =
                        item as Record<string, unknown>;

                    const location =
                        Array.isArray(
                            validationError.loc
                        )
                            ? validationError.loc.join(".")
                            : "";

                    const message =
                        typeof validationError.msg ===
                        "string"
                            ? validationError.msg
                            : "Validation error";

                    return location
                        ? `${location}: ${message}`
                        : message;
                }

                return String(item);
            })
            .join(", ");
    }

    // Fallback
    try {
        return JSON.stringify(data);
    } catch {
        return "Something went wrong";
    }
}

async function refreshAccessToken(): Promise<string> {
    const refreshToken =
        localStorage.getItem("refresh_token");

    if (!refreshToken) {
        throw new Error(
            "No refresh token available"
        );
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

    const data: unknown =
        await response.json();

    if (!response.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");

        throw new Error(
            getErrorMessage(data) ||
                "Session expired"
        );
    }

    const tokenData =
        data as RefreshResponse;

    localStorage.setItem(
        "access_token",
        tokenData.access_token
    );

    localStorage.setItem(
        "refresh_token",
        tokenData.refresh_token
    );

    localStorage.setItem(
        "token_type",
        tokenData.token_type
    );

    return tokenData.access_token;
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
                "Content-Type":
                    "application/json",

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

    /*
     * ----------------------------------------
     * ACCESS TOKEN EXPIRED
     * ----------------------------------------
     */

    if (
        response.status === 401 &&
        retry
    ) {
        try {
            accessToken =
                await refreshAccessToken();

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
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            localStorage.removeItem(
                "token_type"
            );

            window.location.href =
                "/login";

            throw new Error(
                "Session expired. Please login again."
            );
        }
    }

    /*
     * ----------------------------------------
     * READ RESPONSE
     * ----------------------------------------
     */

    const contentType =
        response.headers.get(
            "content-type"
        );

    let data: unknown;

    if (
        contentType?.includes(
            "application/json"
        )
    ) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    /*
     * ----------------------------------------
     * ERROR
     * ----------------------------------------
     */

    if (!response.ok) {
        const message =
            getErrorMessage(data);

        console.error(
            `API Error ${response.status}:`,
            {
                endpoint,
                status: response.status,
                response: data,
            }
        );

        throw new Error(message);
    }

    return data as T;
}