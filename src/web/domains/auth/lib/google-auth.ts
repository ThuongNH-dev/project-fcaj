// Minimal typings for the Google Identity Services script loaded in index.html.
// See: https://developers.google.com/identity/oauth2/web/reference/js-reference
interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: { type?: string }) => void;
  }) => GoogleTokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID?.trim());
}

/**
 * Opens the Google account picker/consent popup and resolves with an OAuth
 * access token that the backend can verify against Google's tokeninfo and
 * userinfo endpoints.
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID?.trim()) {
      reject(
        new Error(
          "Google sign-in isn't configured yet. Set VITE_GOOGLE_CLIENT_ID in the frontend .env.",
        ),
      );
      return;
    }

    const oauth2 = window.google?.accounts?.oauth2;

    if (!oauth2) {
      reject(
        new Error(
          "Google sign-in script hasn't loaded yet. Please try again in a moment.",
        ),
      );
      return;
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID.trim(),
      scope: "openid email profile",
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(response.error_description || "Google sign-in was cancelled."),
          );
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(
          new Error(
            error?.type === "popup_closed"
              ? "Google sign-in was cancelled."
              : "Unable to open Google sign-in.",
          ),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
}
