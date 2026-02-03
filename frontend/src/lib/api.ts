import axios from "axios";
import { authStorage } from "@/lib/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Optional: if token is invalid/expired, clear it
    if (error?.response?.status === 401) {
      // Don’t hard-redirect here; pages can decide what to do.
    }
    return Promise.reject(error);
  }
);
