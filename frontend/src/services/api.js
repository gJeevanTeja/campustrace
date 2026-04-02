import axios from 'axios';

// ─── API Configuration ──────────────────────────────────────────────────────
const getBaseUrl = () => {
    // 1. Environment variable (from .env or Vercel config)
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    
    // 2. Browser origin (if combined deployment on Railway)
    if (typeof window !== 'undefined' && window.location.origin.includes('up.railway.app')) {
       return window.location.origin + "/api/";
    }
    
    // 3. Default Fallback
    return "http://localhost:8000/api/";
};

const BASE_URL = getBaseUrl();
console.log("🚀 UniTrace API Base:", BASE_URL);

// Derive WebSocket URL from API URL automatically
const getWsBase = (apiUrl) => {
  // 1. Explicit environment override
  if (process.env.REACT_APP_WS_URL) return process.env.REACT_APP_WS_URL;
  
  // 2. Automatic discovery from active API URL
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    // Remove /api/ suffix for WebSocket root
    return `${protocol}//${url.host}`;
  } catch (e) {
    return "ws://localhost:8000";
  }
};

const WS_BASE = getWsBase(BASE_URL);


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

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Explicitly Distinguish Network/CORS/Timeout Error
    if (!error.response) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("🌐 Network Error Details:", {
            message: error.message,
            code: error.code,
            config: originalRequest?.url
        });
      }
      // Attach a custom flag to the error for components to recognize
      error.isNetworkError = true;
      return Promise.reject(error);
    }

    // 2. Auth Errors (401)
    const isAuthRequest = originalRequest.url.includes('auth/login/') ||
      originalRequest.url.includes('auth/register/') ||
      originalRequest.url.includes('auth/verify-otp/') ||
      originalRequest.url.includes('auth/token/refresh/');

    if (error.response.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}auth/token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/welcome';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);


// ─── API Methods ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('auth/register/', data),
  
  // Robust login that normalizes diverse backend response formats (standard DRF vs event/details)
  login: async (credentials) => {
    try {
      const response = await api.post('auth/login/', credentials);
      const data = response.data;
      
      // Normalize Success Data
      // 1. Details Pattern: { event: 'login_success', details: { user_id, email } }
      // 2. Standard Pattern: { success: true, user: { ... }, tokens: { access, refresh } }
      const normalized = {
        success: true,
        user: data.user || (data.details ? { id: data.details.user_id, email: data.details.email } : null),
        tokens: data.tokens || { access: data.token || data.access, refresh: data.refresh },
        message: data.message || (data.event === 'login_success' ? 'Login Successful' : ''),
        raw: data // Keep original for context
      };
      
      // Ensure we have some role if missing (fallback to student)
      if (normalized.user && !normalized.user.role) {
         normalized.user.role = 'student'; 
      }
      
      return { data: normalized };
    } catch (error) {
       // Log detailed auth failure in dev mode
       if (process.env.NODE_ENV !== 'production') {
          console.group('🔐 Auth Failure Trace');
          console.error('Request:', credentials.email);
          if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
          } else {
            console.error('Error:', error.message);
          }
          console.groupEnd();
       }
       throw error;
    }
  },
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
  getMyClaims: () => api.get('items/my-claims/'),
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
  initiatePayment: (itemId, data) => api.post(`payments/initiate/${itemId}/`, data),
  verifyPayment: (data) => api.post(`payments/verify/`, data),
  releasePayment: (itemId) => api.post(`payments/release/${itemId}/`),
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