'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/utils/api';

// Book interface for KtebNus public listing
interface Book {
  _id: string;
  title: string;
  writer: string;
  genre: string;
  image: string;
  slug: string;
  views?: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

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

const languages = ['هەموو', 'کوردی', 'عەرەبی', 'ئینگلیزی', 'فارسی', 'تورکی']; // kept for parity if needed

export default function Ktebnus() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  // store English value for backend; use 'all' sentinel
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('هەموو');
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 12, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic filter options from API
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Note: we render Kurdish labels via tGenre but keep English values in state

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch books from KtebNus API
  useEffect(() => {
    async function fetchBooks() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        });

        if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
        if (selectedGenre !== 'all') {
          params.append('genre', selectedGenre);
        }
        if (selectedYear !== 'هەموو') params.append('year', selectedYear);

        // Add cache-busting to reflect updated view counts immediately
        params.append('_t', Date.now().toString());
        const data = await api.get(`/api/ktebnus/books?${params.toString()}` , {}, { useCache: false });

        if (data.success) {
          setBooks(data.books || []);
          setPagination(data.pagination || pagination);
          if (data.filters) {
            if (data.filters.genres) setAvailableGenres(data.filters.genres);
            if (data.filters.years) setAvailableYears(data.filters.years);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch books');
        }
      } catch (err: any) {
        console.error('Error fetching ktebnus books:', err);
        setError(err.message || 'An error occurred while fetching books');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooks();
  }, [pagination.page, debouncedSearchQuery, selectedGenre, selectedYear]);

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              کتێبخانەی بەشی کتێب نووس
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
            لە بەشی کتێب نووسدا بەکارهێنەران دەتوانن کتێب، چیڕۆک و بابەتەکانیان بەشێوەی سیستەمی بەش بەش بڵاوبکەنەوە وەک یەک بەرهەمی تەواوەتی.
          </p>
          {pagination.total > 0 && (
            <div className="mt-4 inline-block bg-[var(--primary)]/10 px-4 py-2 rounded-full text-[var(--primary)] font-semibold">
              کۆی کتێبەکان: {pagination.total}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="گەڕان بۆ کتێب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50 text-lg"
            />
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]"
              onClick={() => setDebouncedSearchQuery(searchQuery)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <select
            value={selectedGenre}
            onChange={handleGenreChange}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50"
          >
            <option value="all">هەموو جۆرەکان</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {tGenre(genre)}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="px-6 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50"
          >
            <option value="هەموو">هەموو ساڵەکان</option>
            {availableYears.sort((a, b) => b - a).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="text-center">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ کتێبێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {books.map((book, idx) => (
                <Link href={`/ktebnus/${book.slug}`} key={book._id}>
                  <div className="group relative bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-[var(--primary)]/50 transition-colors duration-300">
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={book.image}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        priority={idx === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--primary)]">{tGenre(book.genre)}</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="text-xs text-gray-700 font-medium">{book.views ?? 0}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium mb-1 truncate whitespace-nowrap overflow-hidden text-ellipsis rtl-ellipsis-end group-hover:text-[var(--primary)] transition-colors" title={book.title}>
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-700 line-clamp-1">
                        {book.writer}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page <= 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                    }`}
                  >
                    &laquo; پێشوو
                  </button>

                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= pagination.page - 2 && pageNum <= pagination.page + 2)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && pagination.page > 4) ||
                      (pageNum === pagination.pages - 1 && pagination.page < pagination.pages - 3)
                    ) {
                      return <span key={pageNum} className="px-3 py-2">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page >= pagination.pages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white/10 backdrop-blur-md text-[var(--primary)] hover:bg-white/20'
                    }`}
                  >
                    داهاتوو &raquo;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
