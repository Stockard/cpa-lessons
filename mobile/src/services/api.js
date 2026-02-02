import axios from 'axios';

const STORAGE_KEY = 'cpa_visitor_id';
let visitorIdPromise = null;
let cachedVisitorId = null;

function isValidId(id) {
  return id && id !== 'null' && id !== 'undefined' && typeof id === 'string' && id.trim().length > 0;
}

function saveVisitorId(id) {
  if (!isValidId(id)) return;
  cachedVisitorId = id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  } catch (e) {
    console.warn('[API] localStorage set error:', e);
  }
}

function getCachedVisitorId() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[API] localStorage get error:', e);
  }
  return null;
}

async function fetchAndSaveVisitorId() {
  try {
    const response = await axios.get(getApiBase() + '/user/profile', {
      withCredentials: true,
      timeout: 5000,
    });
    const headerValue = response.headers['x-cpa-visitor'] || response.headers['X-CPA-Visitor'];
    if (isValidId(headerValue)) {
      saveVisitorId(headerValue);
      return headerValue;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function getOrCreateVisitorId() {
  if (cachedVisitorId) return cachedVisitorId;

  const localStorageId = getCachedVisitorId();
  if (isValidId(localStorageId)) {
    cachedVisitorId = localStorageId;
    return cachedVisitorId;
  }

  if (!visitorIdPromise) {
    visitorIdPromise = fetchAndSaveVisitorId();
  }

  const newId = await visitorIdPromise;
  visitorIdPromise = null;

  if (isValidId(newId)) {
    saveVisitorId(newId);
    return newId;
  }

  const tempId = 'offline-' + Date.now();
  saveVisitorId(tempId);
  return tempId;
}

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    if (window.EXPO_PUBLIC_API_URL) return window.EXPO_PUBLIC_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    return '/api';
  }
  if (process.env.VERCEL) {
    return '/api';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    const visitorId = await getOrCreateVisitorId();
    if (visitorId) {
      config.headers['X-CPA-Visitor'] = visitorId;
    }
    return config;
  },
  (error) => Promise.reject(error)
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

export { getOrCreateVisitorId };

export default api;
