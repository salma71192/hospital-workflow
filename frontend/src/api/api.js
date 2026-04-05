import axios from "axios";

const api = axios.create({
  baseURL: "https://miniature-train-4qrjjq6wvwqhqwwr-8000.app.github.dev/api/",
  withCredentials: true,
});

export default api;