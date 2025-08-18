import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';

// Public GET /api/ktebnus/books/[slug]/chapters/[id] - get a single published chapter for a published book
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    await connectDB();
    const { slug, id } = await params;

    // Ensure the book is published
    const book = await Book.findOne({ slug, isPublished: true }).lean();
    if (!book) {
      return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
    }

    // Only return non-draft chapters of that book
    const chapter = await Chapter.findOne({ _id: id, bookId: book._id, isDraft: false }).lean();
    if (!chapter) {
      return NextResponse.json({ success: false, message: 'Chapter not found' }, { status: 404 });
    }

    const normalized = {
      _id: String(chapter._id),
      title: chapter.title || '',
      content: chapter.content || '',
      order: typeof (chapter as any).order === 'number' ? (chapter as any).order : 0,
      createdAt: (chapter as any).createdAt,
      updatedAt: (chapter as any).updatedAt,
      book: {
        _id: String(book._id),
        slug: book.slug,
        title: (book as any).title || '',
      }
    };

    // Disable caching to always show latest content
    const res = NextResponse.json({ success: true, chapter: normalized });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error: any) {
    console.error('Error fetching published chapter:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch chapter' }, { status: 500 });
  }
}
