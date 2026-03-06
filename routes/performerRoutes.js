const express = require('express');
const router = express.Router();
const performerController = require('../controllers/performerController');
const authMiddleware = require('../middleware/authMiddleware');

// PROTECTED ROUTES (Require Token)
router.post('/portfolio-details', authMiddleware, performerController.updatePerformerProfile);
router.post('/add-image', authMiddleware, performerController.addPortfolioImage);

// OPEN ROUTES (For Seekers)
router.get('/search', performerController.searchTalent);

module.exports = router;
