const mongoose = require('mongoose');

const reflectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Reflection content is required'],
      trim: true,
    },
    topicsToRevise: {
      type: [String],
      default: [],
      set: (topics) => topics.map((t) => t.trim()),
    },
    goal: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reflection', reflectionSchema);
