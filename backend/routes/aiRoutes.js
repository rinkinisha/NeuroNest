/**
 * routes/aiRoutes.js – AI Revision Coach routes
 */
const express = require('express');
const router = express.Router();
const {
  chatWithCoach,
  completeAISession,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/chat', chatWithCoach);
router.post('/complete', completeAISession);

module.exports = router;
