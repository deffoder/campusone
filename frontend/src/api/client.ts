import axios from "axios";

const envUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL =
  envUrl && !envUrl.includes("5j0m") && !envUrl.includes("localhost") && !envUrl.includes("your-render")
    ? envUrl
    : "https://campusone-ebtx.onrender.com/api";

export const BACKEND_SERVER_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("campusone_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("campusone_token");
      localStorage.removeItem("campusone_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
