import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';
import { requireAuth } from '@/lib/auth';
import { sanitizeBookData } from '@/lib/sanitize';

// GET /api/kteb-nus/books/[slug]/chapters - Get chapters for a book
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { slug } = params;

    const book = await Book.findOne({ slug, userId: user.uid });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Pagination
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const skipParam = url.searchParams.get('skip');
    const limit = Number.isFinite(Number(limitParam)) ? Math.max(1, Math.min(50, Number(limitParam))) : 3;
    const skip = Number.isFinite(Number(skipParam)) ? Math.max(0, Number(skipParam)) : 0;

    // Fetch limit+1 to determine hasMore without an extra count
    const rows = await Chapter.find({ bookId: book._id })
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit + 1)
      // Select only the fields we need; include content just to compute excerpt (strip tags)
      .select('title order isDraft createdAt updatedAt content')
      .lean();

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;

    // Compute excerpt on the server and omit content from response
    const chapters = sliced.map((r: any) => {
      const text = typeof r.content === 'string' ? r.content.replace(/<[^>]*>/g, '') : '';
      const excerpt = text.length > 160 ? text.substring(0, 160) + '...' : text;
      return {
        _id: String(r._id),
        title: r.title,
        order: r.order,
        isDraft: !!r.isDraft,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        excerpt
      };
    });

    return NextResponse.json({ success: true, chapters, hasMore });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// POST /api/kteb-nus/books/[slug]/chapters - Create new chapter
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { slug } = params;
    const body = await request.json();
    const sanitizedData = sanitizeBookData(body);

    // Verify book ownership
    const book = await Book.findOne({ slug, userId: user.uid });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!sanitizedData.title || !sanitizedData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Get next order number
    const lastChapter = await Chapter.findOne({ bookId: book._id })
      .sort({ order: -1 });
    const nextOrder = lastChapter ? lastChapter.order + 1 : 1;

    // Always assign nextOrder, ignore any order sent from client
    // Respect isDraft from client if provided (defaults to true)
    const chapterData = {
      bookId: book._id,
      title: sanitizedData.title,
      content: sanitizedData.content,
      isDraft: typeof sanitizedData.isDraft === 'boolean' ? sanitizedData.isDraft : true,
      order: nextOrder
    };

    const chapter = new Chapter(chapterData);
    await chapter.save();

    return NextResponse.json({ 
      chapter,
      message: 'Chapter created successfully' 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create chapter' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
