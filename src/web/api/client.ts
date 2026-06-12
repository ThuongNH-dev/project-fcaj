import { getStoredToken } from "./auth/auth.storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

async function requestJson<TResponse>(
  path: string,
  options: RequestInit,
): Promise<TResponse> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as {
    message?: string;
  } & TResponse;

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export async function postJson<TPayload, TResponse>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getJson<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "GET",
  });
}

export async function patchJson<TPayload, TResponse>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteJson<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>(path, {
    method: "DELETE",
  });
}
