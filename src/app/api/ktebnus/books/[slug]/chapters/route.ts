import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';

// Public GET /api/ktebnus/books/[slug]/chapters - list published chapters for a published book
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    // Parse pagination if provided
    const limitParam = searchParams.get('limit');
    const skipParam = searchParams.get('skip');
    const limit = limitParam ? Math.max(1, Math.min(50, parseInt(limitParam, 10) || 3)) : undefined;
    const skip = skipParam ? Math.max(0, parseInt(skipParam, 10) || 0) : 0;

    // Ensure the book is published
    const book = await Book.findOne({ slug, isPublished: true }).lean();
    if (!book) {
      return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
    }

    const baseQuery = { bookId: book._id, isDraft: false } as const;

    // When limit is not provided, return all chapters (backwards compatible)
    let chaptersQuery = Chapter.find(baseQuery)
      .select('_id title order createdAt updatedAt')
      .sort({ order: 1, createdAt: 1 });
    if (typeof limit === 'number') {
      chaptersQuery = chaptersQuery.skip(skip).limit(limit);
    }
    const chapters = await chaptersQuery.lean();

    // Compute total and hasMore only if paginating
    let total: number | undefined = undefined;
    let hasMore: boolean | undefined = undefined;
    if (typeof limit === 'number') {
      total = await Chapter.countDocuments(baseQuery);
      hasMore = skip + chapters.length < total;
    }

    const normalized = (chapters || []).map((ch: any) => ({
      _id: String(ch._id),
      title: ch.title || '',
      order: typeof ch.order === 'number' ? ch.order : 0,
      createdAt: ch.createdAt,
      updatedAt: ch.updatedAt,
    }));

    // Short public cache
    const payload: any = { success: true, chapters: normalized };
    if (typeof total === 'number') payload.total = total;
    if (typeof hasMore === 'boolean') payload.hasMore = hasMore;
    const res = NextResponse.json(payload);
    res.headers.set('Cache-Control', 'public, max-age=30');
    return res;
  } catch (error: any) {
    console.error('Error fetching published chapters:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch chapters' }, { status: 500 });
  }
}
