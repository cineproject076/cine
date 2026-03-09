const express = require('express');
const router = express.Router();
const talentController = require('../controllers/talentController');
const authMiddleware = require('../middleware/authMiddleware');

// ALL TALENT ROUTES PROTECTED
router.use(authMiddleware);

// CREATE TALENT
router.post('/manual', talentController.addTalentManual);
router.post('/import', talentController.importTalent);

// DASHBOARD
router.get('/', talentController.getTalentPool);
router.put('/:id', talentController.updateTalent);

// LEVEL 3 DATA
router.post('/commercials', talentController.updateCommercials);
router.post('/availability', talentController.setAvailability);

module.exports = router;

