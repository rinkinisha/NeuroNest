const asyncHandler = require('express-async-handler');
const Reflection = require('../models/Reflection');
const Goal = require('../models/Goal');

// @desc    Get all reflections for logged-in user
// @route   GET /api/reflections
// @access  Private
const getReflections = asyncHandler(async (req, res) => {
  const reflections = await Reflection.find({ userId: req.user._id }).sort('-createdAt');
  res.json({
    success: true,
    count: reflections.length,
    data: reflections,
  });
});

// @desc    Create a reflection
// @route   POST /api/reflections
// @access  Private
const createReflection = asyncHandler(async (req, res) => {
  const { content, topicsToRevise, goal } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('Reflection content is required');
  }

  // Create the reflection
  const reflection = await Reflection.create({
    userId: req.user._id,
    content,
    topicsToRevise: topicsToRevise || [],
    goal: goal || '',
  });

  // If a goal is specified in the reflection, also create an active Goal in Goal collection
  if (goal && goal.trim()) {
    await Goal.create({
      userId: req.user._id,
      title: goal.trim(),
    });
  }

  res.status(201).json({
    success: true,
    data: reflection,
  });
});

// @desc    Get daily summary (goals and reflection) for a specific date
// @route   GET /api/reflections/daily
// @access  Private
const getDailySummary = asyncHandler(async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];

  // Calculate start and end of the requested date
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch goals created on this day
  const goals = await Goal.find({
    userId: req.user._id,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  // Fetch reflection created on this day
  const reflection = await Reflection.findOne({
    userId: req.user._id,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  res.json({
    studentId: `STU-${req.user._id.toString().slice(-6).toUpperCase()}`,
    date: dateStr,
    goalSetting: goals.map(g => ({
      goalId: g._id,
      goal: g.title
    })),
    reflection: reflection ? {
      reflectionId: reflection._id,
      text: reflection.content
    } : null
  });
});

module.exports = { getReflections, createReflection, getDailySummary };
