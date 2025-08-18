import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';
import { requireAuth } from '@/lib/auth';

// POST /api/kteb-nus/books/[slug]/publish - Publish book for review
export async function POST(request: Request, { params }: { params: { slug: string } }) {
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

    // Check if book is already published or pending review
    if (book.isPublished) {
      return NextResponse.json(
        { error: 'Book is already published' },
        { status: 400 }
      );
    }

    if (book.isPendingReview) {
      return NextResponse.json(
        { error: 'Book is already pending review' },
        { status: 400 }
      );
    }

    // Check if book has at least one chapter
    const chapterCount = await Chapter.countDocuments({ bookId: book._id });
    if (chapterCount === 0) {
      return NextResponse.json(
        { error: 'Cannot publish book without chapters' },
        { status: 400 }
      );
    }

    // Update book status to pending review
    const updatedBook = await Book.findByIdAndUpdate(
      book._id,
      {
        isDraft: false,
        isPendingReview: true,
        isPublished: false
      },
      { new: true }
    );

    return NextResponse.json({ 
      book: updatedBook,
      message: 'Book submitted for review successfully' 
    });
  } catch (error: any) {
    console.error('Error publishing book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish book' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
