import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookComment from '@/models/BookComment';
import Book from '@/models/Book';
import { requireAuth } from '@/lib/auth';

// GET /api/ktebnus/books/[slug]/comments - Get comments for a book
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const skip = (page - 1) * limit;
    
    // Find book by slug
    const book = await Book.findOne({ slug, isPublished: true });
    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    const bookId = book._id.toString();
    
    // Get top-level comments (no parent)
    const comments = await BookComment.find({
      bookId,
      parentId: null,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await BookComment.find({
          bookId,
          parentId: comment._id.toString(),
          isDeleted: false
        })
        .sort({ createdAt: 1 })
        .lean();

        // For each reply, get the parent comment's username
        const repliesWithParentInfo = await Promise.all(
          replies.map(async (reply) => {
            const parentComment = await BookComment.findById(reply.parentId).lean();
            return {
              ...reply,
              parentUserName: parentComment?.userName || parentComment?.userEmail || 'User'
            };
          })
        );

        return {
          ...comment,
          replies: repliesWithParentInfo || []
        };
      })
    );

    // Get total count for pagination
    const total = await BookComment.countDocuments({
      bookId,
      parentId: null,
      isDeleted: false
    });

    const pages = Math.ceil(total / limit);

    // Normalize comments to ensure required fields for UI
    const normalizedComments = commentsWithReplies.map((c: any) => ({
      _id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      userName: c.userName || c.userEmail || 'User',
      userProfileImage: c.userProfileImage || '',
      userId: c.userId,
      parentId: c.parentId || null,
      replies: (c.replies || []).map((r: any) => ({
        _id: r._id,
        content: r.content,
        createdAt: r.createdAt,
        userName: r.userName || r.userEmail || 'User',
        userProfileImage: r.userProfileImage || '',
        userId: r.userId,
        parentId: r.parentId || null,
        parentUserName: r.parentUserName || '',
        replies: []
      }))
    }));

    const hasMore = page < pages;

    return NextResponse.json({
      success: true,
      comments: normalizedComments,
      hasMore,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error: any) {
    console.error('Error fetching book comments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/ktebnus/books/[slug]/comments - Create a new comment
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();
    
    const { slug } = await params;
    const { content, parentId } = await request.json();
    
    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.trim().length > 1000) {
      return NextResponse.json(
        { success: false, message: 'Comment is too long (max 1000 characters)' },
        { status: 400 }
      );
    }
    
    // Find book by slug
    const book = await Book.findOne({ slug, isPublished: true });
    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    const bookId = book._id.toString();
    
    // If parentId is provided, validate it exists
    if (parentId) {
      const parentComment = await BookComment.findOne({
        _id: parentId,
        bookId,
        isDeleted: false
      });
      
      if (!parentComment) {
        return NextResponse.json(
          { success: false, message: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }
    
    // Create comment
    const comment = await BookComment.create({
      bookId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.email,
      userProfileImage: user.photoURL || '',
      content: content.trim(),
      parentId: parentId || null
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: comment._id,
        content: comment.content,
        userName: comment.userName,
        userProfileImage: comment.userProfileImage,
        userId: comment.userId,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        replies: []
      }
    });
  } catch (error: any) {
    console.error('Error creating book comment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create comment' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
