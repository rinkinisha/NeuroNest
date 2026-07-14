const express = require('express');
const router = express.Router();
const { getGoals, createGoal, toggleGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getGoals).post(createGoal);
router.route('/:id/toggle').put(toggleGoal);

module.exports = router;
