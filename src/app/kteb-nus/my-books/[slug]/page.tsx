'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '../../../../components/ConfirmDialogProvider';
import api from '@/utils/api';

interface Book {
  _id: string;
  title: string;
  description: string;
  genre: string;
  genres?: string[];
  status: string;
  coverImage: string;
  slug: string;
  isDraft: boolean;
  isPendingReview: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  spotifyLink?: string;
  youtubeLinks?: string[];
  resourceLinks?: Array<{ name: string; url: string }> | string[];
}

interface Chapter {
  _id: string;
  bookId: string;
  title: string;
  content?: string;
  excerpt?: string;
  isDraft: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function BookDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { currentUser } = useAuth();
  const router = useRouter();
  const confirmModal = useConfirm();
  const toast = useToast();
  // Localization helpers for status and genre
  const tStatus = (s: string | undefined) => {
    if (!s) return '';
    const key = s.toLowerCase();
    const map: Record<string, string> = {
      'ongoing': 'بەردەوامە',
      'on-going': 'بەردەوامە',
      'in progress': 'بەردەوامە',
      'finished': 'تەواوبووە',
      'completed': 'تەواوبووە',
      'hiatus': 'وەستاندن',
      'unpublished': 'بڵاونەکراوەتەوە',
      'published': 'بڵاوکراوەتەوە',
      'pending review': 'لەژێر پێداچوونەوەدایە',
      'draft': 'ڕەشنووس',
    };
    return map[key] || s;
  };
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
  // Refined genre icon helper
  const genreIcon = (value: string) => {
    const v = (value || '').toLowerCase();
    if (v.includes('romance')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 21s-7-4.5-9-8.5C1.5 9 3 6 6 6c1.8 0 3 .9 4 2 1-1.1 2.2-2 4-2 3 0 4.5 3 3 6.5-2 4-9 8.5-9 8.5z"/></svg>
    );
    if (v.includes('mystery')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9 9a3 3 0 116 0c0 2-3 2-3 5"/><circle cx="12" cy="19" r="1.2"/></svg>
    );
    if (v.includes('thriller') || v.includes('action')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M13 2L4 14h7l-1 8 10-12h-7l1-8z"/></svg>
    );
    if (v.includes('fantasy')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 4l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></svg>
    );
    if (v.includes('science')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M8 3h8l-2 5v6l3 4H7l3-4V8L8 3z"/></svg>
    );
    if (v.includes('horror')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 3a7 7 0 00-7 7v4a7 7 0 0014 0V10a7 7 0 00-7-7z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M8 15h8"/></svg>
    );
    if (v.includes('adventure')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2l3 7h7l-5 4 2 7-7-4-7 4 2-7-5-4h7l3-7z"/></svg>
    );
    if (v.includes('historical')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M6 3h12v18H6z"/><path d="M8 7h8M8 11h8M8 15h8"/></svg>
    );
    if (v.includes('poetry')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M5 4h9l5 5v11H5z"/><path d="M14 4v6h6"/></svg>
    );
    if (v.includes('biography') || v.includes('non-fiction')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M7 4h8a3 3 0 013 3v13H9a2 2 0 01-2-2V4z"/></svg>
    );
    if (v.includes('comedy')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01"/><path d="M8 14c1.333 1 2.667 1.5 4 1.5s2.667-.5 4-1.5"/></svg>
    );
    if (v.includes('drama')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M7 20l5-4 5 4"/></svg>
    );
    if (v.includes('young adult') || v.includes('new adult')) return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="7" r="3"/><path d="M4 21a8 8 0 0116 0"/></svg>
    );
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9"/></svg>
    );
  };
  // Per-genre theme with low-transparency
  const genreTheme = (value: string) => {
    const v = (value || '').toLowerCase();
    if (v.includes('romance')) return { tint: 'bg-pink-500/10', text: 'text-pink-700', ring: 'ring-pink-400/30' };
    if (v.includes('mystery')) return { tint: 'bg-indigo-500/10', text: 'text-indigo-700', ring: 'ring-indigo-400/30' };
    if (v.includes('thriller') || v.includes('action')) return { tint: 'bg-red-500/10', text: 'text-red-700', ring: 'ring-red-400/30' };
    if (v.includes('fantasy')) return { tint: 'bg-purple-500/10', text: 'text-purple-700', ring: 'ring-purple-400/30' };
    if (v.includes('science')) return { tint: 'bg-sky-500/10', text: 'text-sky-700', ring: 'ring-sky-400/30' };
    if (v.includes('horror')) return { tint: 'bg-gray-900/10', text: 'text-gray-800', ring: 'ring-gray-600/30' };
    if (v.includes('adventure')) return { tint: 'bg-amber-500/10', text: 'text-amber-800', ring: 'ring-amber-400/30' };
    if (v.includes('historical')) return { tint: 'bg-yellow-500/10', text: 'text-yellow-800', ring: 'ring-yellow-400/30' };
    if (v.includes('poetry')) return { tint: 'bg-emerald-500/10', text: 'text-emerald-800', ring: 'ring-emerald-400/30' };
    if (v.includes('biography') || v.includes('non-fiction')) return { tint: 'bg-teal-500/10', text: 'text-teal-800', ring: 'ring-teal-400/30' };
    if (v.includes('comedy')) return { tint: 'bg-lime-500/10', text: 'text-lime-800', ring: 'ring-lime-400/30' };
    if (v.includes('drama')) return { tint: 'bg-orange-500/10', text: 'text-orange-800', ring: 'ring-orange-400/30' };
    if (v.includes('young adult') || v.includes('new adult')) return { tint: 'bg-cyan-500/10', text: 'text-cyan-800', ring: 'ring-cyan-400/30' };
    return { tint: 'bg-violet-500/10', text: 'text-violet-800', ring: 'ring-violet-400/30' };
  };
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({ title: '', content: '' });
  const [hasMoreChapters, setHasMoreChapters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [spotifyLinkInput, setSpotifyLinkInput] = useState('');
  const [savingSpotify, setSavingSpotify] = useState(false);
  const [youtubeInputs, setYoutubeInputs] = useState<string[]>(['', '', '']);
  const [resourceInputs, setResourceInputs] = useState<Array<{ name: string; url: string }>>([
    { name: '', url: '' },
    { name: '', url: '' },
    { name: '', url: '' },
    { name: '', url: '' },
    { name: '', url: '' },
  ]);
  const [savingYouTube, setSavingYouTube] = useState(false);
  const [savingResources, setSavingResources] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  

  const getAuthToken = async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const youTubeIdFromUrl = (url: string) => {
    try {
      if (!url) return '';
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        return u.pathname.split('/').filter(Boolean)[0] || '';
      }
      if (u.pathname === '/watch') {
        return u.searchParams.get('v') || '';
      }
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/').filter(Boolean)[1] || '';
      }
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/').filter(Boolean)[1] || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  const sameSet = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = new Set(a);
    for (const x of b) if (!sa.has(x)) return false;
    return true;
  };

  const toYouTubeEmbedUrl = (url: string) => {
    try {
      if (!url) return '';
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
      return id ? `https://www.youtube.com/embed/${id}` : '';
    } catch {
      return '';
    }
  };

  const handleSaveYouTube = async () => {
    try {
      setSavingYouTube(true);
      // Clean and validate up to 3 links
      const cleaned = youtubeInputs
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .slice(0, 3);
      // If identical to saved (by video id), block save
      const nowIds = cleaned.map(youTubeIdFromUrl).filter(Boolean);
      const savedIds = Array.isArray(book?.youtubeLinks)
        ? book!.youtubeLinks!.map(youTubeIdFromUrl).filter(Boolean)
        : [];
      if (nowIds.length > 0 && sameSet(Array.from(new Set(nowIds)), Array.from(new Set(savedIds)))) {
        toast.warning('ناتوانیت پاشەکەوت بکەیت: بەستەری YouTube گۆڕانکاریان نەکراوە.');
        return;
      }
      if (cleaned.some((u) => u && !isValidYouTube(u))) {
        toast.error('تکایە بەستەرە نادروستەکانی YouTube چارەسەر بکە پێش پاشەکەوتکردن.');
        return;
      }
      const data = await api.put(`/api/ktebnus/me/books/${encodeURIComponent(slug)}`, { youtubeLinks: cleaned });
      setBook(data.book);
      // reflect normalized links from server into inputs
      const y = Array.isArray(data.book?.youtubeLinks) ? data.book.youtubeLinks.slice(0,3) : [];
      setYoutubeInputs([y[0]||'', y[1]||'', y[2]||'']);
      toast.success('بەستەرەکانی YouTube پاشەکەوت کران.');
    } catch (e: any) {
      console.error('Error saving YouTube links:', e);
      const status = e?.status || e?.code;
      const retryAfter = typeof e?.retryAfter === 'number' ? e.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error(e.message || 'پاشەکەوتکردنی بەستەرەکانی YouTube شکستی هێنا');
      }
    } finally {
      setSavingYouTube(false);
    }
  };

  const handleSaveResources = async () => {
    try {
      setSavingResources(true);
      // Clean and validate up to 5 links
      const cleaned = resourceInputs
        .map((it) => ({ name: (it.name || '').trim(), url: (it.url || '').trim() }))
        .filter((it) => !!it.url)
        .slice(0, 5);
      // If identical to saved (by URL, case-insensitive), block save
      const nowUrls = Array.from(new Set(cleaned.map((it) => it.url.toLowerCase())));
      const savedUrls = Array.isArray(book?.resourceLinks)
        ? Array.from(new Set((book!.resourceLinks as any[]).map((it: any) => (typeof it === 'string' ? it : it?.url || '').toLowerCase()).filter(Boolean)))
        : [];
      if (nowUrls.length > 0 && sameSet(nowUrls, savedUrls)) {
        toast.warning('ناتوانیت پاشەکەوت بکەیت: بەستەرە سەرچاوەکان گۆڕانکاریان لێ نەکراوە.');
        return;
      }
      if (cleaned.some((it) => it.url && !isValidHttpUrl(it.url))) {
        toast.error('تکایە بەستەرە نادروستەکانی سەرچاوە چارەسەر بکە پێش پاشەکەوتکردن.');
        return;
      }
      const data = await api.put(`/api/ktebnus/me/books/${encodeURIComponent(slug)}`, { resourceLinks: cleaned });
      setBook(data.book);
      const r = Array.isArray(data.book?.resourceLinks) ? data.book.resourceLinks.slice(0,5) : [] as any[];
      // Normalize server response (object[] or string[]) into UI shape
      const norm: Array<{ name: string; url: string }> = [0,1,2,3,4].map((i) => {
        const it = r[i];
        if (!it) return { name: '', url: '' };
        if (typeof it === 'string') return { name: '', url: it };
        return { name: it.name || '', url: it.url || '' };
      });
      setResourceInputs(norm);
      toast.success('بەستەری سەرچاوەکان پاشەکەوت کران.');
    } catch (e: any) {
      console.error('Error saving resource links:', e);
      const status = e?.status || e?.code;
      const retryAfter = typeof e?.retryAfter === 'number' ? e.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error(e.message || 'پاشەکەوتکردنی بەستەری سەرچاوەکان شکستی هێنا');
      }
    } finally {
      setSavingResources(false);
    }
  };

  const isValidYouTube = (url: string) => {
    try {
      if (!url) return false;
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0]?.length > 5;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (u.pathname === '/watch') return !!u.searchParams.get('v');
        if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/')) return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const isValidHttpUrl = (url: string) => {
    try {
      if (!url) return false;
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const toSpotifyEmbedUrl = (url: string) => {
    try {
      if (!url) return '';
      const u = new URL(url);
      if (u.hostname !== 'open.spotify.com') return '';
      // Remove query params and convert to /embed/
      const parts = u.pathname.split('/').filter(Boolean); // e.g., ['track','<id>']
      if (parts.length < 2) return '';
      const type = parts[0]; // track | playlist | album | artist | episode | show
      const id = parts[1];
      return `https://open.spotify.com/embed/${type}/${id}`;
    } catch {
      return '';
    }
  };

  const handleSaveSpotifyLink = async () => {
    try {
      setSavingSpotify(true);
      const data = await api.put(`/api/ktebnus/me/books/${encodeURIComponent(slug)}`, { spotifyLink: spotifyLinkInput });
      setBook(data.book);
      toast.success('بەستەری Spotify پاشەکەوت کرا.');
    } catch (e: any) {
      console.error('Error saving Spotify link:', e);
      const status = e?.status || e?.code;
      const retryAfter = typeof e?.retryAfter === 'number' ? e.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error(e.message || 'پاشەکەوتکردنی بەستەری Spotify شکستی هێنا');
      }
    } finally {
      setSavingSpotify(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBookData();
    }
  }, [currentUser, slug]);


  const fetchBookData = async () => {
    try {
      const data = await api.get(`/api/ktebnus/me/books/${encodeURIComponent(slug)}`);
      setBook(data.book);
      setSpotifyLinkInput(data.book?.spotifyLink || '');
      // Initialize videos/resources
      const y = Array.isArray(data.book?.youtubeLinks) ? data.book.youtubeLinks.slice(0,3) : [];
      const r = Array.isArray(data.book?.resourceLinks) ? data.book.resourceLinks.slice(0,5) : [] as any[];
      setYoutubeInputs([y[0]||'', y[1]||'', y[2]||'']);
      const norm: Array<{ name: string; url: string }> = [0,1,2,3,4].map((i) => {
        const it = r[i];
        if (!it) return { name: '', url: '' };
        if (typeof it === 'string') return { name: '', url: it };
        return { name: it.name || '', url: it.url || '' };
      });
      setResourceInputs(norm);
      // Fetch first page of chapters (3 per page)
      try {
        const LIMIT = 3;
        const ch = await api.get(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=0`, { cache: 'no-store' });
        if (ch && Array.isArray(ch.chapters)) {
          setChapters(ch.chapters);
          setHasMoreChapters(!!ch.hasMore);
        } else {
          setChapters([]);
          setHasMoreChapters(false);
        }
      } catch (e) {
        setChapters([]);
        setHasMoreChapters(false);
      }
    } catch (error: any) {
      console.error('Error fetching book:', error);
      const status = error?.status || error?.code;
      const retryAfter = typeof error?.retryAfter === 'number' ? error.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error('بارکردنی زانیاری کتێبەکە شکستی هێنا');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    const ok = await confirmModal({
      title: 'ناردن بۆ پشکنین؟',
      description: 'دڵنیایت ئەم کتێبە بنێریت بۆ پشکنین؟',
      confirmText: 'ناردن',
      cancelText: 'ڕەتکردنەوە',
    });
    if (!ok) return;

    setPublishing(true);
    try {
      const data = await api.post(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/publish`, {});

      setBook(data.book);
      toast.success('کتێبەکە بە سەرکەوتوویی نێردرا بۆ پشکنین!');
    } catch (error: any) {
      console.error('Error publishing book:', error);
      const status = error?.status || error?.code;
      const retryAfter = typeof error?.retryAfter === 'number' ? error.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error(error.message || 'بڵاوکردنەوەی کتێب شکستی هێنا');
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChapter.title || !newChapter.content) {
      toast.warning('تکایە ناونیشان و ناوەڕۆک پڕ بکەرەوە');
      return;
    }

    try {
      const data = await api.post(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/chapters`, newChapter);

      // Refresh first page
      try {
        const LIMIT = 3;
        const ch = await api.get(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=0`, { cache: 'no-store' });
        if (ch && Array.isArray(ch.chapters)) {
          setChapters(ch.chapters);
          setHasMoreChapters(!!ch.hasMore);
        }
      } catch {}
      setNewChapter({ title: '', content: '' });
      setShowNewChapter(false);
      toast.success('بابەت بە سەرکەوتوویی دروست کرا!');
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      const status = error?.status || error?.code;
      const retryAfter = typeof error?.retryAfter === 'number' ? error.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error(error.message || 'دروستکردنی بابەت شکستی هێنا');
      }
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const ok = await confirmModal({
      title: 'سڕینەوەی بابەت؟',
      description: 'ئەم کارە ناتوانرێت پێچەوانە بکرێتەوە.',
      confirmText: 'سڕینەوە',
      cancelText: 'ڕەتکردنەوە',
    });
    if (!ok) return;

    try {
      setDeletingChapterId(chapterId);
      await api.delete(`/api/ktebnus/me/chapters/${encodeURIComponent(chapterId)}`);

      // Refresh first page
      try {
        const LIMIT = 3;
        const ch = await api.get(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=0`, { cache: 'no-store' });
        if (ch && Array.isArray(ch.chapters)) {
          setChapters(ch.chapters);
          setHasMoreChapters(!!ch.hasMore);
        }
      } catch {}
      toast.success('بابەت بە سەرکەوتوویی سڕایەوە!');
    } catch (error: any) {
      console.error('Error deleting chapter:', error);
      const status = error?.status || error?.code;
      const retryAfter = typeof error?.retryAfter === 'number' ? error.retryAfter : 0;
      if (status === 429 || status === 'RATE_LIMIT') {
        const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
        toast.warning(msg);
      } else {
        toast.error('سڕینەوەی بابەت شکستی هێنا');
      }
    } finally {
      setDeletingChapterId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەسندکردن پێویستە</h1>
          <p className="text-gray-600 mb-4">تکایە بچۆ ژوورەوە بۆ دەستگەیشتن بە داشبۆردی کتێبەکەت.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">کتێب نەدۆزرایەوە</h1>
          <p className="text-gray-600 mb-4">ئەو کتێبەی داوات کردووە نەدۆزرایەوە.</p>
          <button
            onClick={() => router.push('/kteb-nus/drafts')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            گەرانەوە بۆ کتێبەکانم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Standalone Cover - smaller and isolated */}
        {book.coverImage && (
          <div className="mb-6 flex items-center justify-center">
            <div className="w-56 h-80 rounded-lg overflow-hidden">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Book Info Panel - title, description, meta, buttons */}
        <div className="bg-white rounded-2xl overflow-hidden mb-6">

          <div className="p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">{book.title}</h1>
            {book.description && (
              <p className="text-gray-700 leading-relaxed mb-4">{book.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                دۆخ: {book.isPublished ? 'بڵاوکراوەتەوە' : book.isPendingReview ? 'چاوەڕێی پشکنین' : 'ڕەشنووس'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700">
                بار: {tStatus(book.status)}
              </span>
              {/* Genres: show all if array exists, else show single */}
              {Array.isArray(book.genres) && book.genres.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  {book.genres.map((g, idx) => {
                    const theme = genreTheme(g);
                    return (
                      <span
                        key={`${g}-${idx}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${theme.tint} ${theme.text} ring-1 ${theme.ring}`}
                        title={tGenre(g)}
                      >
                        <span className="inline-flex items-center justify-center rounded-sm p-0.5 bg-white/60 ring-1 ring-white/50">
                          {genreIcon(g)}
                        </span>
                        {tGenre(g)}
                      </span>
                    );
                  })}
                </div>
              ) : (
                book.genre && (
                  <div className="flex flex-wrap items-center gap-1.5" title={tGenre(book.genre)}>
                    {(() => {
                      const g = book.genre;
                      const theme = genreTheme(g);
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${theme.tint} ${theme.text} ring-1 ${theme.ring}`}
                          title={tGenre(g)}
                        >
                          <span className="inline-flex items-center justify-center rounded-sm p-0.5 bg-white/60 ring-1 ring-white/50">
                            {genreIcon(g)}
                          </span>
                          {tGenre(g)}
                        </span>
                      );
                    })()}
                  </div>
                )
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push(`/kteb-nus/my-books/${slug}/edit`)}
                className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                دەستکاری ڕێکخستنەکانی کتێب
              </button>
              {book.isDraft && !book.isPendingReview && !book.isPublished && (
                <button
                  onClick={handlePublish}
                  disabled={publishing || chapters.length === 0}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing ? 'لە بڵاوکردنەوەدایە...' : 'بڵاوکردنەوەی کتێب'}
                </button>
              )}
            </div>
          </div>
      </div>

      {/* Note before Chapters Section */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-4" role="note" dir="rtl">
        بۆ بینینی نوێترین بەش و بابەتە زیادکراوەکان ڕیفرێش بکە
      </div>

      {/* Chapters Section */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">بابەتەکان</h2>
            <button
              onClick={() => router.push(`/kteb-nus/my-books/${slug}/write`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              نووسینی بابەتی نوێ
            </button>
          </div>

          {/* New Chapter Form */}
          {showNewChapter && (
            <div className="mb-6 p-4 border border-gray-200 rounded-md">
              <h3 className="text-lg font-semibold mb-4">دروستکردنی بابەتی نوێ</h3>
              <form onSubmit={handleCreateChapter} className="space-y-4">
                <input
                  type="text"
                  placeholder="ناونیشانی بابەت"
                  value={newChapter.title}
                  onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <textarea
                  placeholder="ناوەڕۆکی بابەت"
                  value={newChapter.content}
                  onChange={(e) => setNewChapter({...newChapter, content: e.target.value})}
                  rows={6}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    دروستکردنی بابەت
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewChapter(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    ڕەتکردنەوە
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Chapters List */}
          {chapters.length === 0 ? (
            <p className="text-gray-500 text-right py-8">هێشتا هیچ بابەتێک نییە. یەکەم بابەتت دروست بکە بۆ دەستپێکردن!</p>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div key={chapter._id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <button
                        onClick={() => router.push(`/kteb-nus/my-books/${slug}/chapters/${chapter._id}`)}
                        dir="rtl"
                        className="text-right w-full"
                        title="بینینی بابەت"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-700">
                          بابەتی {index + 1}: {chapter.title}
                        </h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">
                          {chapter.excerpt ?? (chapter.content ? chapter.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')}
                        </p>
                      </button>
                      <div className="flex gap-2 text-sm text-gray-500 mt-2 justify-end text-right">
                        <span>بار: {chapter.isDraft ? 'ڕەشنووس' : 'بڵاوکراوەتەوە'}</span>
                        <span>ڕیز: {chapter.order}</span>
                      </div>
                      {/* Actions under description */}
                      <div className="flex flex-wrap gap-2 mt-3 justify-end">
                        <button
                          onClick={() => router.push(`/kteb-nus/my-books/${slug}/chapters/${chapter._id}`)}
                          className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors"
                        >
                          بینین
                        </button>
                        <button
                          onClick={() => router.push(`/kteb-nus/my-books/${slug}/chapters/${chapter._id}/edit`)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          دەستکاری
                        </button>
                        <button
                          onClick={() => (deletingChapterId ? null : handleDeleteChapter(chapter._id))}
                          disabled={deletingChapterId === chapter._id}
                          className={`bg-red-600 text-white px-3 py-1.5 rounded text-sm transition-colors ${deletingChapterId === chapter._id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-700'}`}
                        >
                          {deletingChapterId === chapter._id ? 'سڕینەوە دەکرێت...' : 'سڕینەوە'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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
                        const more = await api.get(`/api/ktebnus/me/books/${encodeURIComponent(slug)}/chapters?limit=${LIMIT}&skip=${chapters.length}`, { cache: 'no-store' });
                        if (more && Array.isArray(more.chapters)) {
                          setChapters(prev => [...prev, ...more.chapters]);
                          setHasMoreChapters(!!more.hasMore);
                        } else {
                          setHasMoreChapters(false);
                        }
                      } catch (e: any) {
                        const status = e?.status || e?.code;
                        const retryAfter = typeof e?.retryAfter === 'number' ? e.retryAfter : 0;
                        if (status === 429 || status === 'RATE_LIMIT') {
                          const msg = retryAfter > 0 ? `داواکاری زۆرە. تکایە دووبارە هەوڵ بدە لە دوای ${retryAfter} چرکە.` : 'داواکاری زۆرە. تکایە کەمێک چاوەڕێ بکە و دوبارە هەوڵ بدە.';
                          toast.warning(msg);
                        }
                      } finally {
                        setLoadingMore(false);
                      }
                    }}
                    className={`px-4 py-2 rounded-md border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 ${loadingMore ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {loadingMore ? 'بارکردن...' : 'زیاتر پیشانبدە'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spotify Vibe Section */}
        <div className="bg-emerald-50 rounded-lg p-6 mt-6 border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-emerald-50 text-emerald-700">
                سپۆتیفای
                <img src="/icons/spotify.svg" alt="سپۆتیفای" width={16} height={16} />
              </span>
              <h2 className="text-lg font-semibold text-gray-900">سپۆتیفای کتێبەکەت</h2>
            </div>
          </div>
          <p className="text-gray-600 mb-6 text-right">گۆرانی/لیست/ئەلبومی سپۆتیفای زیاد بکە کە گونجاوە لەگەڵ هەست و نووسینی ئەم کتێبە.</p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={handleSaveSpotifyLink}
              disabled={savingSpotify || (!!spotifyLinkInput && !toSpotifyEmbedUrl(spotifyLinkInput))}
              className="px-4 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
            >
              {savingSpotify ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتی بەستەر'}
            </button>
            <input
              type="url"
              placeholder="بەستەرێکی Spotify بنووسە: https://open.spotify.com/track/... یان /playlist/..."
              value={spotifyLinkInput}
              onChange={(e) => setSpotifyLinkInput(e.target.value.trim())}
              className={`flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 placeholder:text-gray-400 ${spotifyLinkInput && !toSpotifyEmbedUrl(spotifyLinkInput) ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-green-500'}`}
            />
          </div>
          {spotifyLinkInput && !toSpotifyEmbedUrl(spotifyLinkInput) && (
            <p className="text-[12px] text-red-600 mt-1">تکایە بەستەرێکی دروستی Spotify لە open.spotify.com دابنێ (track, playlist, album, artist, episode, show).</p>
          )}
          <p className="text-[11px] text-gray-500 mt-2 text-right">پشتگیریکراوە: track, playlist, album, artist, episode, show (open.spotify.com)</p>

          {/* Saved link row */}
          {book?.spotifyLink && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
              <div className="truncate text-gray-700" title={book.spotifyLink}>
                {book.spotifyLink}
              </div>
              <a
                href={book.spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                بینین
              </a>
            </div>
          )}

          {toSpotifyEmbedUrl(spotifyLinkInput) && (
            <div className="mt-4">
              <div className="text-sm text-gray-700 mb-2">پێشبین</div>
              <iframe
                src={toSpotifyEmbedUrl(spotifyLinkInput)}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}
        </div>
        {/* YouTube Videos Section */}
        <div className="bg-red-50 rounded-lg p-6 mt-6 border border-red-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-red-50 text-red-700">
                یوتیوب
                <img src="/icons/youtube.svg" alt="یوتیوب" width={16} height={16} />
              </span>
              <h2 className="text-lg font-semibold text-gray-900">ڤیدیۆی پەیوەندیدار </h2>
            </div>
          </div>
          <p className="text-gray-600 mb-6 text-right">تا سێ بەستەری یوتیوب زیاد بکە کە پەیوەندیدارن بە کتێبەکەت.</p>

          <div className="flex flex-col gap-6">
            {youtubeInputs.map((val, idx) => (
              <div key={idx} className="flex flex-col gap-3">
                <input
                  type="url"
                  placeholder={`بەستەری YouTube ژمارە ${idx+1}`}
                  value={val}
                  onChange={(e) => {
                    const arr = [...youtubeInputs];
                    arr[idx] = e.target.value;
                    setYoutubeInputs(arr);
                  }}
                  className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 placeholder:text-gray-400 ${val && !isValidYouTube(val) ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-red-500'}`}
                />
                {toYouTubeEmbedUrl(val) && (
                  <div className="rounded-md overflow-hidden">
                    <iframe
                      src={toYouTubeEmbedUrl(val)}
                      title={`پێشبینی یوتیوب ژمارە ${idx+1}`}
                      width="100%"
                      height="220"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-4 justify-end">
            <button
              onClick={handleSaveYouTube}
              disabled={savingYouTube || youtubeInputs.some(v => v && !isValidYouTube(v))}
              className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {savingYouTube ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتی ڤیدیۆکان'}
            </button>
          </div>

          {/* Saved links row */}
          {book?.youtubeLinks && book.youtubeLinks.length > 0 && (
            <div className="mt-4 space-y-4">
              {book.youtubeLinks.map((u, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={u}>{u}</div>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">بینین</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Links Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6 mb-10 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full bg-indigo-50 text-indigo-700">
                سەرچاوەکان
                <img src="/icons/link.svg" alt="بەستەرەکان" width={16} height={16} />
              </span>
              <h2 className="text-lg font-semibold text-gray-900">لینک و سەرچاوە</h2>
            </div>
          </div>
          <p className="text-gray-600 mb-6 text-right">دەتوانیت تا پێنج لینک زیاد بکەیت کە پەیوەندیدارن بە کتێبەکەت.</p>

          <div className="grid grid-cols-1 gap-5">
            {resourceInputs.map((val, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <input
                  type="text"
                  placeholder={`ناو ژمارە ${idx+1}`}
                  value={val.name}
                  onChange={(e) => {
                    const arr = [...resourceInputs];
                    arr[idx] = { ...arr[idx], name: e.target.value };
                    setResourceInputs(arr);
                  }}
                  className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 border-gray-200 focus:ring-indigo-500"
                />
                <input
                  type="url"
                  placeholder={`بەستەری سەرچاوە ژمارە ${idx+1}`}
                  value={val.url}
                  onChange={(e) => {
                    const arr = [...resourceInputs];
                    arr[idx] = { ...arr[idx], url: e.target.value };
                    setResourceInputs(arr);
                  }}
                  className={`w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 placeholder:text-gray-400 ${val.url && !isValidHttpUrl(val.url) ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}`}
                />
                <div className="text-xs text-gray-500">ناو هەڵبژاردەیی + بەستەر</div>
              </div>
            ))}
          </div>
          <div className="flex mt-3 justify-end">
            <button
              onClick={handleSaveResources}
              disabled={savingResources || resourceInputs.some(v => v.url && !isValidHttpUrl(v.url))}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingResources ? 'پاشەکەوت دەکرێت...' : 'پاشەکەوتی سەرچاوەکان'}
            </button>
          </div>

          {book?.resourceLinks && (book.resourceLinks as any[]).length > 0 && (
            <div className="mt-3 space-y-3">
              {(book.resourceLinks as any[]).map((it: any, i: number) => {
                const url = typeof it === 'string' ? it : (it?.url || '');
                const name = typeof it === 'string' ? '' : (it?.name || '');
                if (!url) return null;
                return (
                  <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                    <div className="truncate text-gray-700" title={url}>
                      <span className={name ? 'font-medium' : 'text-gray-600'}>{name || url}</span>
                    </div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100">کردنەوە</a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
