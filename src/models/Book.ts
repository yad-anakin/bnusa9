import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  authorUid: { type: String },
  authorName: { type: String },
  authorUsername: { type: String },
  authorEmail: { type: String },
  authorPhotoURL: { type: String },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  genre: {
    type: String,
    required: true,
    trim: true
  },
  // New: optional multi-genre support (backward-compatible). Keep `genre` as primary.
  genres: {
    type: [String],
    default: undefined, // omit if empty
    validate: {
      validator: function (arr: unknown) {
        if (arr == null) return true; // allow undefined
        if (!Array.isArray(arr)) return false;
        if (arr.length > 3) return false; // cap at 3
        return arr.every((s) => typeof s === 'string' && s.trim().length > 0);
      },
      message: 'genres must be an array of up to 3 non-empty strings'
    }
  },
  status: {
    type: String,
    enum: ['ongoing', 'finished'],
    default: 'ongoing'
  },
  coverImage: {
    type: String,
    default: ''
  },
  spotifyLink: {
    type: String,
    default: ''
  },
  youtubeLinks: {
    type: [String],
    default: []
  },
  resourceLinks: {
    type: [
      new mongoose.Schema(
        {
          name: { type: String, default: '', trim: true },
          url: { type: String, required: true, trim: true }
        },
        { _id: false }
      )
    ],
    default: []
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  isPendingReview: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookSchema.index({ userId: 1, isDraft: 1 });
bookSchema.index({ userId: 1, isPublished: 1 });
bookSchema.index({ isPendingReview: 1 });
// slug already has { unique: true, index: true } on the path — no need to add another index to avoid duplicates
// Support queries that filter by user and sort by updated time (used in drafts listing)
bookSchema.index({ userId: 1, updatedAt: -1 });
// Optimize common lookup used by API: findOne({ slug, userId })
bookSchema.index({ userId: 1, slug: 1 });

// Create model with custom collection name
// In dev/hot-reload, ensure we recompile the model so new schema paths (e.g., authorUsername) are not dropped
try {
  // Mongoose v7 provides deleteModel; fall back to deleting from models map
  if (mongoose.models.KtebNus) {
    // @ts-ignore - deleteModel not in older types
    if (typeof (mongoose as any).deleteModel === 'function') {
      // @ts-ignore
      (mongoose as any).deleteModel('KtebNus');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (mongoose as any).models.KtebNus;
    }
  }
} catch {}

const Book = mongoose.model('KtebNus', bookSchema, 'ktebnus');

export default Book;
