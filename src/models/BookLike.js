import mongoose from 'mongoose';

const bookLikeSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one like per user per book
bookLikeSchema.index({ bookId: 1, userId: 1 }, { unique: true });

// Create model with custom collection name
try {
  if (mongoose.models.BookLike) {
    if (typeof mongoose.deleteModel === 'function') {
      mongoose.deleteModel('BookLike');
    } else {
      delete mongoose.models.BookLike;
    }
  }
} catch (error) {
  // Ignore errors during model cleanup
}

const BookLike = mongoose.model('BookLike', bookLikeSchema, 'book_likes');

export default BookLike;
