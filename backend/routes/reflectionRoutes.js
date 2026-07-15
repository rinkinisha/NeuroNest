const express = require('express');
const router = express.Router();
const { getReflections, createReflection, getDailySummary } = require('../controllers/reflectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/daily', getDailySummary);
router.route('/').get(getReflections).post(createReflection);

module.exports = router;
