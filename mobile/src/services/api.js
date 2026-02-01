import axios from 'axios';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.EXPO_PUBLIC_API_URL) return window.EXPO_PUBLIC_API_URL;
    return 'http://localhost:8000/api';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

api.interceptors.response.use(
  response => response,
  error => {
    return Promise.reject(error);
  }
);

export const chaptersApi = {
  getAll: () => api.get('/chapters'),
  getById: (id) => api.get(`/chapters/${id}`),
  getLesson: (chapterId, lessonId) => api.get(`/chapters/${chapterId}/lessons/${lessonId}`),
};

export const questionsApi = {
  get: (params = {}) => api.get('/questions', { params }),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  getProgress: () => api.get('/user/progress'),
  completeLesson: (data) => api.post('/user/lesson/complete', data),
  submitAnswer: (data) => api.post('/user/answer', data),
  resetProgress: () => api.post('/user/reset-progress'),
};

export default api;
