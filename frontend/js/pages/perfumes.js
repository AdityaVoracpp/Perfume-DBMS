/**
 * Perfumes list page — catalog with pagination and sorting.
 * Showcases: Perfume + Brand JOIN, pagination, sorting
 */
let perfumesPage = 1;
let perfumesSort = 'name';
let perfumesOrder = 'ASC';

async function renderPerfumes() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const data = await API.get(`/perfumes?page=${perfumesPage}&limit=12&sort=${perfumesSort}&order=${perfumesOrder}`);
    const totalPages = Math.ceil(data.total / data.limit);

    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">Perfume Collection</h1>
        <p class="page-header__subtitle">${data.total} fragrances across all brands</p>
      </div>

      <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem; flex-wrap:wrap; align-items:center;">
        <select id="perfSort" style="width:auto;">
          <option value="name" ${perfumesSort==='name'?'selected':''}>Sort by Name</option>
          <option value="price" ${perfumesSort==='price'?'selected':''}>Sort by Price</option>
          <option value="release_year" ${perfumesSort==='release_year'?'selected':''}>Sort by Year</option>
        </select>
        <select id="perfOrder" style="width:auto;">
          <option value="ASC" ${perfumesOrder==='ASC'?'selected':''}>Ascending</option>
          <option value="DESC" ${perfumesOrder==='DESC'?'selected':''}>Descending</option>
        </select>
        ${API.user ? '<button class="btn btn--primary btn--sm" onclick="openCreatePerfumeModal()">+ Add Perfume</button>' : ''}
      </div>

      <div class="grid grid--3" id="perfumeGrid">
        ${data.perfumes.map(p => renderPerfumeCard(p)).join('')}
      </div>

      ${totalPages > 1 ? `
        <div class="pagination">
          <button class="pagination__btn" ${perfumesPage<=1?'disabled':''} onclick="perfumesPage--;renderPerfumes()">← Prev</button>
          <span class="pagination__info">Page ${perfumesPage} of ${totalPages}</span>
          <button class="pagination__btn" ${perfumesPage>=totalPages?'disabled':''} onclick="perfumesPage++;renderPerfumes()">Next →</button>
        </div>
      ` : ''}
    `;

    document.getElementById('perfSort').addEventListener('change', (e) => {
      perfumesSort = e.target.value;
      perfumesPage = 1;
      renderPerfumes();
    });
    document.getElementById('perfOrder').addEventListener('change', (e) => {
      perfumesOrder = e.target.value;
      perfumesPage = 1;
      renderPerfumes();
    });
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

async function openCreatePerfumeModal() {
  const [brands, notes, seasons, occasions, categories] = await Promise.all([
    API.get('/brands'),
    API.get('/lookups/notes'),
    API.get('/lookups/seasons'),
    API.get('/lookups/occasions'),
    API.get('/lookups/categories'),
  ]);

  Modal.open(`
    <h2 class="modal__title">Add New Perfume</h2>
    <form id="createPerfumeForm">
      <div class="form-group">
        <label>Name *</label>
        <input name="name" required placeholder="e.g. Sauvage EDP" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Brand *</label>
          <select name="brand_id" required>
            <option value="">Select brand</option>
            ${brands.map(b => `<option value="${b.brand_id}">${escapeHtml(b.brand_name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select name="gender">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unisex">Unisex</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Price ($)</label>
          <input name="price" type="number" step="0.01" placeholder="95.00" />
        </div>
        <div class="form-group">
          <label>Release Year</label>
          <input name="release_year" type="number" placeholder="2024" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Longevity</label>
          <select name="longevity">
            <option value="">None</option>
            <option value="Poor">Poor</option>
            <option value="Moderate">Moderate</option>
            <option value="Long Lasting">Long Lasting</option>
            <option value="Beast">Beast</option>
          </select>
        </div>
        <div class="form-group">
          <label>Sillage</label>
          <select name="sillage">
            <option value="">None</option>
            <option value="Soft">Soft</option>
            <option value="Moderate">Moderate</option>
            <option value="Heavy">Heavy</option>
            <option value="Enormous">Enormous</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <div style="max-height:150px;overflow-y:auto;padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-sm);">
          ${notes.map(n => `
            <label class="filter-check">
              <input type="checkbox" name="note_ids" value="${n.note_id}" />
              <span class="tag tag--${n.note_type.toLowerCase()}" style="pointer-events:none">${escapeHtml(n.note_name)}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Seasons</label>
          ${seasons.map(s => `<label class="filter-check"><input type="checkbox" name="season_ids" value="${s.season_id}" /> ${escapeHtml(s.name)}</label>`).join('')}
        </div>
        <div class="form-group">
          <label>Occasions</label>
          ${occasions.map(o => `<label class="filter-check"><input type="checkbox" name="occasion_ids" value="${o.occasion_id}" /> ${escapeHtml(o.name)}</label>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Categories</label>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
          ${categories.map(c => `<label class="filter-check"><input type="checkbox" name="category_ids" value="${c.category_id}" /> ${escapeHtml(c.name)}</label>`).join('')}
        </div>
      </div>
      <button type="submit" class="btn btn--primary btn--block" style="margin-top:1rem;">Create Perfume</button>
    </form>
  `);

  document.getElementById('createPerfumeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      name: fd.get('name'),
      brand_id: parseInt(fd.get('brand_id')),
      gender: fd.get('gender'),
      price: parseFloat(fd.get('price')) || null,
      release_year: parseInt(fd.get('release_year')) || null,
      longevity: fd.get('longevity') || null,
      sillage: fd.get('sillage') || null,
      note_ids: fd.getAll('note_ids').map(Number),
      season_ids: fd.getAll('season_ids').map(Number),
      occasion_ids: fd.getAll('occasion_ids').map(Number),
      category_ids: fd.getAll('category_ids').map(Number),
    };
    try {
      await API.post('/perfumes', body);
      Modal.close();
      showToast('Perfume created!');
      renderPerfumes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
