
import axios from "axios";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_BASE_URL =
  "https://miniature-system-q7w4jrrr5v739w4j-8000.app.github.dev/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: false,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  timeout: 120000,
});

// Separate client avoids recursive CSRF interception.
const csrfClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  withXSRFToken: false,
  timeout: 30000,
});

let csrfToken = null;
let csrfRequest = null;

// =====================================================
// AUTHENTICATION
// =====================================================

function getAuthToken() {
  return (
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    null
  );
}

function formatAuthToken(token) {
  if (!token) return null;

  if (
    token.startsWith("Token ") ||
    token.startsWith("Bearer ")
  ) {
    return token;
  }

  return `Token ${token}`;
}

// =====================================================
// ERROR HELPERS
// =====================================================

function describeNetworkError(error, stage) {
  const code = error?.code || "UNKNOWN";
  const status = error?.response?.status;

  if (status) {
    return error;
  }

  if (code === "ECONNABORTED") {
    const timeoutError = new Error(
      `${stage} timed out. Check whether the ` +
      "Django server is running and responding."
    );

    timeoutError.code = code;
    timeoutError.cause = error;

    return timeoutError;
  }

  if (
    code === "ERR_NETWORK" ||
    (error?.request && !error?.response)
  ) {
    const networkError = new Error(
      `${stage} failed before the browser received ` +
      "an HTTP response. Check the browser Network " +
      "tab, Codespaces port forwarding, and CORS."
    );

    networkError.code = code;
    networkError.cause = error;

    return networkError;
  }

  return error;
}

// =====================================================
// CSRF MANAGEMENT
// =====================================================

export function clearCsrfToken() {
  csrfToken = null;
}

async function initializeCsrf(forceRefresh = false) {
  if (!forceRefresh && csrfToken) {
    return csrfToken;
  }

  if (csrfRequest) {
    return csrfRequest;
  }

  csrfRequest = (async () => {
    try {
      // Avoid custom Cache-Control headers and query
      // parameters that are unnecessary here.
      const response = await csrfClient.get(
        "users/csrf/",
        {
          withCredentials: true,
          timeout: 30000,
        }
      );

      const token = response.data?.csrfToken;

      if (
        typeof token !== "string" ||
        !token.trim()
      ) {
        throw new Error(
          "Django returned an invalid CSRF token."
        );
      }

      csrfToken = token;

      return token;
    } catch (error) {
      csrfToken = null;

      throw describeNetworkError(
        error,
        "CSRF initialization"
      );
    } finally {
      csrfRequest = null;
    }
  })();

  return csrfRequest;
}

export async function refreshCsrfToken() {
  csrfToken = null;

  return initializeCsrf(true);
}

export async function prepareApiCsrf() {
  try {
    await initializeCsrf();
    return true;
  } catch (error) {
    console.error(
      "CSRF initialization failed:",
      error.message
    );

    return false;
  }
}

// =====================================================
// REQUEST HELPERS
// =====================================================

function requiresCsrfToken(method) {
  return [
    "post",
    "put",
    "patch",
    "delete",
  ].includes(
    String(method || "get").toLowerCase()
  );
}

function isLoginOrLogoutRequest(config) {
  const url = String(config?.url || "");

  return (
    /users\/login\/?(\?|$)/.test(url) ||
    /users\/logout\/?(\?|$)/.test(url)
  );
}

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  async (config) => {
    config.headers = config.headers || {};

    const authToken = getAuthToken();

    if (authToken) {
      config.headers.Authorization =
        formatAuthToken(authToken);
    }

    if (requiresCsrfToken(config.method)) {
      try {
        const token = await initializeCsrf();

        // Explicit header for Django CSRF validation.
        config.headers["X-CSRFToken"] = token;
      } catch (error) {
        // Preserve the specific failure stage rather
        // than showing an unexplained Network Error.
        throw error;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// CSRF ERROR DETECTION
// =====================================================

function isCsrfErrorResponse(error) {
  if (error?.response?.status !== 403) {
    return false;
  }

  const data = error.response.data;

  let message = "";

  if (typeof data === "string") {
    message = data;
  } else {
    try {
      message = JSON.stringify(data || {});
    } catch {
      message = "";
    }
  }

  return /csrf|cookie not set/i.test(message);
}

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  async (response) => {
    // Django may rotate its CSRF secret after login.
    // Discard the cached token so the next request
    // retrieves one matching the new cookie.
    if (
      isLoginOrLogoutRequest(response.config)
    ) {
      clearCsrfToken();
    }

    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Retry only a genuine CSRF-related 403.
    if (
      !originalRequest._csrfRetried &&
      isCsrfErrorResponse(error)
    ) {
      originalRequest._csrfRetried = true;

      try {
        const freshToken =
          await refreshCsrfToken();

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers["X-CSRFToken"] =
          freshToken;

        // The request interceptor will use the
        // refreshed cached token.
        return api(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    if (
      !error.response &&
      (
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED"
      )
    ) {
      return Promise.reject(
        describeNetworkError(
          error,
          `API request (${originalRequest.url})`
        )
      );
    }

    return Promise.reject(error);
  }
);

// =====================================================
// EXPORT
// =====================================================

export default api;
