import axios from 'axios';

// ─── IP Configuration ──────────────────────────────────────────────────────
// Dynamically determine API IP based on how the app is loaded in the browser.
// Mobile devices connecting to the local IP will automatically use that IP.
const API_IP = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? window.location.hostname
  : (process.env.REACT_APP_API_IP || 'localhost');

// For BASE_URL and WS_BASE, prefer the current hostname's IP if not on localhost.
const BASE_URL = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? `http://${API_IP}:8000/api/`
  : (process.env.REACT_APP_API_URL || `http://${API_IP}:8000/api/`);

const WS_BASE = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? `ws://${API_IP}:8000`
  : (process.env.REACT_APP_WS_URL || `ws://${API_IP}:8000`);

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Attach JWT token ──────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auto-refresh on 401 ───────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Network error or canceled — don't retry
    if (!error.response) return Promise.reject(error);

    const original = error.config;

    if (error.response.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('auth/register/', data),
  login: (data) => api.post('auth/login/', data),
  logout: (refresh) => api.post('auth/logout/', { refresh }),
  forgotPassword: (data) => api.post('auth/forgot-password/', data),
  resetPassword: (data) => api.post('auth/reset-password/', data),
  getProfile: () => api.get('auth/profile/'),
  updateProfile: (data) => api.patch('auth/profile/', data),
  updateAvatar: (formData) => api.post('auth/profile/avatar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.post('auth/change-password/', data),
  updateLocation: (lat, lng) => api.post('auth/update-location/', { latitude: lat, longitude: lng }),
  getSettings: () => api.get('auth/settings/'),
  updateSettings: (data) => api.patch('auth/settings/', data),
  getNotificationSettings: () => api.get('auth/settings/'),
  updateNotificationSettings: (data) => api.patch('auth/settings/', data),
  sendOTP: (data) => api.post('auth/send-otp/', data),
  verifyOTP: (data) => api.post('auth/verify-otp/', data),
  googleAuth: (data) => api.post('auth/google/', data),
  getColleges: () => api.get('admin/manage/'),
  checkUsername: (username) => api.get(`auth/check-username/?username=${username}`),
};

// ── Items ─────────────────────────────────────────────────────────
export const itemsAPI = {
  getAll: (params) => api.get('items/', { params }),
  getRecent: () => api.get('items/recent/'),
  getMyItems: () => api.get('items/my-items/'),
  getById: (id, params) => api.get(`items/${id}/`, { params }),
  getNearby: (lat, lng, km) => api.get('items/nearby/', { params: { lat, lng, km: km || 2 } }),
  create: (data) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (k === 'photos' && Array.isArray(v)) {
        v.forEach(p => form.append('photos', p));
      } else {
        form.append(k, v);
      }
    });
    return api.post('items/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id, data) => api.put(`items/${id}/`, data),
  delete: (id) => api.delete(`items/${id}/`),
  claim: (id) => api.post(`items/${id}/claim/`),
  claimItem: (id) => api.post(`items/${id}/claim/`),
  addPhotos: (id, photos) => {
    const form = new FormData();
    photos.forEach(p => form.append('photos', p));
    return api.post(`items/${id}/photos/`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('notifications/', { params }),
  getUnreadCount: () => api.get('notifications/unread-count/'),
  markRead: (id) => api.post(`notifications/${id}/read/`),
  markAllRead: () => api.post('notifications/mark-all-read/'),
  deleteOne: (id) => api.delete(`notifications/${id}/delete/`),
  delete: (id) => api.delete(`notifications/${id}/delete/`),
  clearAll: () => api.delete('notifications/clear-all/'),
  toggleSound: (val) => api.post('notifications/sound/', { notification_sound: val }),
  toggleMute: (val) => api.post('notifications/mute/', { notifications_enabled: val }),
};

// ── Chat ──────────────────────────────────────────────────────────
export const chatAPI = {
  // Rooms
  startChat: (data) => api.post('chat/start/', data),
  getRooms: () => api.get('chat/'),
  getUnreadCount: () => api.get('chat/unread/'),

  // Messages
  getMessages: (roomId) => api.get(`chat/${roomId}/`),
  sendMessage: (roomId, text, type = 'text') => api.post(`chat/${roomId}/`, { message: text, message_type: type }),

  // Media
  uploadMedia: (roomId, formData) => api.post(`chat/${roomId}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMedia: (roomId, type = 'all') => api.get(`chat/${roomId}/media/`, { params: { type } }),

  // Clear Chat
  clearChat: (roomId) => api.delete(`chat/${roomId}/clear/`),

  // Search
  searchMessages: (roomId, q) => api.get(`chat/${roomId}/search/`, { params: { q } }),

  // Mute / Unmute
  muteRoom: (roomId) => api.post(`chat/${roomId}/mute/`),
  unmuteRoom: (roomId) => api.delete(`chat/${roomId}/mute/`),

  // Block / Unblock
  blockUser: (userId) => api.post(`chat/block/${userId}/`),
  unblockUser: (userId) => api.delete(`chat/block/${userId}/`),
  getBlockStatus: (userId) => api.get(`chat/block/${userId}/status/`),

  // Forward
  forward_message: (messageId, targetRoomId) => api.post('chat/forward/', {
    message_id: messageId,
    target_room_id: targetRoomId,
  }),
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminAPI = {
  // Analytics
  getAnalytics: () => api.get('admin/analytics/'),

  // Colleges (Super Admin)
  getColleges: () => api.get('admin/manage/'),
  createCollege: (formData) => api.post('admin/manage/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCollege: (id, data) => api.patch(`admin/manage/${id}/`, data),
  deleteCollege: (id) => api.delete(`admin/manage/${id}/`),

  // Blocks
  getBlocks: () => api.get('admin/blocks/'),
  createBlock: (formData) => api.post('admin/blocks/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateBlock: (id, data) => api.patch(`admin/blocks/${id}/`, data),
  deleteBlock: (id) => api.delete(`admin/blocks/${id}/`),

  // Categories
  getCategories: () => api.get('admin/categories/'),
  createCategory: (formData) => api.post('admin/categories/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, data) => api.patch(`admin/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`admin/categories/${id}/`),

  // User Management
  getUsers: (params) => api.get('auth/admin/users/', { params }),
  userAction: (id, action) => api.patch(`auth/admin/users/${id}/${action}/`),
  getUserActivity: (id) => api.get(`auth/admin/users/${id}/activity/`),

  // Auth & Onboarding
  registerAdmin: (data) => api.post('auth/register-admin/', data),
};

// ── WebSocket helpers ─────────────────────────────────────────────
export function createChatSocket(roomId) {
  const token = localStorage.getItem('access_token');
  return new WebSocket(`${WS_BASE}/ws/chat/${roomId}/?token=${token}`);
}

export function createNotificationSocket() {
  const token = localStorage.getItem('access_token');
  return new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);
}

export default api;
