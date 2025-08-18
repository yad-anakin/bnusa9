import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Chapter from '@/models/Chapter';
import { requireAuth } from '@/lib/auth';
import { sanitizeBookData } from '@/lib/sanitize';

// Validate Spotify URLs (open.spotify.com) and supported entity types
function validateSpotifyUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!(u.hostname === 'open.spotify.com' || u.hostname === 'www.open.spotify.com')) return false;
    // Allow optional locale prefix like /intl-en/ and optional /embed/
    const m = u.pathname.match(/^\/(?:intl-[A-Za-z-]+\/)?(?:embed\/)?(track|playlist|album|artist|episode|show)\/([A-Za-z0-9]+)(?:\/)?$/);
    return !!m;
  } catch {
    return false;
  }
}

// Normalize Spotify URL to canonical form: https://open.spotify.com/{type}/{id}
function normalizeSpotifyUrl(url: string): string {
  const u = new URL(url);
  // Force hostname to open.spotify.com
  u.hostname = 'open.spotify.com';
  // Extract type and id while ignoring optional intl/embed prefixes
  const m = u.pathname.match(/^\/(?:intl-[A-Za-z-]+\/)?(?:embed\/)?(track|playlist|album|artist|episode|show)\/([A-Za-z0-9]+)(?:\/)?$/);
  if (!m) return `https://${u.hostname}`; // fallback, though we call this only after validate
  const [, type, id] = m;
  return `https://${u.hostname}/${type}/${id}`;
}

// Simple per-user in-memory rate limiter (window: 60s, limit: 20)
const putRate = new Map<string, { count: number; resetAt: number }>();

// YouTube validators/normalizers
function validateYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0]?.length > 5;
      if (u.pathname === '/watch') return !!u.searchParams.get('v');
      // Accept shorts and share links; will normalize
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/').filter(Boolean)[1]?.length > 5;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/').filter(Boolean)[1]?.length > 5;
    }
    return false;
  } catch {
    return false;
  }
}

function normalizeYouTubeUrl(url: string): string {
  const u = new URL(url);
  const host = u.hostname.replace(/^www\./, '');
  let id = '';
  if (host === 'youtu.be') {
    id = u.pathname.split('/').filter(Boolean)[0] || '';
  } else if (u.pathname === '/watch') {
    id = u.searchParams.get('v') || '';
  } else if (u.pathname.startsWith('/shorts/')) {
    id = u.pathname.split('/').filter(Boolean)[1] || '';
  } else if (u.pathname.startsWith('/embed/')) {
    id = u.pathname.split('/').filter(Boolean)[1] || '';
  }
  if (!id) return '';
  return `https://www.youtube.com/watch?v=${id}`;
}

function validateGenericHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}


// GET /api/kteb-nus/books/[slug] - Get specific book with chapters
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { slug } = await params;

    const book = await Book.findOne({ slug, userId: user.uid });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Get chapters for this book
    const chapters = await Chapter.find({ bookId: book._id })
      .sort({ order: 1 })
      .select('-__v');

    return NextResponse.json({ book, chapters });
  } catch (error: any) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch book' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// PUT /api/kteb-nus/books/[slug] - Update book
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    // Rate limit per user: 20 requests / 60s
    const now = Date.now();
    const key = user.uid;
    const windowMs = 60_000;
    const limit = 20;
    const rec = putRate.get(key);
    if (!rec || now > rec.resetAt) {
      putRate.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      rec.count += 1;
      if (rec.count > limit) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again shortly.' },
          { status: 429 }
        );
      }
    }

    const { slug } = await params;
    const body = await request.json();
    const sanitizedData = sanitizeBookData(body);

    const book = await Book.findOne({ slug, userId: user.uid });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updateData: any = {};
    if (sanitizedData.title) updateData.title = sanitizedData.title;
    if (sanitizedData.description) updateData.description = sanitizedData.description;
    if (sanitizedData.genre) updateData.genre = sanitizedData.genre;
    if (sanitizedData.status) updateData.status = sanitizedData.status;
    if (sanitizedData.coverImage !== undefined) updateData.coverImage = sanitizedData.coverImage;
    if (sanitizedData.spotifyLink !== undefined) {
      const link = (sanitizedData.spotifyLink || '').trim();
      if (link === '') {
        updateData.spotifyLink = '';
      } else if (!validateSpotifyUrl(link)) {
        return NextResponse.json(
          { error: 'Invalid Spotify link. Only open.spotify.com track/playlist/album/artist/episode/show URLs are allowed.' },
          { status: 400 }
        );
      } else {
        updateData.spotifyLink = normalizeSpotifyUrl(link);
      }
    }

    // youtubeLinks: accept up to 3 valid links, normalize
    if (sanitizedData.youtubeLinks !== undefined) {
      const arr = Array.isArray(sanitizedData.youtubeLinks) ? sanitizedData.youtubeLinks : [];
      const cleaned = arr
        .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .slice(0, 3);
      const normalized: string[] = [];
      for (const link of cleaned) {
        if (!validateYouTubeUrl(link)) {
          return NextResponse.json(
            { error: 'Invalid YouTube link provided.' },
            { status: 400 }
          );
        }
        const n = normalizeYouTubeUrl(link);
        if (!n) {
          return NextResponse.json(
            { error: 'Invalid YouTube link provided.' },
            { status: 400 }
          );
        }
        normalized.push(n);
      }
      // ensure unique while preserving order
      updateData.youtubeLinks = Array.from(new Set(normalized));
    }

    // resourceLinks: accept up to 5 links, each can be string (url) or object { name, url }
    if (sanitizedData.resourceLinks !== undefined) {
      const arr = Array.isArray(sanitizedData.resourceLinks) ? sanitizedData.resourceLinks : [];
      // map to objects
      const mapped = arr
        .map((item: any) => {
          if (!item) return null;
          if (typeof item === 'string') return { name: '', url: item.trim() };
          if (typeof item === 'object') {
            const name = typeof item.name === 'string' ? item.name.trim() : '';
            const url = typeof item.url === 'string' ? item.url.trim() : '';
            return url ? { name, url } : null;
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 5) as Array<{ name: string; url: string }>;
      for (const link of mapped) {
        if (!validateGenericHttpUrl(link.url)) {
          return NextResponse.json(
            { error: 'Invalid resource link provided. Only http/https URLs are allowed.' },
            { status: 400 }
          );
        }
        // optional: enforce max length on name
        if (link.name && link.name.length > 100) {
          return NextResponse.json(
            { error: 'Resource link name is too long (max 100 characters).' },
            { status: 400 }
          );
        }
      }
      // ensure unique by URL while preserving order
      const seen = new Set<string>();
      const unique = mapped.filter((it) => {
        const key = it.url.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      updateData.resourceLinks = unique;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      book._id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      book: updatedBook,
      message: 'Book updated successfully' 
    });
  } catch (error: any) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update book' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// DELETE /api/kteb-nus/books/[slug] - Delete book and its chapters
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectDB();

    const { slug } = await params;

    const book = await Book.findOne({ slug, userId: user.uid });
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Delete all chapters first
    await Chapter.deleteMany({ bookId: book._id });
    
    // Delete the book
    await Book.findByIdAndDelete(book._id);

    return NextResponse.json({ 
      message: 'Book and all chapters deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete book' },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
