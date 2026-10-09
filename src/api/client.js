/**
 * API client.
 *
 * - When `VITE_API_URL` is set, requests go to the real backend via `http`.
 * - Otherwise services use the in-browser mock API (`mockRequest`), which
 *   simulates latency and (optionally) failures so loading and error states
 *   can be seen without a server.
 */

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const USE_MOCK = !BASE_URL;

const TOKEN_KEY = "fleetops.token";

async function request(path, init = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection.", 0);
  }
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }
  return res.status === 204 ? undefined : res.json();
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/* ------------------------------- Mock layer ------------------------------ */

const SIMULATE_ERRORS_KEY = "fleetops.simulateErrors";

export const devSettings = {
  get simulateErrors() {
    return localStorage.getItem(SIMULATE_ERRORS_KEY) === "1";
  },
  set simulateErrors(v) {
    localStorage.setItem(SIMULATE_ERRORS_KEY, v ? "1" : "0");
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs a mock handler as if it were a network call.
 * @param {() => any} handler
 * @param {{ silent?: boolean }} opts  silent = no artificial latency (background refresh)
 */
export async function mockRequest(handler, opts = {}) {
  if (!opts.silent) {
    await sleep(250 + Math.random() * 450);
    if (devSettings.simulateErrors) {
      throw new ApiError("Network error: the server did not respond (simulated).", 503);
    }
  }
  // clone so components can never mutate the "server" state by reference
  return structuredClone(handler());
}

export function getErrorMessage(err) {
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
