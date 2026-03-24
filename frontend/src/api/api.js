import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/", // Django API base
  withCredentials: true,                // send cookies for auth
});

export default api;