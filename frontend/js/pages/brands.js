/**
 * Brands page — list and detail views.
 * Showcases: Brand → BrandType, Brand → Perfume (1:N), aggregate COUNT
 */
async function renderBrands() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const brands = await API.get('/brands');
    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">Brands</h1>
        <p class="page-header__subtitle">${brands.length} perfume houses from around the world</p>
      </div>
      <div class="grid grid--4">
        ${brands.map(b => `
          <div class="card brand-card" onclick="window.location.hash='#/brands/${b.brand_id}'">
            <div class="brand-card__icon">${b.brand_name[0]}</div>
            <div class="brand-card__name">${escapeHtml(b.brand_name)}</div>
            <div class="brand-card__meta">${escapeHtml(b.origin_country || 'Unknown')} · ${escapeHtml(b.brand_type || 'N/A')}</div>
            <div class="brand-card__count">${b.perfume_count} perfumes</div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

async function renderBrandDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const brand = await API.get(`/brands/${id}`);
    app.innerHTML = `
      <a href="#/brands" class="btn btn--ghost btn--sm" style="margin-bottom:1.5rem;">← Back to Brands</a>
      <div class="page-header">
        <h1 class="page-header__title">${escapeHtml(brand.brand_name)}</h1>
        <p class="page-header__subtitle">
          ${escapeHtml(brand.origin_country || '')} ${brand.brand_type ? `· ${escapeHtml(brand.brand_type)}` : ''}
          · ${brand.perfumes?.length || 0} perfumes
        </p>
      </div>
      <div class="grid grid--3">
        ${(brand.perfumes || []).map(p => `
          <div class="card perfume-card" onclick="window.location.hash='#/perfumes/${p.perfume_id}'">
            <img class="perfume-card__img" src="${p.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%22100%22%3E%3Crect width=%2280%22 height=%22100%22 fill=%22%231a1a2e%22/%3E%3C/svg%3E'}" alt="" loading="lazy" />
            <div class="perfume-card__info">
              <div class="perfume-card__name">${escapeHtml(p.name)}</div>
              <div class="perfume-card__meta">
                <span>${genderIcon(p.gender)} ${p.gender || ''}</span>
                <span>${p.release_year || ''}</span>
                ${p.longevity ? `<span class="perf-badge ${perfBadgeClass(p.longevity)}" style="font-size:0.65rem;padding:0.15rem 0.4rem;">${p.longevity}</span>` : ''}
              </div>
              <div class="perfume-card__price">${p.price ? `$${parseFloat(p.price).toFixed(0)}` : ''}</div>
            </div>
          </div>
        `).join('') || '<div class="empty"><div class="empty__text">No perfumes found.</div></div>'}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}
