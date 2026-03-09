const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// ALL PROJECT ROUTES PROTECTED
router.use(authMiddleware);

// PROJECTS
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);

// SHORTLISTING
router.post('/shortlist', projectController.addToShortlist);
router.get('/shortlist/:project_id', projectController.getShortlist);

module.exports = router;
