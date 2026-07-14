const asyncHandler = require('express-async-handler');
const Goal = require('../models/Goal');

// @desc    Get all goals for logged-in user
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ userId: req.user._id }).sort('-createdAt');
  res.json({
    success: true,
    count: goals.length,
    data: goals,
  });
});

// @desc    Create a goal
// @route   POST /api/goals
// @access  Private
const createGoal = asyncHandler(async (req, res) => {
  const { title, targetDate } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('Goal title is required');
  }

  const goal = await Goal.create({
    userId: req.user._id,
    title,
    targetDate: targetDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  res.status(201).json({
    success: true,
    data: goal,
  });
});

// @desc    Toggle goal completion
// @route   PUT /api/goals/:id/toggle
// @access  Private
const toggleGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  goal.completed = !goal.completed;
  await goal.save();

  res.json({
    success: true,
    data: goal,
  });
});

module.exports = { getGoals, createGoal, toggleGoal };
