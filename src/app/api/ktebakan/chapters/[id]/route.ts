import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'bunsa';

// GET /api/ktebakan/chapters/[id] - get published chapter content
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    const chaptersCol = db.collection('ktebnuschapters');

    const chapter = await chaptersCol.findOne({ _id: new ObjectId(id), isDraft: false });
    if (!chapter) {
      return NextResponse.json({ success: false, message: 'Chapter not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, chapter });
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
