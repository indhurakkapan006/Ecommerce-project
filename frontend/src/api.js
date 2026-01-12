import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'https://shop-api-lmrj.onrender.com';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export default api;
