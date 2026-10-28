const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Category code is required'],
      unique: true,
      uppercase: true,
      index: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Category title is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      default: 'GraduationCap'
    },
    gradient: {
      type: String,
      default: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
    },
    sequence: {
      type: Number,
      default: 1,
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
