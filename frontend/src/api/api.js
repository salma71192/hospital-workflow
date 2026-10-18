import axios from "axios";
const api = axios.create({
  baseURL:
    "https://miniature-system-q7w4jrrr5v739w4j-8000.app.github.dev/api/",
  withCredentials: false,
  timeout: 30000,
});
// Read the token from this browser tab's sessionStorage.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default api;