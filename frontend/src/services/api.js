import axios from 'axios';

// ─── API Configuration ──────────────────────────────────────────────────────
const API_IP = process.env.REACT_APP_API_IP || 'localhost';
const BASE_URL = `http://${API_IP}:8000/api/`;
const WS_BASE = `ws://${API_IP}:8000`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});
console.log("Axios initialized with timeout:", api.defaults.timeout);

// ── Attach JWT token & Handle FormData headers ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Automatically let the browser set boundaries for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

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
    const isAuthRequest = original.url.includes('auth/login/') || 
                         original.url.includes('auth/register/') || 
                         original.url.includes('auth/verify-otp/') ||
                         original.url.includes('auth/token/refresh/');

    if (error.response.status === 401 && !original._retry && !isAuthRequest) {
      console.log("Interceptor: 401 detected on non-auth request:", original.url);
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
  updateAvatar: (formData) => api.post('auth/profile/avatar/', formData),
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
  getLeaderboard: () => api.get('auth/leaderboard/'),
};

export const adminRequestAPI = {
  submitRequest: (formData) => api.post('administration/requests/', formData),
  getRequests: () => api.get('administration/requests/'),
  approveRequest: (id, collegeId) => api.post(`administration/requests/${id}/approve/`, { college_id: collegeId }),
  rejectRequest: (id) => api.post(`administration/requests/${id}/reject/`),
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
      } else if (typeof v === 'object' && !(v instanceof File) && !(v instanceof Blob)) {
        form.append(k, JSON.stringify(v));
      } else {
        form.append(k, v);
      }
    });
    return api.post('items/', form);
  },
  update: (id, data) => api.put(`items/${id}/`, data),
  delete: (id) => api.delete(`items/${id}/`),
  claim: (id) => api.post(`items/${id}/claim/`),
  claimItem: (id) => api.post(`items/${id}/claim/`),
  addPhotos: (id, photos) => {
    const form = new FormData();
    photos.forEach(p => form.append('photos', p));
    return api.post(`items/${id}/photos/`, form);
  },
  generateElectronicQuestions: (formData) => api.post('items/generate-questions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verifyClaim: (id, answers) => api.post(`items/${id}/verify-claim/`, { answers }),
  confirmReturn: (itemId, claimCode) => api.post(`items/${itemId}/confirm-return/`, { claim_code: claimCode }),
  approveClaim: (claimId) => api.post(`items/claim/${claimId}/approve/`),
  rejectClaim: (claimId) => api.post(`items/claim/${claimId}/reject/`),
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

// ── Colleges (Global) ─────────────────────────────────────────────
export const collegesAPI = {
  getCategories: () => api.get('categories/'),
  getBlocks: () => api.get('blocks/'),
};

// ── Admin ─────────────────────────────────────────────────────────
export const adminAPI = {
  // Analytics
  getAnalytics: () => api.get('admin/dashboard/'),
  getGlobalAnalytics: () => api.get('analytics/global/'),
  getItemReports: (params) => api.get('admin/item-reports/', { params }),
  exportAnalytics: (format) => api.get(`analytics/export/?format=${format}`, { responseType: 'blob' }),
  exportCSV: (params) => api.get('admin/export/csv/', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('admin/export/excel/', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('admin/export/pdf/', { params, responseType: 'blob' }),

  // Colleges (Super Admin)
  getColleges: () => api.get('admin/manage/'),
  getCampusLocations: () => api.get('admin/campus-locations/'),
  createCollege: (formData) => api.post('admin/manage/', formData),
  updateCollege: (id, data) => api.patch(`admin/manage/${id}/`, data),
  deleteCollege: (id) => api.delete(`admin/manage/${id}/`),

  // Blocks
  getBlocks: () => api.get('admin/blocks/'),
  createBlock: (formData, config = {}) => api.post('admin/blocks/', formData, config),
  updateBlock: (id, data, config = {}) => api.patch(`admin/blocks/${id}/`, data, config),
  deleteBlock: (id) => api.delete(`admin/blocks/${id}/`),

  // Categories
  getCategories: () => api.get('admin/categories/'),
  createCategory: (formData, config = {}) => api.post('admin/categories/', formData, config),
  updateCategory: (id, data, config = {}) => api.patch(`admin/categories/${id}/`, data, config),
  deleteCategory: (id) => api.delete(`admin/categories/${id}/`),

  // User Management
  getUsers: (params) => api.get('auth/admin/users/', { params }),
  userAction: (id, action) => api.patch(`auth/admin/users/${id}/${action}/`),
  getUserActivity: (id) => api.get(`auth/admin/users/${id}/activity/`),

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