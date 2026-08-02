/**
 * Notes page — encyclopedia of fragrance notes organized by pyramid layer.
 * Showcases: Note table, note_type ENUM, PerfumeNote junction (usage count)
 */
async function renderNotes() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const notes = await API.get('/lookups/notes');
    const top = notes.filter(n => n.note_type === 'Top');
    const mid = notes.filter(n => n.note_type === 'Middle');
    const base = notes.filter(n => n.note_type === 'Base');

    function renderLayer(title, layerNotes, colorClass) {
      return `
        <div class="section">
          <h2 class="section__title" style="display:flex;align-items:center;gap:0.5rem;">
            <span class="note-card__dot note-card__dot--${colorClass}" style="width:12px;height:12px;"></span>
            ${title} Notes
          </h2>
          <div class="grid grid--4" style="margin-top:1rem;">
            ${layerNotes.map(n => `
              <div class="card note-card" onclick="renderNoteDetail(${n.note_id})">
                <div class="note-card__dot note-card__dot--${colorClass}"></div>
                <div class="note-card__name">${escapeHtml(n.note_name)}</div>
                <div class="note-card__count">${n.usage_count || 0} perfumes</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      <div class="page-header">
        <h1 class="page-header__title">Fragrance Notes</h1>
        <p class="page-header__subtitle">${notes.length} individual notes across the fragrance pyramid</p>
      </div>
      ${renderLayer('Top', top, 'top')}
      ${renderLayer('Heart', mid, 'middle')}
      ${renderLayer('Base', base, 'base')}
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

async function renderNoteDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const note = await API.get(`/lookups/notes/${id}`);
    app.innerHTML = `
      <a href="#/notes" class="btn btn--ghost btn--sm" style="margin-bottom:1.5rem;">← Back to Notes</a>
      <div class="page-header">
        <h1 class="page-header__title">${escapeHtml(note.note_name)}</h1>
        <p class="page-header__subtitle">
          <span class="tag tag--${note.note_type.toLowerCase()}">${note.note_type} Note</span>
          · Found in ${note.perfumes?.length || 0} perfumes
        </p>
      </div>
      <div class="grid grid--3">
        ${(note.perfumes || []).map(p => `
          <div class="card perfume-card" onclick="window.location.hash='#/perfumes/${p.perfume_id}'">
            <img class="perfume-card__img" src="${p.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%22100%22%3E%3Crect width=%2280%22 height=%22100%22 fill=%22%231a1a2e%22/%3E%3C/svg%3E'}" alt="" loading="lazy" />
            <div class="perfume-card__info">
              <div class="perfume-card__brand">${escapeHtml(p.brand_name || '')}</div>
              <div class="perfume-card__name">${escapeHtml(p.name)}</div>
              <div class="perfume-card__price">${p.price ? `$${parseFloat(p.price).toFixed(0)}` : ''}</div>
            </div>
          </div>
        `).join('') || '<div class="empty"><div class="empty__text">No perfumes use this note yet.</div></div>'}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}
