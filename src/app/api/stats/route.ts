import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Get MongoDB URI from environment or use default
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bnusa';

    try {
      // Connect directly to MongoDB
      const client = await MongoClient.connect(MONGODB_URI);
      const db = client.db();

      // 1) Total staff across all tabs (writers, supervisors, designers, reviewers, ktebNus)
      const staffCount = await db.collection('users').countDocuments({
        $or: [
          { isWriter: true },
          { isSupervisor: true },
          { isDesigner: true },
          { isReviewer: true },
          { isKtebNus: true },
        ],
      });

      // 2) Published articles
      const articlesCount = await db.collection('articles').countDocuments({ status: 'published' });

      // 3) Accepted reviews
      const reviewsCount = await db.collection('reviews').countDocuments({ status: 'accepted' });

      // 4) KtebNus books that are published
      const ktebsCount = await db.collection('ktebnus').countDocuments({ isPublished: true });

      // Get unique languages from books
      const languages = await db.collection('books').distinct('language');
      const languageCount = languages.length;

      // Close the connection
      await client.close();

      return NextResponse.json({
        success: true,
        stats: {
          staff: staffCount || 0,
          articles: articlesCount || 0,
          reviews: reviewsCount || 0,
          ktebs: ktebsCount || 0,
          languages: languageCount || 3 // Default to 3 if no languages found
        },
      });
    } catch (error) {
      console.error("Error connecting to MongoDB, using fallback values:", error);

      // Return fallback values when MongoDB is unavailable
      return NextResponse.json({
        success: true,
        stats: {
          staff: 0,
          articles: 0,
          reviews: 0,
          ktebs: 0,
          languages: 3 // Default language count
        }
      });
    }
  } catch (error: any) {
    // This outer catch is only reached if there's an error handling the error
    console.error('Unexpected error in stats API route:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}