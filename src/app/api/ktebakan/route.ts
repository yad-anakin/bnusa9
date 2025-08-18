import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

export async function GET() {
  let client: MongoClient | null = null;
  try {
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const booksCol = db.collection('ktebnus');

    const books = await booksCol
      .find({ isPublished: true, isDraft: false })
      .project({
        title: 1,
        coverImage: 1,
        writer: 1,
        genre: 1,
        slug: 1,
        _id: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, books });
  } catch (error: any) {
    console.error('Error fetching published books:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
