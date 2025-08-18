import mongoose from 'mongoose';

const bookCommentSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userProfileImage: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  parentId: {
    type: String,
    default: null,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookCommentSchema.index({ bookId: 1, createdAt: -1 });
bookCommentSchema.index({ parentId: 1, createdAt: 1 });
bookCommentSchema.index({ userId: 1, createdAt: -1 });

// Create model with custom collection name
try {
  if (mongoose.models.BookComment) {
    if (typeof mongoose.deleteModel === 'function') {
      mongoose.deleteModel('BookComment');
    } else {
      delete mongoose.models.BookComment;
    }
  }
} catch (error) {
  // Ignore errors during model cleanup
}

const BookComment = mongoose.model('BookComment', bookCommentSchema, 'book_comments');

export default BookComment;
