import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';

// Public GET /api/ktebnus/books/[slug] - get single published book by slug
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const { slug } = await params;

    const url = new URL(request.url);
    const noInc = url.searchParams.get('noInc') === '1';

    // Increment views atomically and return the updated document
    const projection = '_id title authorName authorUsername authorPhotoURL userId authorUid genre coverImage slug description createdAt updatedAt views youtubeLinks resourceLinks spotifyLink';
    let book;
    if (noInc) {
      book = await Book.findOne({ slug, isPublished: true }, projection).lean();
    } else {
      book = await Book.findOneAndUpdate(
        { slug, isPublished: true },
        { $inc: { views: 1 } },
        { new: true, projection }
      ).lean();
    }

    if (!book) {
      return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });
    }

    // Normalize response shape for frontend
    const normalized = {
      _id: String(book._id),
      slug: book.slug,
      title: book.title,
      writer: (book as any).authorName || '',
      writerUsername: (book as any).authorUsername || '',
      writerAvatar: (book as any).authorPhotoURL || '',
      ownerId: String((book as any).userId || (book as any).authorUid || ''),
      genre: (book as any).genre || '',
      image: (book as any).coverImage || '',
      description: (book as any).description || '',
      views: typeof (book as any).views === 'number' ? (book as any).views : 0,
      createdAt: (book as any).createdAt,
      updatedAt: (book as any).updatedAt,
      youtubeLinks: Array.isArray((book as any).youtubeLinks) ? (book as any).youtubeLinks : [],
      resourceLinks: Array.isArray((book as any).resourceLinks) ? (book as any).resourceLinks : [],
      spotifyLink: typeof (book as any).spotifyLink === 'string' ? (book as any).spotifyLink : ''
    };

    return NextResponse.json({ success: true, book: normalized });
  } catch (error: any) {
    console.error('Error fetching ktebnus book by slug:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch book' }, { status: 500 });
  }
}

