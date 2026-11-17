import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function redirectToLogin() {
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // getSession retrieves the current session and can
  // refresh its access token when necessary.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    await redirectToLogin();
    throw new Error("Authentication required");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${session.access_token}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await redirectToLogin();
    throw new Error("Session expired or invalid");
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));

    throw new Error(result.error || `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
