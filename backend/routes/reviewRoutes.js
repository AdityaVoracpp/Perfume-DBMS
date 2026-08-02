const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

router.get('/perfume/:perfumeId', ctrl.getByPerfume);
router.get('/user/:userId', ctrl.getByUser);
router.post('/', authenticate, ctrl.create);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
