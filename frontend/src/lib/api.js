import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('proof_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response && err.response.status === 401) {
      // keep token; let auth context handle redirect
    }
    return Promise.reject(err);
  }
);

export function setToken(token) {
  if (token) localStorage.setItem('proof_token', token);
  else localStorage.removeItem('proof_token');
}

export function getToken() {
  return localStorage.getItem('proof_token');
}
