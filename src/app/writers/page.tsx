'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import WriterCardOptimized from '@/components/WriterCardOptimized';
import api from '@/utils/api';
import { PencilSquareIcon, AdjustmentsHorizontalIcon, PaintBrushIcon, ChatBubbleLeftRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';

// Removed decorative animation CSS for performance

// Define the User type with roles flags
interface User {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
  bio: string;
  isWriter: boolean | string;
  isSupervisor: boolean | string;
  isDesigner: boolean | string;
  isReviewer?: boolean | string;
  isKtebNus?: boolean | string;
  articles: any[];
  followers: any[];
  designsCount?: number; // For designers
  writingCount?: number; // For supervisors (deprecated)
  supervisorText?: string; // For supervisors
  articlesCount?: number; // Aggregated count from backend
  reviewsCount?: number; // Aggregated accepted reviews count from backend
}

export default function StaffPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'publishes' | 'supervisors' | 'designers' | 'reviews' | 'ktebNus'>('publishes');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8; // Show 8 users per page
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [totalPages, setTotalPages] = useState(1); // State to hold total pages from backend
  const [totalCount, setTotalCount] = useState(0);
  // Cache for KtebNus published books counts keyed by username
  const [booksCounts, setBooksCounts] = useState<Record<string, number>>({});
  // Cache for Publishes (articles) counts keyed by userId
  const [articlesCounts, setArticlesCounts] = useState<Record<string, number>>({});
  // Cache for Reviews counts keyed by username
  const [reviewsCounts, setReviewsCounts] = useState<Record<string, number>>({});

  // Removed animation style injection effect

  // Debounce search input to reduce API calls
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch users for the current page only (uses debounced search)
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        let url = `/api/users?limit=${usersPerPage}&page=${currentPage}`;
        const params = [];
        if (debouncedSearchTerm) params.push(`search=${encodeURIComponent(debouncedSearchTerm)}`);
        if (activeTab === 'publishes') params.push('isWriter=true');
        if (activeTab === 'supervisors') params.push('isSupervisor=true');
        if (activeTab === 'designers') params.push('isDesigner=true');
        if (activeTab === 'reviews') params.push('isReviewer=true');
        if (activeTab === 'ktebNus') params.push('isKtebNus=true');
        if (params.length > 0) url += `&${params.join('&')}`;
        const data = await api.get(url, {}, {
          useCache: false,
          cacheDuration: 0,
          signal,
        } as any);
        if (data.success) {
          const users = data.users || [];
          setAllUsers(users);
          // Use backend pagination if available
          if (data.pagination && data.pagination.pages) {
            setTotalPages(data.pagination.pages);
          } else {
            setTotalPages(1);
          }
          if (data.pagination && typeof data.pagination.total === 'number') {
            setTotalCount(data.pagination.total);
          } else {
            setTotalCount(users.length);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch users');
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          setError('Failed to load users. Please try again later.');
          setAllUsers([]);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };
    fetchUsers();
    return () => controller.abort();
  }, [debouncedSearchTerm, activeTab, currentPage]);

  // N+1: Fetch published books count per user for KtebNus tab
  useEffect(() => {
    if (activeTab !== 'ktebNus') return;
    const controller = new AbortController();
    const { signal } = controller;
    const fetchCounts = async () => {
      try {
        const missing = allUsers
          .map(u => u.username)
          .filter((u): u is string => !!u && !(u in booksCounts));
        if (missing.length === 0) return;
        const results = await Promise.allSettled(
          missing.map(async (username) => {
            const resp = await api.get(`/api/ktebnus/books/by-author/${encodeURIComponent(username)}?limit=1`, {}, { useCache: true, cacheDuration: 60_000, signal } as any);
            if (resp?.success && resp?.pagination && typeof resp.pagination.total === 'number') {
              return { username, count: resp.pagination.total as number };
            }
            return { username, count: 0 };
          })
        );
        const updates: Record<string, number> = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            updates[r.value.username] = r.value.count;
          }
        }
        if (Object.keys(updates).length > 0) {
          setBooksCounts(prev => ({ ...prev, ...updates }));
        }
      } catch (_) {
        // ignore per-user count errors
      }
    };
    fetchCounts();
    return () => controller.abort();
  }, [activeTab, allUsers, booksCounts]);

  // N+1: Fetch published articles count per user for Publishes tab
  useEffect(() => {
    if (activeTab !== 'publishes') return;
    const controller = new AbortController();
    const { signal } = controller;
    const fetchCounts = async () => {
      try {
        const missing = allUsers
          .map(u => u._id)
          .filter((id): id is string => !!id && !(id in articlesCounts));
        if (missing.length === 0) return;
        const results = await Promise.allSettled(
          missing.map(async (userId) => {
            const resp = await api.get(`/api/users/${encodeURIComponent(userId)}/published-articles-count`, {}, { useCache: true, cacheDuration: 60_000, signal } as any);
            if (resp?.success && typeof resp?.count === 'number') {
              return { userId, count: resp.count as number };
            }
            return { userId, count: 0 };
          })
        );
        const updates: Record<string, number> = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            updates[r.value.userId] = r.value.count;
          }
        }
        if (Object.keys(updates).length > 0) {
          setArticlesCounts(prev => ({ ...prev, ...updates }));
        }
      } catch (_) {
        // ignore per-user count errors
      }
    };
    fetchCounts();
    return () => controller.abort();
  }, [activeTab, allUsers, articlesCounts]);

  // N+1: Fetch accepted reviews count per user for Reviews tab
  useEffect(() => {
    if (activeTab !== 'reviews') return;
    const controller = new AbortController();
    const { signal } = controller;
    const fetchCounts = async () => {
      try {
        const missing = allUsers
          .map(u => u.username)
          .filter((uname): uname is string => !!uname && !(uname in reviewsCounts));
        if (missing.length === 0) return;
        const results = await Promise.allSettled(
          missing.map(async (username) => {
            const resp = await api.get(`/api/reviews/by-author/${encodeURIComponent(username)}?limit=1`, {}, { useCache: true, cacheDuration: 60_000, signal } as any);
            if (resp?.success && resp?.pagination && typeof resp.pagination.total === 'number') {
              return { username, count: resp.pagination.total as number };
            }
            return { username, count: 0 };
          })
        );
        const updates: Record<string, number> = {};
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            updates[r.value.username] = r.value.count;
          }
        }
        if (Object.keys(updates).length > 0) {
          setReviewsCounts(prev => ({ ...prev, ...updates }));
        }
      } catch (_) {
        // ignore per-user count errors
      }
    };
    fetchCounts();
    return () => controller.abort();
  }, [activeTab, allUsers, reviewsCounts]);

  // Use backend pagination directly
  const filteredUsers = allUsers;
  // Remove calculation of totalPages from frontend, use backend value
  // const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  // const indexOfLastUser = currentPage * usersPerPage;
  // const indexOfFirstUser = indexOfLastUser - usersPerPage;
  // const currentUsers = filteredUsers
  //   .sort((a, b) => {
  //     if (activeTab === 'writers') {
  //       return (b.articles?.length || 0) - (a.articles?.length || 0);
  //     } else if (activeTab === 'designers') {
  //       return (b.designsCount || 0) - (a.designsCount || 0);
  //     }
  //     return 0;
  //   })
  //   .slice(indexOfFirstUser, indexOfLastUser);
  const currentUsers = React.useMemo(() => {
    if (activeTab === 'publishes') {
      // Sort desc by articles count (N+1 cache first, fallback to server articlesCount)
      return [...filteredUsers].sort((a, b) => {
        const aCount = (articlesCounts[a._id] ?? a.articlesCount ?? 0);
        const bCount = (articlesCounts[b._id] ?? b.articlesCount ?? 0);
        if (bCount !== aCount) return bCount - aCount;
        // Tie-breaker: newer user first
        return 0;
      });
    }
    if (activeTab === 'reviews') {
      // Sort desc by reviews count (N+1 cache first, fallback to server reviewsCount)
      return [...filteredUsers].sort((a, b) => {
        const aU = a.username || '';
        const bU = b.username || '';
        const aCount = (reviewsCounts[aU] ?? a.reviewsCount ?? 0);
        const bCount = (reviewsCounts[bU] ?? b.reviewsCount ?? 0);
        if (bCount !== aCount) return bCount - aCount;
        return 0;
      });
    }
    return filteredUsers;
  }, [filteredUsers, activeTab, articlesCounts, reviewsCounts]);
    
  // Update handlePageChange to use setCurrentPage
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Removed unused isTruthy helper

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear search function
  const clearSearch = () => {
    setSearchTerm('');
    // Focus the search input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Get the correct title and count for the active tab
  const getActiveTabInfo = () => {
    switch (activeTab) {
      case 'publishes':
        return {
          title: 'بلاوکردنەوەکان',
          count: totalCount, // <-- Use totalCount here
          icon: <PencilSquareIcon className="h-6 w-6 text-blue-600" />
        };
      case 'supervisors':
        return {
          title: 'سەرپەرشتیارەکان',
          count: totalCount, // <-- Use totalCount here
          icon: <AdjustmentsHorizontalIcon className="h-6 w-6 text-green-600" />
        };
      case 'designers':
        return {
          title: 'دیزاینەرەکان',
          count: totalCount, // <-- Use totalCount here
          icon: <PaintBrushIcon className="h-6 w-6 text-purple-600" />
        };
      case 'reviews':
        return {
          title: 'هەڵسەنگاندنەکان',
          count: totalCount,
          icon: <ChatBubbleLeftRightIcon className="h-6 w-6 text-amber-600" />
        };
      case 'ktebNus':
        return {
          title: 'کتێب نوس',
          count: totalCount,
          icon: <BookOpenIcon className="h-6 w-6 text-rose-600" />
        };
      default:
        return {
          title: 'ستافی پلاتفۆرم',
          count: totalCount, // <-- Use totalCount here
          icon: <PencilSquareIcon className="h-6 w-6 text-blue-600" />
        };
    }
  };

  const { title, count, icon } = getActiveTabInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 px-4 mx-auto">
            <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent inline-block py-1">
              ستافی پلاتفۆرم
            </span>
          </h1>
          <p className="text-[var(--grey-dark)] text-lg max-w-2xl mx-auto">
             پڕۆفایلی ستافی بنووسە لە نووسەرانی بڵاوکراوەکان، هەڵسەنگاندن و نووسەرانی  کتێب، سەرپەرشتیار و دیزاینەران
          </p>
        </div>
            
        {/* Tab Navigation */}
        <div className="flex justify-center mb-10 px-4">
          <div className="flex flex-wrap items-stretch justify-center gap-1 rounded-md shadow-sm bg-white/20 backdrop-blur-md p-1 w-full max-w-4xl sm:w-auto mx-auto">
            <button
              onClick={() => {
                setActiveTab('publishes');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-3 sm:px-6 py-3 text-sm font-medium rounded-md flex flex-col sm:flex-row items-center justify-center ${
                activeTab === 'publishes'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              } flex-1 sm:flex-none mb-1 sm:mb-0 mx-1 sm:mx-1`}
            >
              <PencilSquareIcon className={`h-5 w-5 ${activeTab === 'publishes' ? 'text-blue-600' : 'text-gray-400'} mb-1 sm:mb-0 sm:mr-2`} />
              <span>بلاوکردنەوەکان</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('reviews');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-6 py-3 text-sm font-medium rounded-md flex flex-col sm:flex-row items-center justify-center ${
                activeTab === 'reviews'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-500 hover:text-gray-700'
              } flex-1 sm:flex-none mb-1 sm:mb-0 mx-1 sm:mx-1`}
            >
              <ChatBubbleLeftRightIcon className={`h-5 w-5 ${activeTab === 'reviews' ? 'text-amber-600' : 'text-gray-400'} mb-1 sm:mb-0 sm:mr-2`} />
              <span>هەڵسەنگاندنەکان</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ktebNus');
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-6 py-3 text-sm font-medium rounded-md flex flex-col sm:flex-row items-center justify-center ${
                activeTab === 'ktebNus'
                  ? 'bg-rose-100 text-rose-700'
                  : 'text-gray-500 hover:text-gray-700'
              } flex-1 sm:flex-none mb-1 sm:mb-0 mx-1 sm:mx-1`}
            >
              <BookOpenIcon className={`h-5 w-5 ${activeTab === 'ktebNus' ? 'text-rose-600' : 'text-gray-400'} mb-1 sm:mb-0 sm:mr-2`} />
              <span>کتێب نوس</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('supervisors');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-3 sm:px-6 py-3 text-sm font-medium rounded-md flex flex-col sm:flex-row items-center justify-center ${
                activeTab === 'supervisors'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              } flex-1 sm:flex-none mb-1 sm:mb-0 mx-1 sm:mx-1`}
            >
              <AdjustmentsHorizontalIcon className={`h-5 w-5 ${activeTab === 'supervisors' ? 'text-green-600' : 'text-gray-400'} mb-1 sm:mb-0 sm:mr-2`} />
              <span>سەرپەرشتیارەکان</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('designers');
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
              className={`px-3 sm:px-6 py-3 text-sm font-medium rounded-md flex flex-col sm:flex-row items-center justify-center ${
                activeTab === 'designers'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              } flex-1 sm:flex-none mb-1 sm:mb-0 mx-1 sm:mx-1`}
            >
              <PaintBrushIcon className={`h-5 w-5 ${activeTab === 'designers' ? 'text-purple-600' : 'text-gray-400'} mb-1 sm:mb-0 sm:mr-2`} />
              <span>دیزاینەرەکان</span>
            </button>
          </div>
        </div>
            
        {/* Section Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center bg-white/30 backdrop-blur-md px-6 py-3 rounded-full shadow-sm">
            {icon}
            <h2 className="text-2xl font-bold mx-3">{title}</h2>
            <div className="bg-[var(--primary)]/10 px-3 py-1 rounded-full text-[var(--primary)] font-semibold">
              {count}
            </div>
          </div>
            </div>
            
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
              <div className="relative group">
                <input
                  type="text"
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={handleSearchChange}
              placeholder={`گەڕان بەدوای ${title}...`}
              className="w-full px-6 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md focus:outline-none focus:border-[var(--primary)]/50 text-lg"
                  style={{ direction: 'rtl' }}
              aria-label="Search staff"
                  onKeyDown={(e) => {
                    // Clear on Escape key
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      clearSearch();
                    }
                  }}
                />
                  <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]"
              onClick={() => setSearchTerm(searchInputRef.current?.value || '')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
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
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--grey)] text-lg">هیچ ستافێک نەدۆزرایەوە</p>
          </div>
        ) : (
          <>
            {/* Pagination summary */}
            <div className="text-center mb-6 text-gray-600">
              <p>
                نیشاندانی {currentPage * usersPerPage - usersPerPage + 1} - {Math.min(currentPage * usersPerPage, totalCount)} لە کۆی {totalCount} {
                  activeTab === 'publishes' ? 'بلاوکردنەوە' :
                  activeTab === 'supervisors' ? 'سەرپەرشتیار' :
                  activeTab === 'designers' ? 'دیزاینەر' :
                  activeTab === 'reviews' ? 'هەڵسەنگاندن' :
                  'کتێب نوس'
                }
              </p>
            </div>
            
            {/* Staff Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentUsers.map((staff) => (
                <WriterCardOptimized 
                  key={staff._id} 
                  writer={{
                    id: staff._id,
                    name: staff.name,
                    bio: staff.bio || "بەکارهێنەر لە پلاتفۆرمی بنووسە",
                    avatar: staff.profileImage || '',
                    articlesCount: activeTab === 'publishes' ? (articlesCounts[staff._id] ?? 0) : undefined,
                    followers: staff.followers?.length || 0,
                    username: staff.username,
                    role: activeTab === 'supervisors' ? 'supervisor' : 
                          activeTab === 'designers' ? 'designer' : 'writer',
                    designsCount: staff.designsCount || 0,
                    reviewsCount: activeTab === 'reviews' ? (staff.username ? reviewsCounts[staff.username] : 0) : undefined,
                    booksCount: activeTab === 'ktebNus' && staff.username ? booksCounts[staff.username] : undefined,
                    supervisorText: activeTab === 'supervisors' ? (staff.supervisorText || '') : undefined
                  }}
                />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="inline-flex rounded-md shadow-sm bg-white/30 backdrop-blur-md p-1">
                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center mr-1
                      ${currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-white/50'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    پێشوو
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // If near start, show first 5
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If near end, show last 5
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Otherwise show current and 2 on each side
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 text-sm font-medium rounded-md mx-0.5
                            ${currentPage === pageNum
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-gray-700 hover:bg-white/50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ml-1
                      ${currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-white/50'}`}
                  >
                    دواتر
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Join as Writer CTA */}
        <div className="mt-20 bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary-light)]/20 text-[var(--primary)] mb-6">
              <PencilSquareIcon className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4">ببە بە نووسەر</h2>
            <p className="text-[var(--grey-dark)] max-w-2xl mx-auto mb-6">
              زانیاری و پسپۆڕییەکانت بەشداری بکە لەگەڵ کۆمەڵگە گەشەسەندووەکەمان. ببە بە نووسەر لە پلاتفۆڕمی بنووسە و یارمەتیدەر بە
              لە بنیاتنانی گەورەترین کۆگای نووسینەکی زمانی کوردی.
            </p>
            <Link 
              href="/write-here-landing" 
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors hover:shadow-lg"
            >
              <span>داواکاری وەک نووسەر</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary-light)]/10 rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--primary-light)]/10 rounded-tr-full"></div>
        </div>
      </div>
    </div>
  );
} 