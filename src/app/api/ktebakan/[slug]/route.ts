import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';

// GET /api/ktebakan/[slug] - Get published book for public viewing
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    await connectDB();

    const { slug } = params;

    // Only return published books
    const book = await Book.findOne({ 
      slug, 
      isPublished: true,
      isDraft: false 
    }).select('-userId -__v');

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found or not published' },
        { status: 404 }
      );
    }

    // Get published chapters only
    const chapters = await Chapter.find({ 
      bookId: book._id,
      isDraft: false 
    })
      .sort({ order: 1 })
      .select('-__v');

    return NextResponse.json({ book, chapters });
  } catch (error) {
    console.error('Error fetching published book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    );
  }
}
