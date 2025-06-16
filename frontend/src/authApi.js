import axios from "axios";

const isDevelopment = import.meta.env.MODE === 'development'
const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD

const authApi = axios.create({
  baseURL: baseUrl,
  headers: {
    "Accept-Language": "es-es",
  },
});

export default authApi;
