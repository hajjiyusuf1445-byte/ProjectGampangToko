import axios from 'axios';

// =====================================================
// 🎯 KONFIGURASI API PUSAT
// Jika domain Railway berubah, EDIT SATU BARIS INI SAJA!
// =====================================================
export const API_URL = 'https://projectgampangtoko-production-4798.up.railway.app/api';

// Instance axios khusus untuk seluruh aplikasi
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor JWT: token otomatis menempel di setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;