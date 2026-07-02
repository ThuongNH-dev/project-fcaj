import {
  clearStoredUser,
  getStoredToken,
} from "../../domains/auth/storage/auth.storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

const AUTH_SESSION_ERROR_MESSAGES = new Set([
  "Authorization token is required.",
  "Invalid or expired authorization token.",
]);
const AUTH_SESSION_MISSING_USER_MESSAGE = "User not found.";

function shouldClearAuthSession(status: number, message?: string) {
  const normalizedMessage = message ?? "";

  return (
    (status === 401 && AUTH_SESSION_ERROR_MESSAGES.has(normalizedMessage)) ||
    (status === 404 && normalizedMessage === AUTH_SESSION_MISSING_USER_MESSAGE)
  );
}

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
    if (shouldClearAuthSession(response.status, data.message)) {
      clearStoredUser();
    }

    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function getAuthHeaders(headers?: HeadersInit) {
  const token = getStoredToken();
  const resolvedHeaders = new Headers(headers);

  if (token) {
    resolvedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return resolvedHeaders;
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

export async function putFile(
  url: string,
  file: File,
  headers?: Record<string, string>,
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error("File upload failed.");
  }
}

export async function downloadFile(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const data = (await response.json()) as { message?: string };
      message = data.message || message;

      if (shouldClearAuthSession(response.status, data.message)) {
        clearStoredUser();
      }
    } catch {
      // Ignore JSON parsing failures for non-JSON download responses.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const contentDisposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch =
    contentDisposition.match(/filename="([^"]+)"/i) ??
    contentDisposition.match(/filename=([^;]+)/i);
  const filename = filenameMatch?.[1]?.trim() ?? "download";
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
