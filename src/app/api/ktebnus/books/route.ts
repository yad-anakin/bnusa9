import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';

// Public GET /api/ktebnus/books - list published books with pagination, search, and filters
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '12', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const MAX_LIMIT = 24;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitParam) ? limitParam : 12));

    const search = (searchParams.get('search') || '').trim();
    const genre = (searchParams.get('genre') || '').trim().toLowerCase();
    const yearStr = (searchParams.get('year') || '').trim();
    const year = yearStr && !isNaN(Number(yearStr)) ? Number(yearStr) : undefined;

    const query: any = { isPublished: true };
    if (genre && genre !== 'all') {
      query.genre = { $regex: new RegExp(`^${genre}$`, 'i') };
    }
    if (search) {
      query.$or = [
        { title: { $regex: new RegExp(search, 'i') } },
        { authorName: { $regex: new RegExp(search, 'i') } },
      ];
    }
    if (year) {
      query.$expr = { $eq: [{ $year: '$createdAt' }, year] };
    }

    // Total for pagination
    const total = await Book.countDocuments(query);

    // Projection: only fields needed by UI, include views
    const projection = 'title authorName genre coverImage slug updatedAt createdAt views';

    const docs = await Book.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(projection)
      .lean();

    // Map to bookstore-like fields
    const books = docs.map((b: any) => ({
      _id: String(b._id),
      title: b.title,
      writer: b.authorName || '',
      genre: b.genre || '',
      image: b.coverImage || '',
      slug: b.slug,
      views: typeof b.views === 'number' ? b.views : 0,
    }));

    // Filters: genres and years from published books
    const [genresAgg, yearsAgg] = await Promise.all([
      Book.distinct('genre', { isPublished: true }),
      Book.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: { $year: '$createdAt' } } },
        { $project: { _id: 0, year: '$_id' } },
        { $sort: { year: -1 } },
      ]),
    ]);

    const filters = {
      genres: (genresAgg as string[]).filter(Boolean).map(g => String(g).toLowerCase()),
      years: yearsAgg.map((y: any) => y.year).filter((n: any) => typeof n === 'number'),
    };

    const pages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      books,
      pagination: { total, page, limit, pages },
      filters,
    });
  } catch (error: any) {
    console.error('Error fetching ktebnus books:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch books' },
      { status: 500 }
    );
  }
}
