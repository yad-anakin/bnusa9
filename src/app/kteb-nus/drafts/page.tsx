'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '../../../components/ConfirmDialogProvider';
import Link from 'next/link';
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import api from '@/utils/api';

export default function DraftsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const confirmModal = useConfirm();
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [total, setTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  // Using centralized API client for auth + base URL; no manual token handling needed

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  useEffect(() => {
    // Clamp current page if total changes (e.g., deletion)
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [total, totalPages]);

  useEffect(() => {
    if (currentUser) {
      // Reset to first page when auth changes
      setCurrentPage(1);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const controller = new AbortController();
    fetchDrafts(currentPage, controller.signal);
    return () => controller.abort();
  }, [currentUser, currentPage]);

  const fetchDrafts = async (page = 1, signal?: AbortSignal) => {
    try {
      setPageLoading(true);
      console.log('Fetching drafts page', page);
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      // Fetch from backend private drafts endpoint via centralized API client
      const data = await api.get(`/api/ktebnus/me/drafts?${params.toString()}`, { signal });
      const items = Array.isArray(data?.books) ? data.books : [];
      // Normalize image field naming for UI compatibility
      const normalized = items.map((b: any) => ({
        ...b,
        coverImage: b.coverImage || b.image || '',
      }));
      setBooks(normalized);
      setTotal(data?.pagination?.total || 0);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // Request was aborted due to navigation/page change
        return;
      }
      console.error('Error fetching books:', error);
      // More user-friendly error message
      const errorMessage = error.message || 'نەتوانرا کتێبەکان بار بکرێن';
      if (errorMessage.includes('token') || errorMessage.includes('auth')) {
        toast.error('تکایە دووبارە بچۆ ژوورەوە بۆ بینینی کتێبەکانت.');
      } else {
        toast.error(`هەڵە: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const handleDeleteBook = async (slug: string) => {
    const ok = await confirmModal({
      title: 'سڕینەوەی کتێب؟',
      description: 'دڵنیایت دەتەوێت ئەم کتێبە بسڕیتەوە؟ ئەم کردارە ناتوانرێت بوەسترێتەوە.',
      confirmText: 'سڕینەوە',
      cancelText: 'ڕەتکردنەوە',
    });
    if (!ok) return;

    try {
      await api.delete(`/api/ktebnus/me/drafts/${slug}`);

      // After deletion, refetch current page to keep server-side pagination in sync
      await fetchDrafts(currentPage);
      toast.success('کتێب بە سەرکەوتوویی سڕایەوە!');
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('سڕینەوەی کتێب شکستی هێنا');
    }
  };

  const getReviewBadge = (book: any) => {
    // Draft / Pending Review / Published
    if (book.isPublished) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.59a.75.75 0 1 0-1.22-.86l-3.236 4.592-2.03-2.03a.75.75 0 1 0-1.06 1.06l2.625 2.625a.75.75 0 0 0 1.14-.094l3.84-5.293Z" clipRule="evenodd" />
          </svg>
          بڵاوکراوەتەوە
        </span>
      );
    } else if (book.isPendingReview) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 1 0 9.75 9.75A9.761 9.761 0 0 0 12 2.25Zm-.75 5.25a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0Zm.75 9a1.125 1.125 0 1 1 0-2.25 1.125 1.125 0 0 1 0 2.25Z" clipRule="evenodd" />
          </svg>
          چاوەڕێی پشکنین
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12.75 3.564a9.72 9.72 0 0 1 4.5 1.745v3.553a48.816 48.816 0 0 0-9 0V5.309a9.72 9.72 0 0 1 4.5-1.745Z" />
            <path d="M8.25 9.77v10.033a9.77 9.77 0 0 1-3-1.48V9.77a47.948 47.948 0 0 1 3 0Z" />
            <path d="M18.75 9.77v8.553a9.77 9.77 0 0 1-3 1.48V9.77a47.948 47.948 0 0 1 3 0Z" />
            <path d="M21.75 12c0 .808-.04 1.607-.118 2.394a9.742 9.742 0 0 1-1.632 4.54V9.77c.51.31.988.662 1.43 1.05.204.176.32.432.32.7v.48Z" />
            <path d="M3 9.77v9.164a9.742 9.742 0 0 1-1.632-4.54A25.508 25.508 0 0 1 1.25 12v-.48c0-.268.116-.524.32-.7.442-.388.92-.74 1.43-1.05Z" />
          </svg>
          ڕەشنووس
        </span>
      );
    }
  };

  const getSeriesStatusBadge = (status: string) => {
    const isOngoing = String(status).toLowerCase() === 'ongoing';
    const color = isOngoing ? 'bg-blue-50 text-blue-700' : 'bg-fuchsia-50 text-fuchsia-700';
    const label = isOngoing ? 'بەردەوام' : 'تەواو'
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${color}`}>
        {isOngoing ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12 3.75a8.25 8.25 0 1 0 8.25 8.25A8.259 8.259 0 0 0 12 3.75Zm-.75 4.5a.75.75 0 1 1 1.5 0v3.38l2.47 1.428a.75.75 0 1 1-.75 1.298l-2.84-1.64a.75.75 0 0 1-.38-.65V8.25Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M7.5 3.75A3.75 3.75 0 0 0 3.75 7.5v9A3.75 3.75 0 0 0 7.5 20.25h9a3.75 3.75 0 0 0 3.75-3.75v-9A3.75 3.75 0 0 0 16.5 3.75h-9Zm1.72 4.72a.75.75 0 1 0-1.06 1.06L10.94 12l-2.78 2.72a.75.75 0 1 0 1.06 1.06L12 13.06l2.72 2.78a.75.75 0 1 0 1.06-1.06L13.06 12l2.78-2.72a.75.75 0 1 0-1.06-1.06L12 10.94 9.22 8.47Z" clipRule="evenodd" />
          </svg>
        )}
        {label}
      </span>
    );
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-30 relative overflow-hidden">
        {/* Subtle background elements - blue only */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <span className="inline-block text-sm font-semibold py-1 px-3 rounded-full bg-blue-50 text-blue-600 mb-3">چوونە ژوورەوە</span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">
              بەشداری لە بنووسە بکە
            </h1>
            <p className="text-lg mb-8 text-gray-600 max-w-xl mx-auto">
              بۆ نووسین و ناردنی وتار، هەڵسەنگاندن، کتێب و بینینی تەواوی کتێبەکانت، پێویستە سەرەتا چوونە ژوورەوە بکەیت یان هەژمارێک درووست بکەیت. <span className="text-blue-600">بنووسە پلاتفۆرمی نووسەرانی کوردە</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Link href="/signin" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              چوونە ژوورەوە
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors duration-200 w-auto min-w-[120px] justify-center">
              <UserPlusIcon className="h-5 w-5" />
              خۆت تۆمار بکە
            </Link>
          </div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">کتێبەکانم</h1>
          <button
            onClick={() => router.push('/kteb-nus/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            دروستکردنی کتێبی نوێ
          </button>
        </div>

        {books.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">هێشتا هیچ کتێبێکت نییە</h2>
            <p className="text-gray-600 mb-6">دەست بە نووسینی یەکەم کتێبت بکە!</p>
            <button
              onClick={() => router.push('/kteb-nus/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              یەکەم کتێبت دروست بکە
            </button>
          </div>
        )}

        {books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <div
                key={book._id}
                className="group rounded-xl border border-gray-200 p-5 transition-colors hover:border-blue-300 hover:bg-gray-50"
              >
                {/* Cover - true size (match creation/dashboard) */}
                {book.coverImage && (
                  <div className="w-full flex items-center justify-center mb-4">
                    <div className="w-56 h-80 rounded-md overflow-hidden ring-1 ring-gray-200 transition group-hover:ring-blue-300">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        width={224}
                        height={320}
                        sizes="(max-width: 640px) 224px, 224px"
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <h3 className="w-56 mx-auto text-lg font-semibold text-gray-900 text-center mb-2 truncate">{book.title}</h3>

                {/* Genre */}
                <div className="flex items-center justify-center gap-1 text-sm text-purple-700 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M6.75 3.75A3.75 3.75 0 0 0 3 7.5v9A3.75 3.75 0 0 0 6.75 20.25h10.5A3.75 3.75 0 0 0 21 16.5v-9A3.75 3.75 0 0 0 17.25 3.75H6.75Z" />
                    <path d="M7.5 7.5h9v3h-9v-3Z" />
                  </svg>
                  <span>{book.genre}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {getReviewBadge(book)}
                  {getSeriesStatusBadge(book.status)}
                </div>

                {/* Dates */}
                <div className="flex flex-col items-center text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M6.75 2.25a.75.75 0 0 1 .75.75V4.5h9V3a.75.75 0 0 1 1.5 0V4.5h.75A2.25 2.25 0 0 1 21 6.75v10.5A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V6.75A2.25 2.25 0 0 1 5.25 4.5H6V3a.75.75 0 0 1 .75-.75Z" />
                      <path d="M5.25 9.75h13.5v7.5A.75.75 0 0 1 18 18H6a.75.75 0 0 1-.75-.75v-7.5Z" />
                    </svg>
                    <span>دروستکراوە: {new Date(book.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 2.25a9.75 9.75 0 1 0 9.75 9.75A9.76 9.76 0 0 0 12 2.25Zm.75 5.25a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
                    </svg>
                    <span>نوێکرایەوە: {new Date(book.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/kteb-nus/my-books/${book.slug}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V5.25Zm3 1.5a.75.75 0 0 0-.75.75v9a.75.75 0 0 0 .75.75h9.75a.75.75 0 0 0 .75-.75v-9a.75.75 0 0 0-.75-.75H6.75Z" />
                    </svg>
                    کردنەوەی داشبۆڕد
                  </button>
                  <button
                    onClick={() => handleDeleteBook(book.slug)}
                    className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-transparent py-2 px-3 rounded text-sm hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M16.5 4.5V6h3a.75.75 0 0 1 0 1.5h-.637l-.638 9.136A3.75 3.75 0 0 1 14.485 20.25h-4.97a3.75 3.75 0 0 1-3.74-3.614L5.137 7.5H4.5A.75.75 0 0 1 4.5 6h3V4.5A2.25 2.25 0 0 1 9.75 2.25h4.5A2.25 2.25 0 0 1 16.5 4.5Zm-6.75 3a.75.75 0 0 1 .75.75v8.25a.75.75 0 0 1-1.5 0V8.25a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v8.25a.75.75 0 0 1-1.5 0V8.25a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                    </svg>
                    سڕینەوە
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {total > pageSize && (
          <div className="mt-8 flex items-center justify-center gap-2 select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || pageLoading}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              پێشوو
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => !pageLoading && setCurrentPage(n)}
                  className={`w-9 h-9 rounded-md border text-sm transition-colors ${
                    currentPage === n
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-current={currentPage === n ? 'page' : undefined}
                  disabled={pageLoading}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || pageLoading}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              دواتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
