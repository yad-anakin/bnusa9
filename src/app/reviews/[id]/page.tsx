"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import NotFound from "@/components/NotFound";
import CommentSection from "@/components/CommentSection";
import api from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/context/ToastContext";
import sanitizeHtml from "@/utils/sanitizeHtml";

interface Review {
  _id: string;
  id?: number; // Add indexed id field
  title: string;
  description: string;
  content?: string;
  coverImage: string;
  categories: string[];
  rating: number;
  year: number;
  recommended: boolean;
  youtubeLinks?: string[];
  resourceLinks?: Array<{url: string; title: string; type: string}>;
  author: {
    _id: string;
    name: string;
    profileImage?: string;
    username?: string;
  };
}

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Simple helper to safely derive a username for profile link
const getUsername = (author: Review["author"]): string | null => {
  return author.username && author.username.trim() !== "" ? author.username : null;
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const fetchLikeData = async (reviewId: string) => {
    try {
      // Get like count
      const countResponse = await api.get(`/api/review-likes/${reviewId}/count`);
      if (countResponse.success) {
        setLikeCount(countResponse.count);
      }

      // Check if user has liked (only if user is authenticated)
      if (currentUser) {
        const likeStatusResponse = await api.get(`/api/review-likes/${reviewId}/check`);
        if (likeStatusResponse.success) {
          setHasLiked(likeStatusResponse.hasLiked);
        }
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
    }
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

  useEffect(() => {
    const fetchReview = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/api/reviews/${params.id}`);
        if (data.success && data.review) {
          setReview(data.review);
          // Fetch like data after review is loaded
          fetchLikeData(data.review._id);
        } else {
          throw new Error(data.error || "Failed to fetch review");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchReview();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
              <p className="mt-4 text-[var(--grey-dark)]">چاوەڕوانی بارکردنی هەڵسەنگاندنەکە بکە...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLikeToggle = async () => {
    if (!currentUser) {
      // Redirect to signin or show login modal
      showToast('info', 'پێویستە چوونە ژوورەوە بکەیت بۆ پسندکردنی هەڵسەنگاندنەکان');
      router.push('/signin');
      return;
    }

    if (!review || isLiking) return;

    setIsLiking(true);
    try {
      const action = hasLiked ? 'unlike' : 'like';
      const response = await api.post(`/api/review-likes/${review._id}/toggle`, { action });
      
      if (response.success) {
        setLikeCount(response.likes);
        setHasLiked(response.hasLiked);
        
        // Show success toast
        const message = hasLiked ? 'هەڵسەنگاندنەکە لە پسندکردنەکانت لابردرا' : 'هەڵسەنگاندنەکە بە سەرکەوتوویی پسندکرا';
        showToast('success', message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('error', 'کێشەیەک هەبوو لە پسندکردنی هەڵسەنگاندنەکە. تکایە دووبارە هەوڵ بدەرەوە.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!review) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: review.title,
          text: review.description,
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
    if (!review) return;
    
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(review.title);
    const text = encodeURIComponent(review.description);
    
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
            alert('لینک کۆپی کرا بۆ کلیپبۆرد');
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

  if (error || !review) {
    return <NotFound message="ببورە، هەڵسەنگاندنەکە نەدۆزرایەوە." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            گەڕانەوە
          </button>
        </div>
        
        {/* Cover Image */}
        <div className="w-full flex justify-center items-center mb-6">
          <div className="relative w-full max-w-sm md:max-w-md aspect-[4/5] rounded-lg overflow-hidden">
            <Image
              src={review.coverImage}
              alt={review.title}
              fill
              sizes="(max-width: 1200px) 100vw, 800px"
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
        
        {/* Title, Description, Genres, Rating */}
        <div className="mb-4 px-2 md:px-0">
          <h1 
            className="text-2xl md:text-4xl font-bold text-[var(--foreground)] mb-4"
            title={review.title}
          >
            {review.title}
          </h1>
          <p 
            className="text-[var(--grey-dark)] text-sm md:text-base mb-6"
            title={review.description}
          >
            {review.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {(review.categories || []).map((category, index) => (
              <span
                key={index}
                className="inline-block text-[var(--primary)] text-xs px-3 py-1 rounded-lg font-medium border border-[color:rgba(0,80,200,0.10)]"
                title={category}
              >
                {truncateText(category, 20)}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-6">
            <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118l-3.385-2.46c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
              </svg>
              {review.rating.toFixed(1)}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{review.year}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${review.recommended ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {review.recommended ? "پێشنیارکراوە" : "پێشنیار ناکرێت"}
            </span>
          </div>
        </div>
        
        {/* Author (clickable) */}
        {getUsername(review.author) ? (
  <Link
    href={`/users/${getUsername(review.author)}`}
    className="flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity"
    prefetch={false}
  >
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
      {review.author.profileImage ? (
        <img src={review.author.profileImage} alt={review.author.name} className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
          {review.author.name.substring(0, 1)}
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <span
        className="text-gray-700 text-base font-medium truncate max-w-[200px]"
        title={review.author.name}
      >
        {truncateText(review.author.name, 25)}
      </span>
      <span className="text-xs text-[var(--grey)] truncate max-w-[200px]">@{getUsername(review.author)}</span>
    </div>
  </Link>
) : (
  <div className="flex items-center gap-3 mb-8">
    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
      {review.author.profileImage ? (
        <img src={review.author.profileImage} alt={review.author.name} className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-bold">
          {review.author.name.substring(0, 1)}
        </span>
      )}
    </div>
    <div className="flex flex-col">
      <span
        className="text-gray-700 text-base font-medium truncate max-w-[200px]"
        title={review.author.name}
      >
        {truncateText(review.author.name, 25)}
      </span>
    </div>
  </div>
)}
        
        {/* Content */}
        {review.content && (
          <div className="article-content w-full p-6 mb-8">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(review.content) }} />
          </div>
        )}

        {/* YouTube Videos Section */}
        {review.youtubeLinks && review.youtubeLinks.length > 0 && (
          <div className="mt-12 pt-10 relative">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-4 text-gray-800 bg-white py-2 px-4 rounded-full">
                  <span className="bg-gradient-to-r from-red-600 to-red-500 text-white p-2 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1H2V6zM14 6H2v8a2 2 0 002 2h12a2 2 0 002-2V6h-2z" />
                    </svg>
                  </span>
                  <span>ڤیدیۆکانی یوتیوب</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {review.youtubeLinks.map((link, index) => {
                  const videoId = link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|&v=))([^#&?]*)/)?.[1];
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
                              className="group-action relative inline-flex items-center justify-center p-2 sm:p-3 text-red-600 hover:text-white transition-all duration-300 rounded-full overflow-hidden"
                              title="کردنەوە لە یوتیوب"
                            >
                              <span className="absolute inset-0 bg-red-100 opacity-0 group-action-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                              
                              <span className="absolute inset-0 bg-red-600 opacity-0 group-action-hover:opacity-90 scale-0 group-action-hover:scale-100 transition-all duration-300 rounded-full"></span>
                              
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 ml-2" viewBox="0 0 20 20" fill="currentColor">
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
        
        {/* Resource Links Section */}
        {review.resourceLinks && review.resourceLinks.length > 0 && (
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
                {review.resourceLinks.map((resource, index) => (
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
                              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'spreadsheet' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                            </svg>
                          ) : resource.type === 'googledoc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                              <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 003 3h8a3 3 0 003-3V7a3 3 0 00-3-3H8zm0 2a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H8z" clipRule="evenodd" />
                              <path d="M4 9a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zM4 12a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zM5 6a1 1 0 100 2h1a1 1 0 100-2H5z" />
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

        {/* Like and Share Section */}
        <div className="flex items-center justify-between mt-8 px-2 md:px-0">
          <div className="flex items-center space-x-4">
            {/* Like Button */}
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

        {/* Comment Section - restored at the end of the review */}
        <div className="mt-10">
          <CommentSection articleId={review._id} articleOwnerId={review.author._id} isReview={true} />
        </div>
      </div>
    </div>
  );
} 