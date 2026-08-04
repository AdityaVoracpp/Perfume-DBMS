document.addEventListener('DOMContentLoaded', () => {
  const appContent = document.getElementById('app-content');
  let currentUser = null;
  let currentPerfumeId = null;

  // Navigation
  document.getElementById('nav-dashboard').addEventListener('click', () => loadDashboard());
  document.getElementById('nav-catalog').addEventListener('click', () => loadCatalog());
  document.getElementById('nav-login').addEventListener('click', () => loadLogin());
  document.getElementById('nav-register').addEventListener('click', () => loadRegister());
  document.getElementById('nav-logout').addEventListener('click', () => {
    api.setToken(null);
    currentUser = null;
    updateNav();
    loadDashboard();
  });

  function updateNav() {
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const navLogout = document.getElementById('nav-logout');
    const userSpan = document.getElementById('current-user');
    
    if (api.getToken() && currentUser) {
      navLogin.classList.add('hidden');
      if (navRegister) navRegister.classList.add('hidden');
      navLogout.classList.remove('hidden');
      userSpan.textContent = currentUser.username;
    } else {
      navLogin.classList.remove('hidden');
      if (navRegister) navRegister.classList.remove('hidden');
      navLogout.classList.add('hidden');
    }
  }

  function renderTemplate(templateId) {
    const template = document.getElementById(templateId);
    appContent.innerHTML = '';
    appContent.appendChild(template.content.cloneNode(true));
  }

  // --- Views ---

  async function loadDashboard() {
    renderTemplate('tpl-dashboard');
    try {
      const data = await api.getDashboard();
      
      document.getElementById('stat-perfumes').textContent = data.stats.total_perfumes;
      document.getElementById('stat-brands').textContent = data.stats.total_brands;
      document.getElementById('stat-reviews').textContent = data.stats.total_reviews;

      const categoryCtx = document.getElementById('category-chart').getContext('2d');
      new Chart(categoryCtx, {
        type: 'pie',
        data: {
          labels: data.categoryData.map(c => c.name),
          datasets: [{
            data: data.categoryData.map(c => c.count),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const label = data.categoryData[index].name;
              loadCatalog({ category: label });
            }
          }
        }
      });

      const noteCtx = document.getElementById('note-chart').getContext('2d');
      new Chart(noteCtx, {
        type: 'pie',
        data: {
          labels: data.noteData.map(n => n.note_name),
          datasets: [{
            data: data.noteData.map(n => n.count),
            backgroundColor: [
              '#FF9F40', '#9966FF', '#4BC0C0', '#FFCE56', '#36A2EB', '#FF6384', '#C9CBCF', '#E7E9ED', '#8B008B', '#00FA9A'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              const label = data.noteData[index].note_name;
              loadCatalog({ note: label });
            }
          }
        }
      });
    } catch (err) {
      console.error(err);
      appContent.innerHTML = '<p class="error-msg">Failed to load dashboard. Ensure backend is running.</p>';
    }
  }

  async function loadCatalog(initialParams = null) {
    renderTemplate('tpl-catalog');
    
    let currentNoteFilter = initialParams ? initialParams.note : null;
    let currentPage = 1;
    const limit = 20;

    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const pageInfo = document.getElementById('page-info');

    const getSearchParams = () => {
      const gender = document.getElementById('filter-gender').value;
      const season = document.getElementById('filter-season').value;
      const category = document.getElementById('filter-category').value;
      
      const params = { page: currentPage, limit };
      if (gender) params.gender = gender;
      if (season) params.season = season;
      if (category) params.category = category;
      if (currentNoteFilter) params.note = currentNoteFilter;
      return params;
    };

    document.getElementById('btn-search').addEventListener('click', async () => {
      currentPage = 1; // Reset to page 1 on new search
      await doSearch(getSearchParams());
    });

    btnPrev.addEventListener('click', async () => {
      if (currentPage > 1) {
        currentPage--;
        await doSearch(getSearchParams());
        window.scrollTo(0, 0);
      }
    });

    btnNext.addEventListener('click', async () => {
      currentPage++;
      await doSearch(getSearchParams());
      window.scrollTo(0, 0);
    });

    if (initialParams) {
      if (initialParams.category) {
        const catFilter = document.getElementById('filter-category');
        if (catFilter) catFilter.value = initialParams.category;
      }
      await doSearch(getSearchParams());
    } else {
      await doSearch(getSearchParams());
    }
  }

  async function doSearch(params) {
    const grid = document.getElementById('catalog-grid');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    const pageInfo = document.getElementById('page-info');
    
    grid.innerHTML = '<p>Loading...</p>';
    
    try {
      const data = await api.searchPerfumes(params);
      grid.innerHTML = '';
      
      if (data.results.length === 0) {
        grid.innerHTML = '<p>No perfumes found matching these criteria.</p>';
        btnPrev.style.visibility = 'hidden';
        btnNext.style.visibility = 'hidden';
        pageInfo.textContent = 'Page 0 of 0';
        return;
      }
      
      pageInfo.textContent = `Page ${data.page} of ${data.totalPages || 1}`;
      btnPrev.style.visibility = data.page > 1 ? 'visible' : 'hidden';
      btnNext.style.visibility = data.page < (data.totalPages || 1) ? 'visible' : 'hidden';
      
      data.results.forEach(p => {
        grid.appendChild(createPerfumeCard(p));
      });
    } catch (err) {
      grid.innerHTML = `<p class="error-msg">Search failed: ${err.error || err.message}</p>`;
    }
  }

  function createPerfumeCard(p) {
    const tpl = document.getElementById('tpl-perfume-card');
    const el = tpl.content.cloneNode(true).firstElementChild;
    
    el.querySelector('.card-img').src = p.image_url || 'https://via.placeholder.com/200';
    el.querySelector('.card-brand').textContent = p.brand_name || 'Unknown Brand';
    el.querySelector('.card-title').textContent = p.name;
    el.querySelector('.meta-gender').textContent = p.gender || 'Unknown';
    el.querySelector('.meta-price').textContent = `$${p.price || '0.00'}`;
    
    if (p.avg_rating) {
      const rating = Number(p.avg_rating).toFixed(1);
      el.querySelector('.card-rating').textContent = `★ ${rating} (${p.review_count || 0})`;
    }

    el.querySelector('.btn-view-details').addEventListener('click', () => loadDetail(p.perfume_id));
    return el;
  }

  async function loadDetail(id) {
    currentPerfumeId = id;
    renderTemplate('tpl-detail');
    
    document.getElementById('btn-back').addEventListener('click', () => loadCatalog());

    try {
      const p = await api.getPerfume(id);
      
      document.getElementById('detail-img').src = p.image_url || 'https://via.placeholder.com/300';
      document.getElementById('detail-brand').textContent = p.brand_name;
      document.getElementById('detail-title').textContent = p.name;
      document.getElementById('detail-desc').textContent = p.description || 'No description available.';
      document.getElementById('detail-gender').textContent = p.gender;
      document.getElementById('detail-year').textContent = p.release_year;
      document.getElementById('detail-price').textContent = `$${p.price}`;
      
      document.getElementById('detail-longevity').textContent = p.longevity || 'N/A';
      document.getElementById('detail-sillage').textContent = p.sillage || 'N/A';

      fillList('detail-notes', p.notes ? p.notes.map(n => `${n.note_name} (${n.note_type})`) : []);
      fillList('detail-categories', p.categories || []);
      fillList('detail-seasons', p.seasons || []);

      renderReviews(p.reviews || []);

      // Auth state for review form
      if (api.getToken()) {
        document.getElementById('add-review-box').classList.remove('hidden');
        document.getElementById('login-prompt-review').classList.add('hidden');
        
        document.getElementById('btn-submit-review').onclick = async () => {
          const rating = document.getElementById('review-rating').value;
          const comment = document.getElementById('review-comment').value;
          const errorMsg = document.getElementById('review-error');
          
          try {
            await api.addReview({ perfume_id: id, rating, comment });
            loadDetail(id); // reload
          } catch (err) {
            errorMsg.textContent = err.details || err.error || 'Failed to submit review';
          }
        };
      } else {
        document.getElementById('link-login-review').onclick = (e) => {
          e.preventDefault();
          loadLogin();
        };
      }

    } catch (err) {
      console.error(err);
      appContent.innerHTML = '<p class="error-msg">Failed to load details.</p>';
    }
  }

  function fillList(elementId, items) {
    const ul = document.getElementById(elementId);
    if (items.length === 0) {
      ul.innerHTML = '<li>None</li>';
      return;
    }
    ul.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }

  function renderReviews(reviews) {
    const list = document.getElementById('reviews-list');
    if (reviews.length === 0) {
      list.innerHTML = '<p>No reviews yet.</p>';
      return;
    }
    
    list.innerHTML = reviews.map(r => `
      <div class="review-item">
        <div class="review-head">
          <strong>${r.username}</strong>
          <span>★ ${r.rating}</span>
        </div>
        <p class="review-date">${new Date(r.review_date).toLocaleDateString()}</p>
        <p>${r.comment || ''}</p>
      </div>
    `).join('');
  }

  function loadLogin() {
    renderTemplate('tpl-login');
    
    document.getElementById('btn-do-login').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const errorMsg = document.getElementById('login-error');
      
      try {
        const data = await api.login(email, pass);
        api.setToken(data.token);
        currentUser = data.user;
        updateNav();
        
        if (currentPerfumeId) {
          loadDetail(currentPerfumeId);
        } else {
          loadDashboard();
        }
      } catch (err) {
        errorMsg.textContent = err.error || 'Login failed';
      }
    });

    const registerLink = document.getElementById('link-to-register');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadRegister();
      });
    }
  }

  function loadRegister() {
    renderTemplate('tpl-register');
    
    document.getElementById('link-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      loadLogin();
    });

    document.getElementById('btn-do-register').addEventListener('click', async () => {
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;
      const age = document.getElementById('reg-age').value;
      const gender = document.getElementById('reg-gender').value;
      const errorMsg = document.getElementById('reg-error');
      
      try {
        await api.register({ username, email, password: pass, age: age ? parseInt(age) : null, gender: gender || null });
        // Auto login after successful registration
        const data = await api.login(email, pass);
        api.setToken(data.token);
        currentUser = data.user;
        updateNav();
        
        loadDashboard();
      } catch (err) {
        errorMsg.textContent = err.error || 'Registration failed';
      }
    });
  }

  // Init
  window.app = { loadDetail, loadCatalog };
  updateNav();
  loadDashboard();
});
