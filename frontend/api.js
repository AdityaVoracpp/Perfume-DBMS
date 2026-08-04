const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

const api = {
  getToken: () => localStorage.getItem('token'),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, ...data };
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth endpoints
  login: (email, password) => api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  register: (userData) => api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  // Perfume endpoints
  getDashboard: () => api.request('/perfumes/dashboard'),
  
  searchPerfumes: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/perfumes/search?${query}`);
  },
  
  getPerfume: (id) => api.request(`/perfumes/${id}`),

  createPerfume: (perfumeData) => api.request('/perfumes', {
    method: 'POST',
    body: JSON.stringify(perfumeData)
  }),

  deletePerfume: (id) => api.request(`/perfumes/${id}`, {
    method: 'DELETE'
  }),

  // Review endpoints
  addReview: (reviewData) => api.request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  })
};

window.api = api;
