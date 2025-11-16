import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data?.message || 'Success');
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Health check
export const checkHealth = () => api.get('/plant-services/health');

// Plants
export const identifyPlant = (formData) => api.post('/identify', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 30000, // 30 second timeout for plant identification
});
export const getPlants = () => api.get('/plants');
export const getPlantById = (id) => api.get(`/plants/${id}`);
export const verifyPlant = (id, data) => api.put(`/plants/${id}/verify`, data);

// Reports
export const generatePDF = (plantId) => api.get(`/reports/pdf/${plantId}`);
export const exportToExcel = (filters) => api.post('/reports/excel', filters);

// Translations
export const translateText = (data) => api.post('/translations', data);

export default api;