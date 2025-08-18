const mongoose = require('mongoose');

// MongoDB connection - connecting to bunsa database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bunsa';

async function verifyAndCreateCollections() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Get the database instance
    const db = mongoose.connection.db;
    console.log('Connected to database:', db.databaseName);
    
    // List existing collections
    console.log('\nExisting collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log('- ' + col.name));
    
    // Check if our collections exist
    const ktebNusExists = collections.some(col => col.name === 'ktebnus');
    const chaptersExists = collections.some(col => col.name === 'ktebnuschapters');
    
    console.log('\nKteb Nus collections status:');
    console.log('- ktebnus:', ktebNusExists ? 'EXISTS' : 'MISSING');
    console.log('- ktebnuschapters:', chaptersExists ? 'EXISTS' : 'MISSING');
    
    if (!ktebNusExists || !chaptersExists) {
      console.log('\nCreating missing collections...');
      
      // Create ktebnus collection with a sample document
      if (!ktebNusExists) {
        await db.createCollection('ktebnus');
        console.log('✓ Created ktebnus collection');
      }
      
      // Create ktebnuschapters collection
      if (!chaptersExists) {
        await db.createCollection('ktebnuschapters');
        console.log('✓ Created ktebnuschapters collection');
      }
      
      // List collections again to verify
      console.log('\nUpdated collections:');
      const updatedCollections = await db.listCollections().toArray();
      updatedCollections.forEach(col => console.log('- ' + col.name));
    }
    
    console.log('\n✅ Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the verification
verifyAndCreateCollections();
