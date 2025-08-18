import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookLike from '@/models/BookLike';
import Book from '@/models/Book';
import { requireAuth } from '@/lib/auth';

// GET /api/ktebnus/books/[slug]/like/check - Check if user has liked a book
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();
    
    const { slug } = await params;
    
    // Find book by slug
    const book = await Book.findOne({ slug, isPublished: true });
    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    const bookId = book._id.toString();
    const userId = user.uid;
    
    const hasLiked = await BookLike.exists({ bookId, userId });
    
    return NextResponse.json({
      success: true,
      hasLiked: !!hasLiked
    });
  } catch (error: any) {
    console.error('Error checking book like status:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check like status' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
