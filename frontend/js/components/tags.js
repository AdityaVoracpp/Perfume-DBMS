/**
 * Tag rendering helpers.
 */
function renderNoteTag(note) {
  const cls = note.note_type ? `tag--${note.note_type.toLowerCase()}` : '';
  return `<span class="tag ${cls}">${escapeHtml(note.note_name)}</span>`;
}
function renderSeasonTag(s) { return `<span class="tag tag--season">${escapeHtml(s.name)}</span>`; }
function renderOccasionTag(o) { return `<span class="tag tag--occasion">${escapeHtml(o.name)}</span>`; }
function renderCategoryTag(c) { return `<span class="tag tag--category">${escapeHtml(c.name)}</span>`; }
function renderGenderTag(g) { return `<span class="tag tag--gender">${genderIcon(g)} ${g}</span>`; }
