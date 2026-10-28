const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ad title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE',
      required: true
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL (Image or Video) is required'],
      trim: true
    },
    targetUrl: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    placement: {
      type: String,
      enum: ['HOME_HERO', 'BANNER', 'POPUP'],
      default: 'HOME_HERO'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
