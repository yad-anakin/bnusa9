const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';

// Define schemas inline for debugging
const bookSchema = new mongoose.Schema({
  title: String,
  description: String,
  genre: String,
  userId: String,
  slug: String,
  isDraft: Boolean,
  coverImageUrl: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'ktebnus' });

const chapterSchema = new mongoose.Schema({
  title: String,
  content: String,
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  chapterNumber: Number,
  isDraft: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'ktebnuschapters' });

const Book = mongoose.model('DebugBook', bookSchema);
const Chapter = mongoose.model('DebugChapter', chapterSchema);

async function debugChapter() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const chapterId = '68928c9072ce911d5503364a'; // The problematic chapter ID
    console.log(`\nDebugging chapter: ${chapterId}`);

    // Find the chapter
    const chapter = await Chapter.findById(chapterId);
    console.log('\nChapter data:');
    console.log(JSON.stringify(chapter, null, 2));

    if (chapter && chapter.bookId) {
      console.log(`\nLooking for book with ID: ${chapter.bookId}`);
      
      // Find the associated book
      const book = await Book.findById(chapter.bookId);
      console.log('\nBook data:');
      console.log(JSON.stringify(book, null, 2));

      if (!book) {
        console.log('\n❌ PROBLEM: Book not found! This is why the API is failing.');
        
        // Let's see what books exist
        console.log('\nLet\'s check what books exist:');
        const allBooks = await Book.find({});
        console.log(`Found ${allBooks.length} books:`);
        allBooks.forEach((book, index) => {
          console.log(`${index + 1}. ${book.title} (ID: ${book._id}, User: ${book.userId})`);
        });
      } else {
        console.log('\n✅ Book found successfully');
        console.log(`Book belongs to user: ${book.userId}`);
      }
    } else {
      console.log('\n❌ PROBLEM: Chapter has no bookId or chapter not found');
    }

    // Let's also check all chapters
    console.log('\nAll chapters in database:');
    const allChapters = await Chapter.find({});
    console.log(`Found ${allChapters.length} chapters:`);
    allChapters.forEach((chapter, index) => {
      console.log(`${index + 1}. ${chapter.title} (ID: ${chapter._id}, BookID: ${chapter.bookId})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugChapter();
