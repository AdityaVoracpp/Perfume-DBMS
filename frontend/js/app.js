/**
 * Main application router and initializer.
 */
const routes = {
  '/': renderHome,
  '/perfumes': renderPerfumes,
  '/brands': renderBrands,
  '/notes': renderNotes,
  '/search': renderSearch,
  '/auth': renderAuth,
  '/ai': renderAI,
};

async function router() {
  const hash = window.location.hash || '#/';
  const path = hash.split('?')[0].replace('#', '');
  const segments = path.split('/').filter(Boolean);

  // Dynamic routes (e.g. /perfumes/1)
  if (segments[0] === 'perfumes' && segments[1]) {
    await renderPerfumeDetail(segments[1]);
  } else if (segments[0] === 'brands' && segments[1]) {
    await renderBrandDetail(segments[1]);
  } else if (segments[0] === 'notes' && segments[1]) {
    await renderNoteDetail(segments[1]);
  } else {
    // Static routes
    const renderFn = routes[path] || routes['/'];
    await renderFn();
  }

  updateNavActiveState(path);
}

function updateNavActiveState(path) {
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.remove('active');
    const target = link.getAttribute('href').replace('#', '');
    if (target === path || (path.startsWith(target) && target !== '/')) {
      link.classList.add('active');
    }
  });
}

function updateNavAuth() {
  const container = document.getElementById('navAuth');
  if (API.user) {
    container.innerHTML = `
      <span class="nav__user">Hey, <strong>${escapeHtml(API.user.username)}</strong></span>
      <a href="#/auth" class="btn btn--primary btn--sm">Profile</a>
    `;
  } else {
    container.innerHTML = `<a href="#/auth" class="btn btn--secondary btn--sm">Log In</a>`;
  }
}

// ─── Initialization ───
window.addEventListener('hashchange', router);
window.addEventListener('auth-changed', updateNavAuth);

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});
// Close mobile menu on link click
document.getElementById('navLinks').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    document.getElementById('navLinks').classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  Modal.init();
  updateNavAuth();
  router();
});
