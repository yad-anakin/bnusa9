const mongoose = require('mongoose');

// Connect to bunsa database
const MONGODB_URI = 'mongodb://localhost:27017/bunsa';

// Define the schema exactly as in our TypeScript model
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

// Create model with explicit collection name
const KtebNusBook = mongoose.model('KtebNus', bookSchema, 'ktebnus');

async function testBookCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');
    
    // Test creating a book
    console.log('Creating test book...');
    const testBook = new KtebNusBook({
      userId: 'test-user-123',
      title: 'Test Book from Script',
      description: 'This is a test book to verify collection usage',
      genre: 'Test',
      slug: 'test-book-' + Date.now(),
      isDraft: true
    });
    
    const savedBook = await testBook.save();
    console.log('✅ Book saved successfully!');
    console.log('Book ID:', savedBook._id);
    console.log('Collection used:', KtebNusBook.collection.name);
    
    // Verify it's in the correct collection
    const db = mongoose.connection.db;
    const ktebNusCollection = db.collection('ktebnus');
    const count = await ktebNusCollection.countDocuments();
    console.log('Total documents in ktebnus collection:', count);
    
    // Clean up - remove the test book
    await KtebNusBook.findByIdAndDelete(savedBook._id);
    console.log('✅ Test book cleaned up');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

testBookCreation();
