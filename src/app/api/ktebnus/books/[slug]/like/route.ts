import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookLike from '@/models/BookLike';
import Book from '@/models/Book';
import { requireAuth } from '@/lib/auth';

// GET /api/ktebnus/books/[slug]/like/count - Get like count for a book
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
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

    const count = await BookLike.countDocuments({ bookId: book._id.toString() });
    
    return NextResponse.json({
      success: true,
      count
    });
  } catch (error: any) {
    console.error('Error getting book like count:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get like count' },
      { status: 500 }
    );
  }
}

// POST /api/ktebnus/books/[slug]/like/toggle - Toggle like for a book
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();
    // Ensure indexes (unique on { bookId, userId }) are created
    try {
      await BookLike.init();
    } catch (e) {
      // ignore index build errors here; API still works with upsert below
    }
    
    const { slug } = await params;
    const { action } = await request.json();
    
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
    
    if (action === 'like') {
      // Idempotent like using upsert to avoid duplicates even if unique index missing
      await BookLike.findOneAndUpdate(
        { bookId, userId },
        {
          $setOnInsert: {
            bookId,
            userId,
            userEmail: user.email,
            userName: user.displayName || user.email
          }
        },
        { upsert: true, new: true }
      );
    } else if (action === 'unlike') {
      // Remove like
      await BookLike.deleteOne({ bookId, userId });
    }
    
    // Get updated counts and status
    const likeCount = await BookLike.countDocuments({ bookId });
    const hasLiked = await BookLike.exists({ bookId, userId });
    
    return NextResponse.json({
      success: true,
      likes: likeCount,
      hasLiked: !!hasLiked,
      message: action === 'like' ? 'ڵایک کرا' : 'ڵایکەکە لابردرا'
    });
  } catch (error: any) {
    console.error('Error toggling book like:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to toggle like' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
