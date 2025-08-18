import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';
import { requireAuth } from '@/lib/auth';
import { sanitizeBookData } from '@/lib/sanitize';

// GET /api/kteb-nus/chapters/[id] - Get specific chapter
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { id } = await params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Find the book to verify ownership
    const book = await Book.findById(chapter.bookId);
    console.log('DEBUG - Chapter bookId:', chapter.bookId);
    console.log('DEBUG - Book found:', book ? 'Yes' : 'No');
    console.log('DEBUG - Book data:', book);
    console.log('DEBUG - Current user UID:', user.uid);
    
    if (!book) {
      return NextResponse.json(
        { error: 'Associated book not found' },
        { status: 404 }
      );
    }

    // Verify user owns the book
    console.log('DEBUG - Book userId:', book.userId);
    console.log('DEBUG - User UID:', user.uid);
    console.log('DEBUG - Match:', book.userId === user.uid);
    
    if (book.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ chapter });
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// PUT /api/kteb-nus/chapters/[id] - Update chapter
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const sanitizedData = sanitizeBookData(body);

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Find the book to verify ownership
    const book = await Book.findById(chapter.bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Associated book not found' },
        { status: 404 }
      );
    }
    if (book.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update allowed fields
    const updateData: any = {};
    if (sanitizedData.title) updateData.title = sanitizedData.title;
    if (sanitizedData.content) updateData.content = sanitizedData.content;
    if (typeof sanitizedData.isDraft === 'boolean') updateData.isDraft = sanitizedData.isDraft;
    updateData.updatedAt = new Date();

    const updatedChapter = await Chapter.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      chapter: updatedChapter,
      message: 'Chapter updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chapter' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// DELETE /api/kteb-nus/chapters/[id] - Delete chapter
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { id } = await params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Find the book to verify ownership
    const book = await Book.findById(chapter.bookId);
    if (!book) {
      return NextResponse.json(
        { error: 'Associated book not found' },
        { status: 404 }
      );
    }
    if (book.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await Chapter.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Chapter deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chapter' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
