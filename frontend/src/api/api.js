import axios from "axios";

const api = axios.create({
  baseURL: "https://YOUR-8000-URL.app.github.dev/api/",
  withCredentials: true,
});

export default api;