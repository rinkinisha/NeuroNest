const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    targetDate: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
