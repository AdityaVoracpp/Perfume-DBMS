/**
 * Home page — hero section with stats and featured perfumes.
 * Showcases: Aggregate COUNT queries, Perfume + Brand JOIN
 */
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const [perfumeData, brands] = await Promise.all([
      API.get('/perfumes?limit=6&sort=perfume_id&order=DESC'),
      API.get('/brands')
    ]);

    const totalPerfumes = perfumeData.total;
    const totalBrands = brands.length;

    app.innerHTML = `
      <section class="hero">
        <h1 class="hero__title">Discover Your<br>Perfect <span>Scent</span></h1>
        <p class="hero__subtitle">
          Explore a curated collection of fragrances, powered by an AI sommelier
          that knows every note, season, and occasion.
        </p>
        <div class="hero__actions">
          <a href="#/perfumes" class="btn btn--primary">Browse Collection</a>
          <a href="#/ai" class="btn btn--ai">✦ Ask ScentAI</a>
          <a href="#/search" class="btn btn--secondary">Advanced Search</a>
        </div>
        <div class="hero__stats">
          <div class="hero__stat">
            <div class="hero__stat-number">${totalPerfumes}</div>
            <div class="hero__stat-label">Perfumes</div>
          </div>
          <div class="hero__stat">
            <div class="hero__stat-number">${totalBrands}</div>
            <div class="hero__stat-label">Brands</div>
          </div>
          <div class="hero__stat">
            <div class="hero__stat-number">36</div>
            <div class="hero__stat-label">Fragrance Notes</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Latest Additions</h2>
          <a href="#/perfumes" class="section__link">View All →</a>
        </div>
        <div class="grid grid--3">
          ${perfumeData.perfumes.map(p => renderPerfumeCard(p)).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Browse by Brand</h2>
          <a href="#/brands" class="section__link">View All →</a>
        </div>
        <div class="grid grid--4">
          ${brands.slice(0, 8).map(b => `
            <div class="card brand-card" onclick="window.location.hash='#/brands/${b.brand_id}'">
              <div class="brand-card__icon">${b.brand_name[0]}</div>
              <div class="brand-card__name">${escapeHtml(b.brand_name)}</div>
              <div class="brand-card__meta">${escapeHtml(b.origin_country || '')} · ${escapeHtml(b.brand_type || '')}</div>
              <div class="brand-card__count">${b.perfume_count} perfumes</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

function renderPerfumeCard(p) {
  const imgSrc = p.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100" fill="%231a1a2e"%3E%3Crect width="80" height="100"/%3E%3C/svg%3E';
  return `
    <div class="card perfume-card" onclick="window.location.hash='#/perfumes/${p.perfume_id}'">
      <img class="perfume-card__img" src="${imgSrc}" alt="${escapeHtml(p.name)}" loading="lazy" />
      <div class="perfume-card__info">
        <div class="perfume-card__brand">${escapeHtml(p.brand_name || '')}</div>
        <div class="perfume-card__name">${escapeHtml(p.name)}</div>
        <div class="perfume-card__meta">
          <span>${genderIcon(p.gender)} ${p.gender || ''}</span>
          <span>${p.release_year || ''}</span>
          ${p.brand_type ? `<span>${escapeHtml(p.brand_type)}</span>` : ''}
        </div>
        <div class="perfume-card__price">${p.price ? `$${parseFloat(p.price).toFixed(0)}` : ''}</div>
      </div>
    </div>
  `;
}
