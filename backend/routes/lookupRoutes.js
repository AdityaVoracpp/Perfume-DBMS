const router = require('express').Router();
const ctrl = require('../controllers/lookupController');
const { authenticate } = require('../middleware/auth');

// --- Notes (special) ---
router.get('/notes', ctrl.getAllNotes);
router.get('/notes/:id', ctrl.getNoteById);
router.post('/notes', authenticate, ctrl.createNote);
router.put('/notes/:id', authenticate, ctrl.updateNote);
router.delete('/notes/:id', authenticate, ctrl.deleteNote);

// --- Generic lookups (seasons, occasions, categories, brandtypes) ---
router.get('/:type', ctrl.getAll);
router.post('/:type', authenticate, ctrl.create);
router.put('/:type/:id', authenticate, ctrl.update);
router.delete('/:type/:id', authenticate, ctrl.remove);

module.exports = router;
