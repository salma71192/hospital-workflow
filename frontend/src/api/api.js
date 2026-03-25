import axios from "axios";

const api = axios.create({
  baseURL: "https://miniature-train-4qrjjq6wvwhqwwr-8000.app.github.dev/api/",
  withCredentials: true, // 🔥 VERY IMPORTANT
});

export default api;