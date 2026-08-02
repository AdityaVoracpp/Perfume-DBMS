const router = require('express').Router();
const ctrl = require('../controllers/perfumeController');
const { authenticate } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/similar', ctrl.findSimilar);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
