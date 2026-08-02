/**
 * Auth page — login/register forms and profile view.
 */
let isLoginMode = true;

async function renderAuth() {
  const app = document.getElementById('app');
  if (API.user) {
    return renderProfile();
  }

  app.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <h2 class="modal__title" style="text-align:center;">${isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
        <form id="authForm">
          ${!isLoginMode ? `
            <div class="form-group">
              <label>Username</label>
              <input name="username" required placeholder="john_doe" />
            </div>
          ` : ''}
          <div class="form-group">
            <label>Email</label>
            <input name="email" type="email" required placeholder="john@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input name="password" type="password" required placeholder="••••••••" />
          </div>
          ${!isLoginMode ? `
            <div class="form-row">
              <div class="form-group">
                <label>Age</label>
                <input name="age" type="number" />
              </div>
              <div class="form-group">
                <label>Gender</label>
                <select name="gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ` : ''}
          <button type="submit" class="btn btn--primary btn--block" style="margin-top:1rem;">
            ${isLoginMode ? 'Log In' : 'Register'}
          </button>
        </form>
        <div class="auth-toggle">
          ${isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button class="btn btn--ghost btn--sm" onclick="isLoginMode=!isLoginMode;renderAuth()">
            ${isLoginMode ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    if (body.age) body.age = parseInt(body.age);

    try {
      const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
      const data = await API.post(endpoint, body);
      API.setAuth(data.token, data.user);
      window.dispatchEvent(new Event('auth-changed'));
      showToast(`Welcome ${data.user.username}!`);
      window.location.hash = '#/';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const [profile, myReviews] = await Promise.all([
      API.get('/auth/me'),
      API.get(`/reviews/user/${API.user.user_id}`)
    ]);

    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">My Profile</h1>
        <p class="page-header__subtitle">${escapeHtml(profile.username)} · ${escapeHtml(profile.email)}</p>
      </div>

      <div class="section">
        <h2 class="section__title">My Reviews (${myReviews.length})</h2>
        <div class="grid grid--2">
          ${myReviews.map(r => `
            <div class="card">
              <div class="review__header">
                <div>
                  <div style="font-weight:600;color:var(--accent);font-size:0.85rem;margin-bottom:0.2rem;">
                    ${escapeHtml(r.brand_name || '')}
                  </div>
                  <a href="#/perfumes/${r.perfume_id}" style="font-family:var(--font-heading);font-weight:700;font-size:1.1rem;display:block;">
                    ${escapeHtml(r.perfume_name)}
                  </a>
                </div>
                <div style="text-align:right;">
                  <div>${renderStars(r.rating)}</div>
                  <span class="review__date">${new Date(r.review_date).toLocaleDateString()}</span>
                </div>
              </div>
              ${r.comment ? `<div class="review__comment">${escapeHtml(r.comment)}</div>` : ''}
              <button class="btn btn--danger btn--sm" style="margin-top:1rem;" onclick="deleteReview(${r.review_id})">Delete Review</button>
            </div>
          `).join('') || '<div class="empty"><div class="empty__text">You haven\'t reviewed any perfumes yet.</div></div>'}
        </div>
      </div>

      <button class="btn btn--secondary" onclick="logout()">Log Out</button>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

function logout() {
  API.setAuth(null, null);
  window.dispatchEvent(new Event('auth-changed'));
  window.location.hash = '#/';
  showToast('Logged out');
}

async function deleteReview(id) {
  if (!confirm('Are you sure you want to delete this review?')) return;
  try {
    await API.delete(`/reviews/${id}`);
    showToast('Review deleted');
    renderProfile();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
