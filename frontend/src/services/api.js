import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    // Backend OAuth2 expects URL encoded form parameters (username/password)
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    
    const response = await api.post('/api/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  
  register: async (email, password, fullName, unitNumber, role = 'resident') => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
      unit_number: unitNumber,
      role
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const complaintService = {
  create: async (title, description, category, photoFile) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    
    const response = await api.post('/api/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  list: async (filters = {}) => {
    const response = await api.get('/api/complaints', { params: filters });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/api/complaints/${id}`);
    return response.data;
  },
  
  updateStatus: async (id, status, priority, note) => {
    const response = await api.put(`/api/complaints/${id}/status`, {
      status,
      priority,
      note
    });
    return response.data;
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/api/complaints/dashboard');
    return response.data;
  }
};

export const noticeService = {
  create: async (title, content, isImportant) => {
    const response = await api.post('/api/notices', {
      title,
      content,
      is_important: isImportant
    });
    return response.data;
  },
  
  list: async () => {
    const response = await api.get('/api/notices');
    return response.data;
  }
};

export const settingsService = {
  list: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },
  
  update: async (key, value) => {
    const response = await api.put(`/api/settings/${key}`, { value });
    return response.data;
  }
};

export default api;
export { API_URL };
