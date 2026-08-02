/**
 * Modal component — global open/close for the single modal container.
 */
const Modal = {
  overlay: null,
  container: null,
  content: null,

  init() {
    this.overlay = document.getElementById('modalOverlay');
    this.container = document.getElementById('modalContainer');
    this.content = document.getElementById('modalContent');
    document.getElementById('modalClose').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  },

  open(html) {
    this.content.innerHTML = html;
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
};
