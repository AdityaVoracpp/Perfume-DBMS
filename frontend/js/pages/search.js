/**
 * Advanced Search page — multi-dimensional filtering.
 * Showcases: Dynamic WHERE + HAVING across all junction tables and ENUMs.
 * This is the most powerful demonstration of the schema's M:N tagging design.
 */
async function renderSearch() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const [seasons, occasions, categories, brandtypes, notes] = await Promise.all([
      API.get('/lookups/seasons'),
      API.get('/lookups/occasions'),
      API.get('/lookups/categories'),
      API.get('/lookups/brandtypes'),
      API.get('/lookups/notes'),
    ]);

    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">Advanced Search</h1>
        <p class="page-header__subtitle">Filter across seasons, occasions, categories, notes, performance, and more</p>
      </div>

      <div class="search-layout">
        <div class="search-filters card card--no-hover">
          <form id="searchForm">
            <div class="filter-section">
              <div class="filter-section__title">Text Search</div>
              <input name="q" placeholder="Search perfume or brand name..." />
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Gender</div>
              <select name="gender" style="width:100%;">
                <option value="">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Price Range</div>
              <div style="display:flex;gap:0.5rem;">
                <input name="minPrice" type="number" placeholder="Min $" style="width:50%;" />
                <input name="maxPrice" type="number" placeholder="Max $" style="width:50%;" />
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Longevity</div>
              <select name="longevity">
                <option value="">Any</option>
                <option value="Poor">Poor</option>
                <option value="Moderate">Moderate</option>
                <option value="Long Lasting">Long Lasting</option>
                <option value="Beast">Beast</option>
              </select>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Sillage</div>
              <select name="sillage">
                <option value="">Any</option>
                <option value="Soft">Soft</option>
                <option value="Moderate">Moderate</option>
                <option value="Heavy">Heavy</option>
                <option value="Enormous">Enormous</option>
              </select>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Seasons</div>
              <div class="filter-checks">
                ${seasons.map(s => `<label class="filter-check"><input type="checkbox" name="season_ids" value="${s.season_id}" /> ${escapeHtml(s.name)}</label>`).join('')}
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Occasions</div>
              <div class="filter-checks">
                ${occasions.map(o => `<label class="filter-check"><input type="checkbox" name="occasion_ids" value="${o.occasion_id}" /> ${escapeHtml(o.name)}</label>`).join('')}
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Categories</div>
              <div class="filter-checks">
                ${categories.map(c => `<label class="filter-check"><input type="checkbox" name="category_ids" value="${c.category_id}" /> ${escapeHtml(c.name)}</label>`).join('')}
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-section__title">Brand Type</div>
              <div class="filter-checks">
                ${brandtypes.map(bt => `<label class="filter-check"><input type="checkbox" name="brand_type_ids" value="${bt.brand_type_id}" /> ${escapeHtml(bt.type_name)}</label>`).join('')}
              </div>
            </div>

            <button type="submit" class="btn btn--primary btn--block" style="margin-top:1rem;">Search</button>
            <button type="reset" class="btn btn--ghost btn--block btn--sm" style="margin-top:0.5rem;">Clear Filters</button>
          </form>
        </div>

        <div id="searchResults">
          <div class="empty"><div class="empty__icon">🔍</div><div class="empty__text">Use the filters to find your perfect fragrance.</div></div>
        </div>
      </div>
    `;

    const form = document.getElementById('searchForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const resultsDiv = document.getElementById('searchResults');
      resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

      const fd = new FormData(form);
      const params = new URLSearchParams();
      if (fd.get('q')) params.set('q', fd.get('q'));
      if (fd.get('gender')) params.set('gender', fd.get('gender'));
      if (fd.get('minPrice')) params.set('minPrice', fd.get('minPrice'));
      if (fd.get('maxPrice')) params.set('maxPrice', fd.get('maxPrice'));
      if (fd.get('longevity')) params.set('longevity', fd.get('longevity'));
      if (fd.get('sillage')) params.set('sillage', fd.get('sillage'));

      const sids = fd.getAll('season_ids');
      const oids = fd.getAll('occasion_ids');
      const cids = fd.getAll('category_ids');
      const btids = fd.getAll('brand_type_ids');
      if (sids.length) params.set('season_ids', sids.join(','));
      if (oids.length) params.set('occasion_ids', oids.join(','));
      if (cids.length) params.set('category_ids', cids.join(','));
      if (btids.length) params.set('brand_type_ids', btids.join(','));

      try {
        const results = await API.get(`/search?${params.toString()}`);
        if (results.length === 0) {
          resultsDiv.innerHTML = '<div class="empty"><div class="empty__icon">🤷</div><div class="empty__text">No perfumes match your filters. Try broadening your search.</div></div>';
        } else {
          resultsDiv.innerHTML = `
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">${results.length} result${results.length>1?'s':''} found</p>
            <div class="grid grid--2">
              ${results.map(p => renderPerfumeCard(p)).join('')}
            </div>
          `;
        }
      } catch (err) {
        resultsDiv.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
      }
    });

    form.addEventListener('reset', () => {
      setTimeout(() => {
        document.getElementById('searchResults').innerHTML = '<div class="empty"><div class="empty__icon">🔍</div><div class="empty__text">Use the filters to find your perfect fragrance.</div></div>';
      }, 0);
    });
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}
