import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chapterSchema.index({ bookId: 1, order: 1 });
chapterSchema.index({ bookId: 1, isDraft: 1 });

// Create model with custom collection name
const Chapter = mongoose.models.KtebNusChapter || mongoose.model('KtebNusChapter', chapterSchema, 'ktebnuschapters');

export default Chapter;
