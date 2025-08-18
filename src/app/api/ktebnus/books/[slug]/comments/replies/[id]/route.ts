import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookComment from '@/models/BookComment';
import { requireAuth } from '@/lib/auth';

// GET /api/ktebnus/books/[slug]/comments/replies/[id] - Get replies for a specific comment
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find replies to the specific comment
    const replies = await BookComment.find({
      parentId: id,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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

    // Get total count for pagination
    const total = await BookComment.countDocuments({
      parentId: id,
      isDeleted: false
    });

    const pages = Math.ceil(total / limit);
    const hasMore = page < pages;

    // Normalize replies to ensure required fields for UI
    const normalizedReplies = repliesWithParentInfo.map((r: any) => ({
      _id: r._id,
      content: r.content,
      createdAt: r.createdAt,
      userName: r.userName || r.userEmail || 'User',
      userProfileImage: r.userProfileImage || '',
      userId: r.userId,
      parentId: r.parentId || null,
      parentUserName: r.parentUserName || '',
      replies: []
    }));

    return NextResponse.json({
      success: true,
      data: normalizedReplies,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore
      }
    });
  } catch (error: any) {
    console.error('Error fetching comment replies:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}
