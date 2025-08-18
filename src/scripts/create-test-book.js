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

async function createPermanentTestBook() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully to bunsa database!');
    
    // Check current documents in ktebnus collection
    const db = mongoose.connection.db;
    const ktebNusCollection = db.collection('ktebnus');
    const currentCount = await ktebNusCollection.countDocuments();
    console.log('Current documents in ktebnus collection:', currentCount);
    
    // Create a permanent test book
    console.log('Creating permanent test book...');
    const testBook = new KtebNusBook({
      userId: 'test-user-permanent',
      title: 'Permanent Test Book - Kteb Nus',
      description: 'This is a permanent test book to verify the ktebnus collection is working correctly',
      genre: 'Test Genre',
      slug: 'permanent-test-book-' + Date.now(),
      isDraft: true,
      status: 'ongoing'
    });
    
    const savedBook = await testBook.save();
    console.log('✅ Permanent test book created successfully!');
    console.log('Book details:');
    console.log('- ID:', savedBook._id);
    console.log('- Title:', savedBook.title);
    console.log('- Collection used:', KtebNusBook.collection.name);
    console.log('- Slug:', savedBook.slug);
    
    // Verify it's actually in the ktebnus collection
    const newCount = await ktebNusCollection.countDocuments();
    console.log('Documents in ktebnus collection after creation:', newCount);
    
    // List all documents in ktebnus collection
    const allBooks = await ktebNusCollection.find({}).toArray();
    console.log('\nAll books in ktebnus collection:');
    allBooks.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} (ID: ${book._id})`);
    });
    
    console.log('\n✅ This book should now be visible in your MongoDB database!');
    console.log('Database: bunsa');
    console.log('Collection: ktebnus');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

createPermanentTestBook();
