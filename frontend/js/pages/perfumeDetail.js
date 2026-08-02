/**
 * Perfume Detail page — the crown jewel demonstrating ALL schema relationships.
 * Showcases: 6-table JOIN, note pyramid, performance ENUMs, M:N tags,
 *            reviews with CHECK constraint, and self-join for similar perfumes.
 */
async function renderPerfumeDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const [perfume, similar] = await Promise.all([
      API.get(`/perfumes/${id}`),
      API.get(`/perfumes/${id}/similar?limit=4`)
    ]);

    const topNotes = (perfume.notes || []).filter(n => n.note_type === 'Top');
    const midNotes = (perfume.notes || []).filter(n => n.note_type === 'Middle');
    const baseNotes = (perfume.notes || []).filter(n => n.note_type === 'Base');

    app.innerHTML = `
      <a href="#/perfumes" class="btn btn--ghost btn--sm" style="margin-bottom:1.5rem;">← Back to Collection</a>

      <div class="detail-layout">
        <img class="detail-img" src="${perfume.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22340%22 height=%22450%22%3E%3Crect width=%22340%22 height=%22450%22 fill=%22%231a1a2e%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23444%22 font-size=%2248%22%3E🧴%3C/text%3E%3C/svg%3E'}" alt="${escapeHtml(perfume.name)}" />

        <div>
          <div class="detail-header">
            <div class="detail-brand">${escapeHtml(perfume.brand_name || '')} ${perfume.brand_type ? `· ${escapeHtml(perfume.brand_type)}` : ''}</div>
            <h1 class="detail-name">${escapeHtml(perfume.name)}</h1>
            <div class="detail-meta">
              <span>${genderIcon(perfume.gender)} ${perfume.gender || ''}</span>
              ${perfume.release_year ? `<span>Released ${perfume.release_year}</span>` : ''}
              ${perfume.origin_country ? `<span>🌍 ${escapeHtml(perfume.origin_country)}</span>` : ''}
              ${perfume.avg_rating ? `<span>${renderStars(perfume.avg_rating)} <span class="rating-number">${perfume.avg_rating}</span> (${perfume.review_count})</span>` : ''}
            </div>
            <div class="detail-price">${perfume.price ? `$${parseFloat(perfume.price).toFixed(2)}` : 'Price N/A'}</div>
          </div>

          <!-- AI Description -->
          <div id="aiDescSection">
            <button class="btn btn--ai btn--sm" onclick="generateAIDescription(${id})">✦ Generate AI Description</button>
          </div>

          <!-- Performance -->
          ${perfume.longevity || perfume.sillage ? `
            <div class="detail-section">
              <div class="detail-section__title">Performance</div>
              <div class="detail-performance">
                ${perfume.longevity ? `<div><span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Longevity</span><span class="perf-badge ${perfBadgeClass(perfume.longevity)}">${perfume.longevity}</span></div>` : ''}
                ${perfume.sillage ? `<div><span style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:0.25rem;">Sillage</span><span class="perf-badge ${perfBadgeClass(perfume.sillage)}">${perfume.sillage}</span></div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Note Pyramid -->
          ${perfume.notes?.length ? `
            <div class="detail-section">
              <div class="detail-section__title">Fragrance Pyramid</div>
              <div class="note-pyramid">
                ${topNotes.length ? `<div class="note-pyramid__layer"><span class="note-pyramid__label note-pyramid__label--top">Top</span><div class="tags">${topNotes.map(renderNoteTag).join('')}</div></div>` : ''}
                ${midNotes.length ? `<div class="note-pyramid__layer"><span class="note-pyramid__label note-pyramid__label--middle">Heart</span><div class="tags">${midNotes.map(renderNoteTag).join('')}</div></div>` : ''}
                ${baseNotes.length ? `<div class="note-pyramid__layer"><span class="note-pyramid__label note-pyramid__label--base">Base</span><div class="tags">${baseNotes.map(renderNoteTag).join('')}</div></div>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Tags -->
          <div class="detail-section">
            <div class="detail-section__title">Best For</div>
            <div class="tags" style="margin-bottom:0.75rem;">
              ${(perfume.seasons || []).map(renderSeasonTag).join('')}
              ${(perfume.occasions || []).map(renderOccasionTag).join('')}
              ${(perfume.categories || []).map(renderCategoryTag).join('')}
            </div>
          </div>

          <!-- Reviews -->
          <div class="detail-section">
            <div class="detail-section__title">Reviews (${perfume.review_count || 0})</div>
            ${API.user ? `
              <form id="reviewForm" style="margin-bottom:1rem;">
                <div class="form-row">
                  <div class="form-group">
                    <label>Your Rating</label>
                    <select name="rating" required>
                      <option value="5">★★★★★ (5)</option>
                      <option value="4">★★★★☆ (4)</option>
                      <option value="3">★★★☆☆ (3)</option>
                      <option value="2">★★☆☆☆ (2)</option>
                      <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                  </div>
                  <div class="form-group" style="display:flex;align-items:flex-end;">
                    <button type="submit" class="btn btn--primary btn--sm">Submit Review</button>
                  </div>
                </div>
                <div class="form-group">
                  <textarea name="comment" placeholder="Share your thoughts..." rows="2"></textarea>
                </div>
              </form>
            ` : '<p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;"><a href="#/auth">Log in</a> to leave a review.</p>'}
            <div id="reviewsList">
              ${(perfume.reviews || []).map(r => `
                <div class="review">
                  <div class="review__header">
                    <span class="review__user">${escapeHtml(r.username)} ${renderStars(r.rating)}</span>
                    <span class="review__date">${r.review_date ? new Date(r.review_date).toLocaleDateString() : ''}</span>
                  </div>
                  ${r.comment ? `<div class="review__comment">${escapeHtml(r.comment)}</div>` : ''}
                </div>
              `).join('') || '<div class="empty"><div class="empty__text">No reviews yet.</div></div>'}
            </div>
          </div>
        </div>
      </div>

      <!-- Similar Perfumes -->
      ${similar.length ? `
        <div class="section" style="margin-top:3rem;">
          <div class="section__header">
            <h2 class="section__title">Similar Fragrances</h2>
          </div>
          <div class="grid grid--4">
            ${similar.map(s => `
              <div class="card perfume-card" onclick="window.location.hash='#/perfumes/${s.perfume_id}'">
                <img class="perfume-card__img" src="${s.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%22100%22%3E%3Crect width=%2280%22 height=%22100%22 fill=%22%231a1a2e%22/%3E%3C/svg%3E'}" alt="" loading="lazy" />
                <div class="perfume-card__info">
                  <div class="perfume-card__brand">${escapeHtml(s.brand_name || '')}</div>
                  <div class="perfume-card__name">${escapeHtml(s.name)}</div>
                  <div class="perfume-card__meta"><span>${s.shared_notes} shared notes</span></div>
                  <div class="perfume-card__price">${s.price ? `$${parseFloat(s.price).toFixed(0)}` : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Review form handler
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        try {
          await API.post('/reviews', {
            perfume_id: parseInt(id),
            rating: parseInt(fd.get('rating')),
            comment: fd.get('comment') || null
          });
          showToast('Review submitted!');
          renderPerfumeDetail(id);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  } catch (err) {
    app.innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><div class="empty__text">${escapeHtml(err.message)}</div></div>`;
  }
}

async function generateAIDescription(perfumeId) {
  const section = document.getElementById('aiDescSection');
  section.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const data = await API.get(`/ai/describe/${perfumeId}`);
    section.innerHTML = `<div class="detail-description">${escapeHtml(data.description)}</div>`;
  } catch (err) {
    section.innerHTML = `<p style="color:var(--danger);font-size:0.85rem;">AI description unavailable: ${escapeHtml(err.message)}</p>`;
  }
}
