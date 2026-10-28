const mongoose = require('mongoose');

const ebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'E-book title is required'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      default: 0
    },
    coverImage: {
      type: String
    },
    samplePdfUrl: {
      type: String,
      required: [true, 'Sample preview PDF URL is required']
    },
    fullPdfUrl: {
      type: String,
      required: [true, 'Full eBook PDF URL is required'],
      select: false // Protected: only revealed to purchasers
    },
    pages: {
      type: Number,
      default: 100
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

ebookSchema.index({ category: 1, active: 1 });

const Ebook = mongoose.model('Ebook', ebookSchema);

module.exports = Ebook;
