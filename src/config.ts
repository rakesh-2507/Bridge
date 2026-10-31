/** Single source of truth for backend locations. */
export const API_ORIGIN = "https://bridge.sidpz.com";

export const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${API_ORIGIN}/api`;
