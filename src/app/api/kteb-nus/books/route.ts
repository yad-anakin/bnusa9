import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import { requireAuth } from '@/lib/auth';
import { sanitizeBookData } from '@/lib/sanitize';
import { generateBookSlug } from '@/lib/slug';

// GET /api/kteb-nus/books - Get user's books (paginated)
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const draftsOnly = searchParams.get('drafts') === 'true';
    const publishedOnly = searchParams.get('published') === 'true';
    // Pagination params with bounds for scalability
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '6', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const MAX_LIMIT = 24; // hard cap per request
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitParam) ? limitParam : 6));

    let query: any = { userId: user.uid };
    
    if (draftsOnly) {
      query.isDraft = true;
    } else if (publishedOnly) {
      query.isPublished = true;
    }

    // Count first for total pages computation
    const total = await Book.countDocuments(query);

    // Select only fields needed for the drafts grid to reduce payload
    const projection = 'title genre status coverImage slug isDraft isPendingReview isPublished createdAt updatedAt';

    const books = await Book.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(projection)
      .lean();

    return NextResponse.json({ books, total, page, limit });
  } catch (error: any) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch books' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// POST /api/kteb-nus/books - Create new book
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const sanitizedData = sanitizeBookData(body);
    console.log('[CREATE BOOK] incoming author:', sanitizedData?.author || null);

    // Validate required fields
    if (!sanitizedData.title || !sanitizedData.description || !sanitizedData.genre) {
      return NextResponse.json(
        { error: 'Title, description, and genre are required' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = generateBookSlug(sanitizedData.title);

    // Create book with default draft state
    // Compute a robust username fallback
    const computedUsername = (
      (sanitizedData.author?.username as string | undefined) ||
      ((user as any).username as string | undefined) ||
      (user?.email ? user.email.split('@')[0] : '') ||
      ''
    ).toString();

    const bookData = {
      userId: user.uid,
      authorUid: sanitizedData.author?.uid || user.uid,
      authorName: sanitizedData.author?.name || user.name || '',
      authorUsername: computedUsername,
      authorEmail: sanitizedData.author?.email || user.email || '',
      authorPhotoURL: sanitizedData.author?.photoURL || '',
      title: sanitizedData.title,
      description: sanitizedData.description,
      genre: sanitizedData.genre,
      status: sanitizedData.status || 'ongoing',
      coverImage: sanitizedData.coverImage || '',
      slug,
      isDraft: true,
      isPendingReview: false,
      isPublished: false
    };

    console.log('[CREATE BOOK] computed authorUsername:', computedUsername);
    console.log('BookData being saved:', JSON.stringify(bookData, null, 2));
    const book = new Book(bookData);
    try {
      await book.save();
      console.log('Book after save:', JSON.stringify(book.toObject(), null, 2));
    } catch (saveError) {
      console.error('Error saving book:', saveError);
      throw saveError;
    }

    return NextResponse.json({ 
      book,
      message: 'Book created successfully' 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create book' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
