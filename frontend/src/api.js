import axios from "axios";
import { ACCESS_TOKEN, AUTH_TYPE } from "./constants";
import store from "./store";
import { checkAndRefreshToken, logout, setUser } from "./features/auth/authSlice";
import { jwtDecode } from "jwt-decode";
import { PublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "./auth-config";

const isDevelopment = import.meta.env.MODE === 'development';
const baseUrl = isDevelopment
  ? import.meta.env.VITE_API_BASE_URL_LOCAL
  : import.meta.env.VITE_API_BASE_URL_PROD;

const api = axios.create({
  baseURL: baseUrl,
  headers: {
    'Accept-Language': 'es-ES',
  },
});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function addSubscriber(callback) {
  subscribers.push(callback);
}

export const configureApi = (msalInstance) => {
  api.interceptors.request.use(async (config) => {
    const authType = sessionStorage.getItem(AUTH_TYPE);

    if (authType === "msal" && msalInstance) {
      try {
        const activeAccount = msalInstance.getActiveAccount();
        if (activeAccount) {
          const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: activeAccount,
          });
          if (response?.accessToken) {
            config.headers.Authorization = `Bearer ${response.accessToken}`;
          }
        }
      } catch (error) {
        console.error("MSAL acquireTokenSilent failed:", error);
      }
    } else if (authType === "djoser") {
      const token = sessionStorage.getItem(ACCESS_TOKEN);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        const authType = sessionStorage.getItem(AUTH_TYPE);

        if (authType === "djoser") {
          const accessToken = sessionStorage.getItem(ACCESS_TOKEN);
          if (accessToken && isTokenExpired(accessToken)) {
            if (!isRefreshing) {
              isRefreshing = true;
              store
                .dispatch(checkAndRefreshToken())
                .unwrap()
                .then((newToken) => {
                  isRefreshing = false;
                  onRefreshed(newToken);
                })
                .catch(() => {
                  isRefreshing = false;
                  store.dispatch(logout());
                });
            }

            return new Promise((resolve) => {
              addSubscriber((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              });
            });
          } else {
            store.dispatch(logout());
            return Promise.reject(error);
          }
        }

        if (authType === "msal" && msalInstance) {
          if (!isRefreshing) {
            isRefreshing = true;
            msalInstance
              .acquireTokenSilent({
                ...loginRequest,
                account: msalInstance.getActiveAccount(),
              })
              .then((response) => {
                const token = response.accessToken;
                sessionStorage.setItem(ACCESS_TOKEN, token);
                onRefreshed(token);
                isRefreshing = false;
              })
              .catch((_) => {
                isRefreshing = false;
                store.dispatch(logout());
              });
          }

          return new Promise((resolve) => {
            addSubscriber((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;
