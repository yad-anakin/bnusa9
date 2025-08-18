const mongoose = require('mongoose');

// Clear all cached models
console.log('Clearing Mongoose model cache...');

// List current models before clearing
console.log('Models before clearing:', Object.keys(mongoose.models));

// Clear the models cache
Object.keys(mongoose.models).forEach(modelName => {
  delete mongoose.models[modelName];
});

// Clear the schemas cache
Object.keys(mongoose.modelSchemas).forEach(schemaName => {
  delete mongoose.modelSchemas[schemaName];
});

console.log('Models after clearing:', Object.keys(mongoose.models));
console.log('✅ Mongoose cache cleared successfully!');

// Now test importing our Book model fresh
console.log('\nTesting fresh Book model import...');

// Re-create the Book model with explicit collection name
const bookSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  genre: { type: String, required: true, trim: true },
  status: { type: String, enum: ['ongoing', 'completed', 'hiatus'], default: 'ongoing' },
  coverImage: { type: String, default: '' },
  slug: { type: String, required: true, unique: true, index: true },
  isDraft: { type: Boolean, default: true, index: true },
  isPendingReview: { type: Boolean, default: false, index: true },
  isPublished: { type: Boolean, default: false, index: true },
  publishedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the model with explicit collection name
const Book = mongoose.model('KtebNus', bookSchema, 'ktebnus');

console.log('Fresh Book model created:');
console.log('- Model name:', Book.modelName);
console.log('- Collection name:', Book.collection.name);
console.log('- Schema paths:', Object.keys(Book.schema.paths));

console.log('\n✅ Cache clearing and model verification complete!');
console.log('Please restart your development server to ensure the changes take effect.');
