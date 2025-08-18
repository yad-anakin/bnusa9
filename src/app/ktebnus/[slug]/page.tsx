'use client';
import { useState, useEffect, use as usePromise, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import NotFound from '@/components/NotFound';
import BookCommentSection from '@/components/BookCommentSection';
import { useToast } from '@/contexts/ToastContext';

// Kurdish translation for genres (case-insensitive)
const tGenre = (g: string | undefined) => {
  if (!g) return '';
  const key = g.toLowerCase();
  const map: Record<string, string> = {
    'fiction': 'ئەفسانەیی',
    'adventure': 'سەرکێشی',
    'romance': 'ڕۆمانسی',
    'mystery': 'نهێنی',
    'fantasy': 'خەیاڵی',
    'sci-fi': 'زانستی خەیاڵی',
    'science fiction': 'زانستی خەیاڵی',
    'horror': 'ترسناک',
    'thriller': 'هەستبزوێن',
    'historical': 'مێژوویی',
    'historical fiction': 'مێژوویی خەیاڵی',
    'biography': 'ژیاننامە',
    'poetry': 'ئەدەب/شیعر',
    'drama': 'دراما',
    'comedy': 'کۆمیدی',
    'non-fiction': 'واقیعی',
    'nonfiction': 'واقیعی',
    'contemporary': 'ئاینی',
    'self-help': 'خۆهاریکاری',
    'education': 'پەروەردە',
    'children': 'منداڵانه',
    'young adult': 'گەنجان',
    'new adult': 'نوێ-گەنجان',
    'crime': 'تاوان',
    'spiritual': 'روحانی',
    'philosophy': 'فەلسەفە',
    'technology': 'تەکنەلۆژی',
    'business': 'بازرگانی',
    'health': 'تەندروستی',
    'travel': 'گەشتوگوزار',
    'art': 'هونەری',
    'music': 'مۆسیقا',
    'sports': 'وەرزش',
    'cooking': 'خواردن',
    'politics': 'سیاسەت',
    'science': 'زانست',
    'religion': 'ئایین',
    'classic': 'کلاسیک',
    'history': 'مێژوو',
    'essay': 'وتار',
    'short story': 'چیرۆکی کورت',
    'short stories': 'چیرۆکی کورت',
    'action': 'ئاکشن',
    'literary fiction': 'ئەدەبی ئەفسانەیی',
    'other': 'ئەوانەی تر',
    'anthology': 'کۆبەند',
  };
  return map[key] || g;
};

// Build Spotify embed URL from an open.spotify.com link
const toSpotifyEmbedUrl = (url?: string) => {
  try {
    if (!url) return '';
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '') !== 'open.spotify.com') return '';
    let parts = u.pathname.split('/').filter(Boolean);
    // Handle internationalized paths like /intl-en/track/{id}
    if (parts[0]?.startsWith('intl-')) {
      parts = parts.slice(1);
    }
    if (parts.length < 2) return '';
    const type = parts[0]; // track | playlist | album | artist | episode | show
    const id = parts[1];
    if (!type || !id) return '';
    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return '';
  }
};

interface Book {
  _id: string;
  slug: string;
  title: string;
  writer: string;
  writerUsername?: string;
  writerAvatar?: string;
  ownerId?: string;
  genre: string;
  genres?: string[];
  image: string;
  description?: string;
  views?: number;
  status?: 'ongoing' | 'finished';
  isPublished?: boolean;
  partsCount?: number; // Optional: if backend provides later
  youtubeLinks?: string[];
  resourceLinks?: Array<{ url: string; title: string; type: string }>;
  spotifyLink?: string;
}

interface RelatedBook {
  _id: string;
  slug: string;
  title: string;
  image: string;
  writer: string;
  genre?: string;
  views?: number;
}

interface ChapterPublic {
  _id: string;
  title: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function KtebnusBookPage({ params }: { params: { slug: string } } | { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { currentUser } = useAuth();
  // Unwrap params for Next.js App Router
  let slug = '';
  if (typeof (params as any)?.then === 'function') {
    const unwrapped = usePromise(params as Promise<{ slug: string }>);
    slug = (unwrapped as { slug: string }).slug;
  } else {
    slug = (params as { slug: string }).slug;
  }

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [chapters, setChapters] = useState<ChapterPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreChapters, setHasMoreChapters] = useState(false);
  const [totalChapters, setTotalChapters] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const { success: showToastSuccess, error: showToastError, notify } = useToast();
  // Color palette for chapter rows (subtle tints)
  const cardColors = [
    'bg-blue-50 border-blue-100',
    'bg-indigo-50 border-indigo-100',
    'bg-purple-50 border-purple-100',
    'bg-amber-50 border-amber-100',
    'bg-emerald-50 border-emerald-100',
    'bg-rose-50 border-rose-100'
  ];
  const colorForId = (id: string) => {
    let h = 0 >>> 0;
    for (let i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) >>> 0;
    }
    return cardColors[h % cardColors.length];
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [shareMenuRef]);

  // Likes and other calls now go through external backend via shared api helper


  // Fetch like data after book is loaded (uses backend likes API by slug)
  const fetchLikeData = async (bookSlug: string) => {
    try {
      // Get like count from backend
      const countResponse = await api.get(`/api/ktebnus/books/${encodeURIComponent(bookSlug)}/like`, {}, { useCache: false });
      if (countResponse?.success && typeof countResponse.count === 'number') {
        setLikeCount(countResponse.count);
      }

      // Check if user has liked (only if user is authenticated)
      if (currentUser) {
        const likeStatusResponse = await api.get(`/api/ktebnus/books/${encodeURIComponent(bookSlug)}/like/check`, {}, { useCache: false });
        if (likeStatusResponse?.success && typeof likeStatusResponse.hasLiked === 'boolean') {
          setHasLiked(likeStatusResponse.hasLiked);
        }
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
    }
  };

  const handleLikeToggle = async () => {
    if (!currentUser) {
      notify('تکایە سەرەتا چوونە ژوورەوە بکە', 'error');
      return;
    }

    if (!book) return;

    setIsLiking(true);
    try {
      const action = hasLiked ? 'unlike' : 'like';
      const response = await api.post(`/api/ktebnus/books/${encodeURIComponent(slug)}/like`, { action });
      
      if (response.success) {
        // Some backends return updated likes under different keys; fall back to increment/decrement
        if (typeof response.likes === 'number') {
          setLikeCount(response.likes);
        } else {
          setLikeCount((prev) => prev + (hasLiked ? -1 : 1));
        }
        setHasLiked(!hasLiked);
        // Use server-provided localized message (ڵایک کرا / ڵایکەکە لابردرا)
        notify(response.message || (!hasLiked ? 'ڵایک کرا' : 'ڵایکەکە لابردرا'), 'success');
      } else {
        notify('هەڵەیەک ڕوویدا', 'error');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      notify('هەڵەیەک ڕوویدا', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!book) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  };
  
  const shareToSocial = (platform: string) => {
    if (!book) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(book.title);
    const text = encodeURIComponent(book.description || '');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${title} ${url}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href)
          .then(() => {
            showToastSuccess('لینک کۆپی کرا بۆ کلیپبۆرد');
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
          });
        setShowShareMenu(false);
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // StrictMode in dev can mount effects twice; guard with a short cooldown per slug
        const key = `ktebnus_viewed_${slug}`;
        const now = Date.now();
        const COOLDOWN_MS = 3000; // 3 seconds
        let shouldIncrement = true;
        if (typeof window !== 'undefined') {
          const last = window.sessionStorage.getItem(key);
          if (last) {
            const lastTs = parseInt(last, 10);
            if (!Number.isNaN(lastTs) && now - lastTs < COOLDOWN_MS) {
              shouldIncrement = false;
            }
          }
          // Record the view time regardless to throttle duplicates
          try { window.sessionStorage.setItem(key, String(now)); } catch {}
        }

        let data;
        if (shouldIncrement) {
          data = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}?_t=${Date.now()}`, {}, { useCache: false });
        } else {
          // Fetch without incrementing views during cooldown
          data = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}?noInc=1&_t=${Date.now()}`, {}, { useCache: false });
        }
        if (data.success && data.book) {
          const b = data.book;
          // Normalize YouTube links: ensure array of non-empty strings
          const normalizedYouTube: string[] = Array.isArray(b.youtubeLinks)
            ? b.youtubeLinks.filter((x: any) => typeof x === 'string' && x.trim() !== '').slice(0, 3)
            : [];

          // Helper to infer resource type from URL
          const inferType = (url: string): string => {
            try {
              const u = url.toLowerCase();
              if (u.includes('.pdf')) return 'pdf';
              if (u.includes('.ppt') || u.includes('.pptx')) return 'presentation';
              if (u.includes('.xls') || u.includes('.xlsx') || u.includes('sheet')) return 'spreadsheet';
              if (u.includes('.doc') || u.includes('.docx') || u.includes('doc')) return 'doc';
              if (u.includes('drive.google.com')) return 'googledoc';
            } catch {}
            return 'link';
          };

          // Normalize resource links to expected shape { url, title, type }
          const normalizedResources: Array<{ url: string; title: string; type: string }> = Array.isArray(b.resourceLinks)
            ? (b.resourceLinks as any[])
                .map((r) => {
                  if (!r) return null;
                  const url = typeof r.url === 'string' ? r.url : (typeof r === 'string' ? r : '');
                  if (!url || url.trim() === '') return null;
                  const title = (r.title || r.name || '').toString().trim() || 'پەیوەندی';
                  const type = (r.type || inferType(url)).toString();
                  return { url, title, type };
                })
                .filter(Boolean) as Array<{ url: string; title: string; type: string }>
            : [];

          setBook({
            _id: String(b._id),
            slug: b.slug,
            title: b.title,
            writer: b.writer || '',
            writerUsername: b.writerUsername || '',
            writerAvatar: b.writerAvatar || '',
            ownerId: b.ownerId || '',
            genre: b.genre || '',
            genres: Array.isArray(b.genres) ? b.genres : undefined,
            image: b.image || '',
            description: b.description || '',
            views: typeof b.views === 'number' ? b.views : 0,
            status: (b.status as 'ongoing' | 'finished') || 'ongoing',
            isPublished: !!b.isPublished,
            partsCount: typeof b.partsCount === 'number' ? b.partsCount : undefined,
            youtubeLinks: normalizedYouTube.length ? normalizedYouTube : undefined,
            resourceLinks: normalizedResources.length ? normalizedResources : undefined,
            // Preserve string even if empty, to help debug rendering/state
            spotifyLink: typeof b.spotifyLink === 'string' ? String(b.spotifyLink) : undefined
          });

          // fetch related by genre
          if (b.genre) {
            const rel = await api.get(`/api/ktebnus/books?genre=${encodeURIComponent(String(b.genre))}&limit=6`);
            if (rel.success && Array.isArray(rel.books)) {
              setRelatedBooks(
                rel.books
                  .filter((rb: any) => rb.slug !== b.slug)
                  .slice(0, 6)
              );
            }
          }

          // Fetch like data after book is loaded
          if (b.slug) {
            fetchLikeData(String(b.slug));
          }

          // fetch first page of published chapters (pagination: 3 at a time) from backend API
          try {
            const LIMIT = 3;
            const ch = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=0&_t=${Date.now()}`, {}, { useCache: false });
            if (ch.success && Array.isArray(ch.chapters)) {
              setChapters(ch.chapters);
              setHasMoreChapters(!!ch.hasMore);
              setTotalChapters(typeof ch.total === 'number' ? ch.total : ch.chapters.length);
            } else {
              setChapters([]);
              setHasMoreChapters(false);
              setTotalChapters(0);
            }
          } catch (e) {
            // Non-fatal for page render
            setChapters([]);
            setHasMoreChapters(false);
            setTotalChapters(0);
          }
        } else {
          throw new Error(data.message || 'Book not found');
        }
      } catch (err: any) {
        console.error('Error fetching ktebnus book:', err);
        setError(err.message || 'An error occurred while fetching the book');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) fetchBook();
  }, [slug]);

  // Memoize Spotify embed URL
  const embed = useMemo(() => toSpotifyEmbedUrl(book?.spotifyLink), [book?.spotifyLink]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !book) {
    return <NotFound message="ببورە، کتێبەکە نەدۆزرایەوە." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/5 via-white to-[var(--primary)]/5">
      {/* Back Button */}
      <div className="flex justify-end">
        <button
          onClick={() => router.back()}
          className="m-4 md:m-6 bg-blue-200/30 backdrop-blur-sm rounded-full p-3 border border-blue-300/40 hover:bg-blue-200/50 transition-colors duration-300"
        >
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pt-0 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Book Image and Quick Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-16">
              <div className="rounded-2xl bg-white/40 backdrop-blur-sm p-3 flex items-center justify-center">
                <div className="w-56 h-80 rounded-md overflow-hidden shadow-sm">
                  <img
                    src={(book.image && book.image.trim() !== '') ? book.image : '/images/book-placeholder.jpg'}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target && target.src !== window.location.origin + '/images/book-placeholder.jpg' && !target.src.endsWith('/images/book-placeholder.jpg')) {
                        target.src = '/images/book-placeholder.jpg';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-[var(--primary)] mb-4">{book.title}</h1>
                {book.description && (
                  <p className="text-[var(--grey-dark)] text-lg mb-6">{book.description}</p>
                )}
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                {/* Writer with avatar and link */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-2">نووسەر</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--primary)]/20">
                      <img
                        src={book.writerAvatar && book.writerAvatar.trim() !== '' ? book.writerAvatar : '/images/avatar-placeholder.png'}
                        alt={book.writer || 'author'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (target && target.src !== window.location.origin + '/images/avatar-placeholder.png' && !target.src.endsWith('/images/avatar-placeholder.png')) {
                            target.src = '/images/avatar-placeholder.png';
                          }
                        }}
                      />
                    </div>
                    {(() => {
                      const slugify = (s: string) =>
                        s
                          .toLowerCase()
                          .trim()
                          .replace(/[^\p{L}\p{N}]+/gu, '-')
                          .replace(/(^-|-$)+/g, '');
                      const username = (book.writerUsername || '').trim();
                      const profileSlug = username !== '' ? username : slugify(book.writer || '');
                      const profileHref = profileSlug ? `/users/${encodeURIComponent(profileSlug)}` : '#';
                      return (
                        <Link href={profileHref} className="text-lg font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis rtl-ellipsis-end hover:text-[var(--primary)]" title={book.writer}>
                          {book.writer}
                        </Link>
                      );
                    })()}
                  </div>
                </div>
                {/* Views */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">ژمارەی بینینەکان</h3>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {(book.views ?? 0).toLocaleString()}
                  </p>
                </div>
                {/* Genre(s) */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex flex-col justify-center">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">جۆر</h3>
                  {Array.isArray(book.genres) && book.genres.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {book.genres.map((g, i) => (
                        <span key={`${g}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/70 border border-purple-200 text-purple-700">
                          {tGenre(g)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-lg font-semibold">{tGenre(book.genre)}</p>
                  )}
                </div>
                {/* Parts count */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">ژمارەی بەشەکان</h3>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {typeof totalChapters === 'number' ? totalChapters : chapters.length}
                  </p>
                </div>
                {/* Status */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">دۆخی چاپکردن</h3>
                  {(() => {
                    const published = !!book.isPublished;
                    const isOngoing = book.status === 'ongoing';
                    const badgeClass = published
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : isOngoing
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200';
                    const label = published ? 'بڵاوکراوەتەوە' : (isOngoing ? 'بەردەوامە' : 'کوتایی هاتووە');
                    const icon = published ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : isOngoing ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    );
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${badgeClass}`}>
                        {icon}
                        <span>{label}</span>
                      </span>
                    );
                  })()}
                </div>
                {/* Writing status (ongoing/finished) */}
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                  <h3 className="text-sm font-medium text-[var(--grey-dark)] mb-1">دۆخی نووسین</h3>
                  {(() => {
                    const isOngoing = book.status === 'ongoing';
                    const badgeClass = isOngoing
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      : 'bg-green-100 text-green-700 border-green-200';
                    const label = isOngoing ? 'بەردەوامە' : 'کوتایی هاتووە';
                    const icon = isOngoing ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    );
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${badgeClass}`}>
                        {icon}
                        <span>{label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Chapters List */}
              {/* Chapters moved below grid for full width */}

              {/* YouTube Videos Section moved below grid */}
              
            </div>
          </div>
        </div>
        {/* Chapters List - Full Width */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">بەشەکان</h2>
          {chapters.length === 0 ? (
            <p className="text-[var(--grey)]">بەش بڵاوکراوە نییە.</p>
          ) : (
            <div className="space-y-3">
              {chapters.map((ch, idx) => (
                <Link
                  key={ch._id}
                  href={`/ktebnus/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(ch._id)}`}
                  className={`flex items-center justify-between rounded-lg p-3 border hover:border-[var(--primary)]/30 transition-colors ${colorForId(ch._id)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-semibold">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-[var(--grey-dark)] truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-[80vw] sm:max-w-[70vw] md:max-w-[60vw]">
                      {ch.title}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--primary)]">بینین</span>
                </Link>
              ))}
              {hasMoreChapters && (
                <div className="pt-2 flex justify-center">
                  <button
                    disabled={loadingMore}
                    onClick={async () => {
                      if (loadingMore) return;
                      try {
                        setLoadingMore(true);
                        const LIMIT = 3;
                        const more = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=${chapters.length}&_t=${Date.now()}`, {}, { useCache: false });
                        if (more.success && Array.isArray(more.chapters)) {
                          setChapters(prev => [...prev, ...more.chapters]);
                          setHasMoreChapters(!!more.hasMore);
                          if (typeof more.total === 'number') setTotalChapters(more.total);
                        } else {
                          setHasMoreChapters(false);
                        }
                      } catch (e) {
                      } finally {
                        setLoadingMore(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-md border border-[var(--primary)]/30 text-[var(--primary)] bg-white/60 hover:bg-white ${loadingMore ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loadingMore ? 'چاوەڕوان بە...' : 'بەشی زیاتر'}
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        {/* Spotify Section - Full Width */}
        {book.spotifyLink && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-gray-800">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white">
                  {/* Spotify icon */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.628 5.373 12 12 12s12-5.372 12-12C24 5.373 18.627 0 12 0zm5.455 17.273a.75.75 0 01-1.03.273c-2.82-1.724-6.377-2.114-10.557-1.162a.75.75 0 11-.33-1.462c4.545-1.026 8.53-.59 11.64 1.29.354.217.467.68.276 1.061zm1.318-3.182a.937.937 0 01-1.286.34c-3.228-1.971-8.153-2.543-11.963-1.397a.937.937 0 01-.528-1.797c4.322-1.27 9.727-.64 13.444 1.607.45.275.593.87.333 1.247zm.128-3.39c-3.876-2.303-10.308-2.512-14.012-1.38a1.125 1.125 0 01-.66-2.157c4.39-1.344 11.54-1.091 16.03 1.57a1.125 1.125 0 01-1.358 1.967z"/>
                  </svg>
                </span>
                <span>سپۆتیفای</span>
              </h3>
              <a
                href={book.spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 hover:underline"
              >
                کردەوە لە سپۆتیفای ↗
              </a>
            </div>
            {(() => {
              return embed ? (
                <div className="rounded-xl overflow-hidden border border-green-100 bg-white">
                  <iframe
                    src={embed}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-500">لینکی سپۆتیفای بەردەستە، بەڵام پێشبینین نیشان نادات.</div>
              );
            })()}
          </div>
        )}

        {/* YouTube Videos Section - Full Width */}
        {book.youtubeLinks && book.youtubeLinks.length > 0 && (
          <div className="mt-12 pt-10 relative">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-4 text-gray-800 bg-white py-2 px-4 rounded-full">
                  <span className="bg-gradient-to-r from-red-600 to-red-500 text-white p-2 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1H2V6zM14 6H2v8a2 2 0 002 2h12a2 2 0 002-2V6h-2z" />
                    </svg>
                  </span>
                  <span>ڤیدیۆکانی یوتیوب</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {book.youtubeLinks.map((link, index) => {
                  const m = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.*&v=))([^#&?]+)/);
                  const videoId = m ? m[1] : '';
                  return (
                    <div key={index} className="bg-white rounded-2xl overflow-hidden border border-red-100 group transform hover:-translate-y-1 transition-all duration-300">
                      <div className="relative aspect-video bg-black">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98A.998.998 0 008 6.82z"/>
                            </svg>
                          </div>

                          <iframe 
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={`YouTube video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                            loading="lazy"
                          ></iframe>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 border-t border-gray-50">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                                <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                              </svg>
                            </div>
                          </div>

                          <div className="flex-1 mr-0">
                            <a 
                              href={link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="block text-sm sm:text-base font-semibold text-gray-800 hover:text-red-600 transition-colors group-hover:underline line-clamp-2"
                              title={link}
                            >
                              ڤیدیۆی یوتیوب #{index + 1}
                            </a>
                            <div className="flex flex-wrap items-center mt-2">
                              <span className="inline-flex items-center gap-2 text-xs text-red-600 font-medium mr-3">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                  <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                                </svg>
                                <span>YouTube</span>
                              </span>
                              <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-gray-300 mx-2"></span>
                              <span className="text-xs text-gray-500 mr-3 sm:mr-3 sm:ml-3">کردنەوە لە یوتیوب</span>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <a 
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative inline-flex items-center justify-center p-2 sm:p-3 text-red-600 hover:text-white transition-all duration-300 rounded-full overflow-hidden"
                              title="کردنەوە لە یوتیوب"
                            >
                              <span className="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                              
                              <span className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-90 scale-0 group-hover:scale-100 transition-all duration-300 rounded-full"></span>
                              
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 ml-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-100 rounded-full opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
          </div>
        )}

        {/* Resource Links Section - Full Width */}
        {book.resourceLinks && book.resourceLinks.length > 0 && (
          <div className="mt-12 pt-10 relative">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-4 text-gray-800 bg-white py-2 px-4 rounded-full">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span>سەرچاوەکان و بەڵگەنامەکان</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {book.resourceLinks.map((resource, index) => (
                  <div key={index} className="bg-white rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="p-5 flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 ${
                          resource.type === 'pdf' 
                            ? 'bg-red-100' 
                            : resource.type === 'doc' || resource.type === 'googledoc'
                              ? 'bg-blue-100' 
                              : resource.type === 'presentation'
                                ? 'bg-orange-100'
                                : resource.type === 'spreadsheet'
                                  ? 'bg-green-100'
                                  : 'bg-gray-100'
                        } rounded-full flex items-center justify-center`}>
                          {resource.type === 'pdf' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'doc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'presentation' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 002 0V7z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'spreadsheet' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'googledoc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0116.414 5L14 2.586A2 2 0 0112.586 2H9z" />
                              <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h8a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                              <path d="M4 9a1 1 0 00-1 1h1a1 1 0 100-2H4z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium text-lg text-gray-800">{resource.title}</h4>
                        <p className="text-gray-500 text-sm mt-1 mb-3 truncate max-w-full">{resource.url}</p>
                        <a 
                          href={resource.url} 
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <span>داگرتن یان کردنەوە</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-100 rounded-full opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
          </div>
        )}

        {/* Related Books - Full Width */}
        {relatedBooks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">کتێبە پەیوەندیدارەکان</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedBooks.map((relatedBook) => (
                <Link href={`/ktebnus/${relatedBook.slug}`} key={relatedBook._id}>
                  <div className="bg-white/40 rounded-xl p-4 border border-[var(--primary)]/10 hover:border-[var(--primary)]/30 transition-colors duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-24 rounded-sm overflow-hidden">
                        <Image
                          src={relatedBook.image || '/images/book-placeholder.jpg'}
                          alt={relatedBook.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 truncate whitespace-nowrap overflow-hidden text-ellipsis rtl-ellipsis-end" title={relatedBook.title}>{relatedBook.title}</h3>
                        <p className="text-sm text-[var(--grey)]">{relatedBook.writer}</p>
                        {relatedBook.genre && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-[var(--grey)]">{tGenre(relatedBook.genre)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Likes, Comments, and Shares Section */}
        <div className="container mx-auto px-6 py-6 border-t border-gray-100">
          <div className="flex justify-between items-center">
            {/* Like Button */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLikeToggle}
                disabled={isLiking}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  hasLiked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLiking ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${hasLiked ? 'fill-current' : 'stroke-current fill-none'}`} 
                    viewBox="0 0 24 24" 
                    strokeWidth={hasLiked ? 0 : 2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                <span className="font-medium">{likeCount}</span>
                <span className="text-sm">{hasLiked ? 'پسندکراوە' : 'پسندکردن'}</span>
              </button>
            </div>

            {/* Share Button */}
            <div className="flex space-x-2 relative" ref={shareMenuRef}>
              <button 
                onClick={handleShare}
                className="flex items-center text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                بڵاوکردنەوە
              </button>
              
              {showShareMenu && (
                <div className="absolute left-0 bottom-12 bg-white shadow-lg rounded-lg p-2 z-50 w-48">
                  <div className="py-1">
                    <button
                      onClick={() => shareToSocial('facebook')}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    >
                      <svg className="h-5 w-5 text-blue-600 ml-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      فەیسبووک
                    </button>
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    >
                      <svg className="h-5 w-5 text-blue-400 ml-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                      تویتەر
                    </button>
                    <button
                      onClick={() => shareToSocial('telegram')}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    >
                      <svg className="h-5 w-5 text-blue-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm-3.578 15.744c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      تێلێگرام
                    </button>
                    <button
                      onClick={() => shareToSocial('whatsapp')}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    >
                      <svg className="h-5 w-5 text-green-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      واتساپ
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => shareToSocial('copy')}
                      className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    >
                      <svg className="h-5 w-5 text-gray-500 ml-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                      </svg>
                      لینک کۆپی بکە
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comment Section */}
        {book && (
          <div className="mt-10">
            <BookCommentSection bookSlug={book.slug} bookOwnerId={book.ownerId || ''} />
          </div>
        )}
      </div>
    </div>
  );
}
