import axios from "axios";

const api = axios.create({
  baseURL: "https://miniature-system-q7w4jrrr5v739w4j-8000.app.github.dev/api/",
  withCredentials: true,
});

export default api;