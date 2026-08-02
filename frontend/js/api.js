/**
 * API Client — handles all fetch calls, auth token, and error handling.
 */
const API = {
  BASE: '/api',
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${this.BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data.error || `Request failed (${res.status})`;
      if (res.status === 401) {
        this.setAuth(null, null);
        window.dispatchEvent(new Event('auth-changed'));
      }
      throw new Error(msg);
    }
    return data;
  },

  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); },
};

// ─── Toast helper ───
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Render helpers ───
function renderStars(rating, size = '') {
  const full = Math.round(rating || 0);
  return Array.from({ length: 5 }, (_, i) =>
    `<span class="star ${i < full ? 'star--filled' : ''}"${size ? ` style="font-size:${size}"` : ''}>★</span>`
  ).join('');
}

function perfBadgeClass(val) {
  if (!val) return '';
  const v = val.toLowerCase();
  if (v === 'poor' || v === 'soft') return 'perf-badge--poor';
  if (v === 'moderate') return 'perf-badge--moderate';
  if (v === 'long lasting' || v === 'heavy') return 'perf-badge--long';
  return 'perf-badge--beast';
}

function genderIcon(g) {
  if (g === 'Male') return '♂';
  if (g === 'Female') return '♀';
  return '⚤';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
