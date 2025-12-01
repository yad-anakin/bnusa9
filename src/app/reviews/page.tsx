'use client';

import React, { useState, useEffect, useRef } from 'react';
import ArticleCard from '@/components/ArticleCard';
import ReviewCard from '@/components/ReviewCard';
import api from '@/utils/api';
import Link from 'next/link';
import InViewFadeSlide from '@/components/InViewFadeSlide';

// Define the Review type (same as Article for now)
interface Author {
  name: string;
  username?: string;
  profileImage?: string;
  isWriter?: boolean;
}

interface Review {
  _id: string;
  id?: number; // Add indexed id field
  title: string;
  description: string;
  author: Author;
  slug: string;
  categories: string[];
  status?: string;
  coverImage?: string;
  rating?: number;
  year?: number;
  recommended?: boolean;
  genre?: string;
}

// Only three genres for reviews
const categories = [
  { name: 'هەموو', icon: 'hashtag', color: 'bg-gray-600' },
  { name: 'فیلم', icon: 'film', color: 'bg-blue-500' },
  { name: 'زنجیرە', icon: 'tv', color: 'bg-pink-500' },
  { name: 'کتێب', icon: 'book', color: 'bg-emerald-500' },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('هەموو');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);
  const reviewsPerPage = 9;
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [realTotalCount, setRealTotalCount] = useState(0);

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 100);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchReviews(1);
  }, [activeCategory]);

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage, debouncedSearchQuery]);

  const fetchReviews = async (page: number) => {
    try {
      setLoading(true);
      setShowNoResults(false);
      const categoryParam = activeCategory !== 'هەموو' ? `&category=${activeCategory}` : '';
      const searchParam = debouncedSearchQuery.trim() ? `&search=${encodeURIComponent(debouncedSearchQuery.trim())}` : '';
      const apiUrl = `/api/reviews?limit=${reviewsPerPage}&page=${page}${categoryParam}${searchParam}`;
      const data = await api.noCache.get(apiUrl);
      if (data.success) {
        setReviews(data.reviews || []);
        if (debouncedSearchQuery.trim() && data.reviews?.length === 0) {
          setShowNoResults(true);
          setTotalCount(0);
          setRealTotalCount(0);
          setTotalPages(1);
        } else {
          setShowNoResults(false);
          if (data.totalCount !== undefined) {
            setTotalCount(data.totalCount);
            const calculatedTotalPages = Math.ceil(data.totalCount / reviewsPerPage);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          } else if (data.totalPages !== undefined) {
            setTotalPages(data.totalPages);
            setTotalCount(data.totalPages * reviewsPerPage);
          } else {
            setTotalCount(data.reviews?.length || 0);
            setTotalPages(1);
          }
          setRealTotalCount(data.totalCount || data.total || totalCount);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError('Failed to load reviews. Please try again later.');
      setReviews([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setIsSearching(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchQuery('');
    setIsSearching(true);
    setShowNoResults(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(true);
    setShowNoResults(false);
    setCurrentPage(1);
    fetchReviews(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Helper function to render icons for each category
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'hashtag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" className="inline align-[-6px]"><path fill="#3B82F6" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="m17 11l7.071-7.071L31.142 11l-7.07 7.071zm13 13l7.071-7.071L44.142 24l-7.07 7.071zM4 24l7.071-7.071L18.142 24l-7.07 7.071zm13 13l7.071-7.071L31.142 37l-7.07 7.071z"/></svg>
        );
      case 'film':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="inline align-[-2px]"><g fill="none" ><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#3B82F6" d="M12 2c5.523 0 10 4.477 10 10a9.99 9.99 0 0 1-3.999 8H20a1 1 0 1 1 0 2h-8C6.477 22 2 17.523 2 12S6.477 2 12 2m0 12a2 2 0 1 0 0 4a2 2 0 0 0 0-4m-4-4a2 2 0 1 0 0 4a2 2 0 0 0 0-4m8 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4m-4-4a2 2 0 1 0 0 4a2 2 0 0 0 0-4"/></g></svg>
        );
      case 'tv':
        return (
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="inline align-[-2px]"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#3B82F6" d="M20 3a2 2 0 0 1 1.995 1.85L22 5v14a2 2 0 0 1-1.85 1.995L20 21H4a2 2 0 0 1-1.995-1.85L2 19V5a2 2 0 0 1 1.85-1.995L4 3zm0 14h-2v2h2zM6 17H4v2h2zm14-4h-2v2h2zM6 13H4v2h2zm14-4h-2v2h2zM6 9H4v2h2zm14-4h-2v2h2zM6 5H4v2h2z"/></g></svg>
        );
      case 'book':
        return (
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"  className="inline align-[-2px]"><path fill="#3B82F6" d="M21.5 5.134a1 1 0 0 1 .493.748L22 6v13a1 1 0 0 1-1.5.866A8 8 0 0 0 13 19.6V4.426a10 10 0 0 1 8.5.708M11 4.427l.001 15.174a8 8 0 0 0-7.234.117l-.327.18l-.103.044l-.049.016l-.11.026l-.061.01L3 20h-.042l-.11-.012l-.077-.014l-.108-.032l-.126-.056l-.095-.056l-.089-.067l-.06-.056l-.073-.082l-.064-.089l-.022-.036l-.032-.06l-.044-.103l-.016-.049l-.026-.11l-.01-.061l-.004-.049L2 6a1 1 0 0 1 .5-.866a10 10 0 0 1 8.5-.707"/></svg>
        );
      default:
        return null;
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Pagination component (same as publishes)
  const renderPagination = () => {
    if (totalPages <= 1 || showNoResults) return null;
    const MAX_VISIBLE_PAGES = 5;
    const pageButtons: React.ReactNode[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }

    const baseBtn =
      'min-w-8 h-8 px-2 rounded-full text-xs border transition-colors duration-150 backdrop-blur-md';
    const activeBtn =
      'bg-[var(--primary)]/80 text-white border-transparent';
    const normalBtn =
      'bg-white/20 text-gray-800 border-white/30 hover:bg-white/30 hover:text-[var(--primary)]';
    const disabledBtn = 'opacity-50 cursor-not-allowed';

    pageButtons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${baseBtn} ${currentPage === 1 ? disabledBtn : normalBtn}`}
        aria-label="Previous page"
      >
        ‹
      </button>
    );

    if (startPage > 1) {
      pageButtons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={`${baseBtn} ${currentPage === 1 ? activeBtn : normalBtn}`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageButtons.push(
          <span key="ellipsis1" className="px-1.5 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${baseBtn} ${currentPage === i ? activeBtn : normalBtn}`}
          aria-current={currentPage === i ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons.push(
          <span key="ellipsis2" className="px-1.5 text-gray-500">
            ...
          </span>
        );
      }
      pageButtons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`${baseBtn} ${currentPage === totalPages ? activeBtn : normalBtn}`}
        >
          {totalPages}
        </button>
      );
    }

    pageButtons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${baseBtn} ${currentPage === totalPages ? disabledBtn : normalBtn}`}
        aria-label="Next page"
      >
        ›
      </button>
    );

    return (
      <div className="w-full flex justify-center mt-8">
        <nav
          className="flex items-center gap-1.5 bg-white/20 backdrop-blur-lg px-2.5 py-1.5 rounded-full border border-white/30"
          aria-label="Pagination"
        >
          {pageButtons}
        </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      <div className="container mx-auto px-4 py-30">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto max-[350px]:text-3xl">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              هەڵسەنگاندنەکان
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
            لێرە دەتوانیت هەڵسەنگاندنی فیلم، زنجیرە و کتێبەکان ببینیت و بگەڕێیت.
          </p>
          {realTotalCount > 0 && !showNoResults && (
            <div className="mt-4 inline-block bg-[var(--primary)]/10 px-4 py-2 rounded-full text-[var(--primary)] font-semibold">
              کۆی هەڵسەنگاندنەکان: {realTotalCount}
            </div>
          )}
        </div>
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input
              type="text"
              placeholder="گەڕان بۆ هەڵسەنگاندن..."
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
        {/* Categories */}
        <div className="mb-10 relative p-4">
          <div className="flex justify-center items-center relative">
            {/* Left scroll button */}
            <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={scrollLeft}
                className="bg-white/80 backdrop-blur-md rounded-full p-2 text-[var(--primary)] hover:text-[var(--primary-dark)] hover:shadow-sm transition-all ml-1 border border-[var(--grey-light)]/50"
                aria-label="Scroll left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {/* Right scroll button */}
            <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <button 
                onClick={scrollRight}
                className="bg-white/80 backdrop-blur-md rounded-full p-2 text-[var(--primary)] hover:text-[var(--primary-dark)] hover:shadow-sm transition-all mr-1 border border-[var(--grey-light)]/50"
                aria-label="Scroll right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {/* Scrollable genres */}
            <div 
              ref={scrollRef}
              className="flex space-x-2 overflow-x-auto scrollbar-hide px-8 md:px-0 md:flex-wrap md:justify-center gap-2 py-2"
            >
              {categories.map((category) => (
                <button
                  key={category.name}
                  className={`px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                    category.name === activeCategory
                      ? `bg-[var(--primary)]/10 border border-[var(--primary)]/50 text-[var(--primary)] font-medium` 
                      : 'border border-white/20 bg-white/10 backdrop-blur-md text-gray-700 hover:border-[var(--primary)]/50'
                  }`}
                  onClick={() => handleCategoryChange(category.name)}
                >
                  {renderCategoryIcon(category.icon)} {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="text-center">{error}</p>
          </div>
        )}
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
          </div>
        ) : showNoResults ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ هەڵسەنگاندنێک نەدۆزرایەوە بۆ "{searchQuery}"</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ هەڵسەنگاندنێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            <div className="w-full flex justify-center">
              <div
                className="grid justify-center gap-6 md:gap-8 xl:gap-10 reviews-responsive-grid"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                  maxWidth: '1200px',
                  width: '100%'
                }}
              >
                {reviews.map((review, idx) => (
                  <InViewFadeSlide key={review._id} delay={idx * 0.12 + 0.15} className="flex justify-center">
                    <Link href={`/reviews/${review.id}`} className="block w-full group" style={{ textDecoration: 'none' }}>
                      <div className="transition-transform duration-200 group-hover:scale-105">
                        <ReviewCard
                          poster={review.coverImage || '/images/placeholders/article-primary.png'}
                          title={review.title}
                          genre={review.genre || (review.categories && review.categories[0]) || ''}
                          rating={typeof review.rating === 'number' ? review.rating : 0}
                          year={typeof review.year === 'number' ? review.year : 0}
                          description={review.description}
                          recommended={typeof review.recommended === 'boolean' ? review.recommended : false}
                          author={review.author}
                        />
                      </div>
                    </Link>
                  </InViewFadeSlide>
                ))}
              </div>
            </div>
            {renderPagination()}
          </>
        )}
      </div>
      <style jsx global>{`
        @media (max-width: 380px) {
          .reviews-responsive-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
} 