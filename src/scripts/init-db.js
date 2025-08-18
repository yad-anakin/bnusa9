const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bnusa';

// Book Schema
const bookSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
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
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'hiatus'],
    default: 'ongoing'
  },
  coverImage: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isDraft: {
    type: Boolean,
    default: true,
    index: true
  },
  isPendingReview: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Chapter Schema
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
  order: {
    type: Number,
    required: true,
    default: 1
  },
  isDraft: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create models with custom collection names
const Book = mongoose.model('KtebNus', bookSchema, 'ktebnus');
const Chapter = mongoose.model('KtebNusChapter', chapterSchema, 'ktebnuschapters');

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Create collections if they don't exist
    console.log('Creating collections...');
    
    // This will create the collections in MongoDB
    await Book.createCollection();
    console.log('KtebNus collection created/verified');
    
    await Chapter.createCollection();
    console.log('KtebNusChapters collection created/verified');

    // Create indexes
    console.log('Creating indexes...');
    await Book.createIndexes();
    await Chapter.createIndexes();
    console.log('Indexes created successfully');

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the initialization
initializeDatabase();
