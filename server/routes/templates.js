const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', templateController.getTemplates);
router.post('/', templateController.createTemplate);
router.get('/:id', templateController.getTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/duplicate', templateController.duplicateTemplate);
router.put('/:id/favorite', templateController.toggleFavorite);

module.exports = router;
