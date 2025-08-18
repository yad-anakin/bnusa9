import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BookComment from '@/models/BookComment';
import Book from '@/models/Book';
import { requireAuth } from '@/lib/auth';

// DELETE /api/ktebnus/books/[slug]/comments/[id] - Delete a comment
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();
    
    const { slug, id } = await params;
    
    // Find book by slug
    const book = await Book.findOne({ slug, isPublished: true });
    if (!book) {
      return NextResponse.json(
        { success: false, message: 'Book not found' },
        { status: 404 }
      );
    }

    const bookId = book._id.toString();
    
    // Find comment
    const comment = await BookComment.findOne({
      _id: id,
      bookId,
      isDeleted: false
    });
    
    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Comment not found' },
        { status: 404 }
      );
    }
    
    // Check if user owns the comment or is the book owner
    if (comment.userId !== user.uid && book.userId !== user.uid) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }
    
    // Helper: recursively collect all descendant reply IDs
    const collectDescendantIds = async (parentIds: string[]): Promise<string[]> => {
      const replies = await BookComment.find({
        bookId,
        parentId: { $in: parentIds }
      })
        .select('_id')
        .lean();
      if (!replies || replies.length === 0) return [];
      const nextIds = replies.map((r: any) => r._id.toString());
      const deeper = await collectDescendantIds(nextIds);
      return [...nextIds, ...deeper];
    };

    // Collect target id + all descendants and HARD delete them
    const idsToDelete = [id, ...(await collectDescendantIds([id]))];
    const result = await BookComment.deleteMany({ _id: { $in: idsToDelete } });
    
    const deletedCount = (result as any).deletedCount ?? (result as any).n ?? 0;
    if (!result || deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete comment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting book comment:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete comment' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
