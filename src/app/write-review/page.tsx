"use client";

import React, { useState, useRef, useEffect } from "react";
import { getCurrentUserProfile, UserProfile } from '@/utils/userApi';
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import slugify from 'slugify';
import { FiFileText, FiType, FiStar, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/solid';

const GENRES = ["فیلم", "زنجیرە", "کتێب"];

export default function WriteReviewPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
const [fullUser, setFullUser] = useState<UserProfile | null>(null);

useEffect(() => {
  const fetchProfile = async () => {
    if (currentUser) {
      try {
        // Optionally: pass token if needed, here omitted for simplicity
        const user = await getCurrentUserProfile("");
        setFullUser(user);
      } catch (e) {
        setFullUser(null); // fallback if error
      }
    }
  };
  fetchProfile();
}, [currentUser]);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [rating, setRating] = useState(0.1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [recommended, setRecommended] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // YouTube links state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([]);
  const [youtubeError, setYoutubeError] = useState("");
  
  // Resource links state
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceType, setResourceType] = useState("auto");
  const [resourceLinks, setResourceLinks] = useState<Array<{url: string; title: string; type: string;}>>([]);
  const [resourceError, setResourceError] = useState("");

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await api.uploadImage(file, 'reviews');
      setCoverImage(result.imageUrl);
    } catch (err: any) {
      setError("کێشەیەک لە بارکردنی وێنەی سەرەکی هەبوو");
    } finally {
      setIsUploading(false);
    }
  };

  // Function to extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Function to validate YouTube URL
  const validateYoutubeUrl = (url: string): boolean => {
    // Check if URL contains youtube domain
    const isYoutubeUrl = url.includes('youtube.com') || url.includes('youtu.be');
    // Check if we can extract a valid video ID
    const videoId = extractYoutubeId(url);
    return isYoutubeUrl && videoId !== null;
  };

  // Function to handle adding YouTube links
  const handleAddYoutubeLink = () => {
    // Trim the input
    const trimmedInput = youtubeUrl.trim();
    
    // Check if input is empty
    if (!trimmedInput) {
      setYoutubeError('تکایە بەستەری یوتیوب دابنێ');
      return;
    }
    
    // Validate YouTube URL
    if (!validateYoutubeUrl(trimmedInput)) {
      setYoutubeError('ئەمە بەستەرێکی دروستی یوتیوب نییە');
      return;
    }
    
    // Check if already added (to prevent duplicates)
    if (youtubeLinks.includes(trimmedInput)) {
      setYoutubeError('ئەم بەستەرە پێشتر زیادکراوە');
      return;
    }
    
    // Limit the number of links
    if (youtubeLinks.length >= 3) {
      setYoutubeError('ناتوانیت زیاتر لە 3 بەستەری یوتیوب زیاد بکەیت');
      return;
    }
    
    // Create a new array to avoid reference issues
    const updatedLinks = [...youtubeLinks, trimmedInput];
    
    // Update state
    setYoutubeLinks(updatedLinks);
    
    // Clear input and error
    setYoutubeUrl('');
    setYoutubeError('');
  };

  // Function to remove a YouTube link
  const handleRemoveYoutubeLink = (index: number) => {
    const newLinks = [...youtubeLinks];
    newLinks.splice(index, 1);
    setYoutubeLinks(newLinks);
  };
  
  // Function to validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Function to detect resource type from URL
  const detectResourceType = (url: string): string => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith('.pdf')) return 'pdf';
    if (lowercaseUrl.endsWith('.doc') || lowercaseUrl.endsWith('.docx')) return 'doc';
    if (lowercaseUrl.endsWith('.ppt') || lowercaseUrl.endsWith('.pptx')) return 'presentation';
    if (lowercaseUrl.endsWith('.xls') || lowercaseUrl.endsWith('.xlsx')) return 'spreadsheet';
    if (lowercaseUrl.includes('drive.google.com')) return 'googledoc';
    return 'web';
  };

  // Function to handle adding resource links
  const handleAddResourceLink = () => {
    // Trim inputs
    const trimmedUrl = resourceUrl.trim();
    const trimmedTitle = resourceTitle.trim();
    
    // Validate URL
    if (!trimmedUrl) {
      setResourceError('تکایە بەستەری سەرچاوە دابنێ');
      return;
    }
    
    if (!isValidUrl(trimmedUrl)) {
      setResourceError('ئەمە بەستەرێکی دروست نییە');
      return;
    }
    
    // Validate title
    if (!trimmedTitle) {
      setResourceError('تکایە ناونیشانی سەرچاوە دابنێ');
      return;
    }
    
    // Check for duplicates
    if (resourceLinks.some(link => link.url === trimmedUrl)) {
      setResourceError('ئەم بەستەرە پێشتر زیادکراوە');
      return;
    }

    // Limit the number of links to 5
    if (resourceLinks.length >= 5) {
      setResourceError('ناتوانیت زیاتر لە 5 سەرچاوە زیاد بکەیت');
      return;
    }
    
    // Auto-detect type if not specified
    const type = resourceType === 'auto' ? detectResourceType(trimmedUrl) : resourceType;
    
    // Create a new resource link object
    const newResource = {
      url: trimmedUrl,
      title: trimmedTitle,
      type
    };
    
    // Create a new array to avoid reference issues
    const updatedLinks = [...resourceLinks, newResource];
    
    // Update state
    setResourceLinks(updatedLinks);
    
    // Clear inputs and error
    setResourceUrl('');
    setResourceTitle('');
    setResourceError('');
  };

  // Function to remove a resource link
  const handleRemoveResourceLink = (index: number) => {
    const newLinks = [...resourceLinks];
    newLinks.splice(index, 1);
    setResourceLinks(newLinks);
  };

  // Function to get icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
          </svg>
        );
      case 'doc':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 5v14l8 3 8-3V5l-8-3zm0 2.8L17 7v10l-5 1.9L7 17V7l5-2.2z" />
          </svg>
        );
      case 'presentation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22a10 10 0 110-20 10 10 0 010 20zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
          </svg>
        );
      case 'googledoc':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 2H8C5.79 2 4 3.79 4 6v12c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V6c0-2.21-1.79-4-4-4zm-8 18c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H8zm3-10h4c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1zm0 3h2c.55 0 1 .45 1 1s-.45 1-1 1h-2c-.55 0-1-.45-1-1s.45-1 1-1z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
          </svg>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title || !description || !content || !coverImage || !genre || !year) {
      setError("تکایە هەموو خانەکان پڕبکەوە");
      return;
    }
    const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const wordCount = plainText ? plainText.split(' ').length : 0;
    if (wordCount < 50) {
      setError("ناوەڕۆک پێویستە لانی کەم ٥٠ وشە بێت");
      return;
    }
    if (rating <= 0 || rating >= 10) {
      setError("خاڵ پێویستە لە نێوان ١ و ١٠ بێت");
      return;
    }
    if (!currentUser) {
      setError("پێویستە چوونە ژوورەوە بکەیت");
      return;
    }
    try {
      // Assign a temporary slug
      const tempSlug = slugify(title + '-' + Date.now(), { lower: true, strict: true });
      const res = await api.post("/api/reviews", {
        title,
        description,
        content,
        coverImage,
        genre,
        rating: Number(rating),
        year: Number(year),
        recommended,
        youtubeLinks: youtubeLinks,
        resourceLinks: resourceLinks,
        // Author info should come from backend session profile only
        author: fullUser ? fullUser : { name: "User", profileImage: "" },
        slug: tempSlug
      });
      // Only show success after the API confirms
      setShowSuccessModal(true);
      setTimeout(() => router.push("/reviews"), 2000); // Always redirect after 2s
    } catch (err: any) {
      // Revert success modal on error
      setShowSuccessModal(false);
      // Surface rate limit message (429) from backend in Kurdish
      if ((err && err.code === 'RATE_LIMIT') || err?.status === 429) {
        let msg = 'دەتوانیت تەنها ١ هەڵسەنگاندن بنێریت لەماوەی ١٥ خولەک جارێکدا...';
        try {
          // Backend usually returns JSON with { success, message }
          const parsed = JSON.parse(err.messageDetail || '{}');
          if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
            msg = parsed.message;
          }
        } catch (_) {
          // Fallback: if messageDetail is plain text, use it when reasonable
          if (typeof err.messageDetail === 'string' && err.messageDetail.length < 400) {
            msg = err.messageDetail;
          }
        }
        setError(msg);
      } else {
        setError('کێشەیەک هەبوو');
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl bg-white rounded-3xl p-8 mt-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
  <span className="text-black">هەڵسەنگاندێک </span>
  <span className="text-[var(--primary)]">بنووسە</span>
</h1>
<p className="text-[var(--grey-dark)] text-center max-w-2xl mx-auto mb-6">هەڵسەنگاندێک بنووسە لەسەر فیلم، زنجیرە و کتێب، ڕای خۆت دەرببڕە لەسەری و شیکردنەوەیەکی دیاریکراوی بۆ بکە.</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">{error}</div>}
        
        {showSuccessModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-md mx-auto relative animate-success-appear">
      <div className="text-center mb-6">
        <div className="rounded-full bg-green-100 p-3 mx-auto w-24 h-24 flex items-center justify-center mb-4">
          <svg className="w-16 h-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">هەڵسەنگاندنەکەت بە سەرکەوتوویی نێردرا!</h2>
        <p className="text-gray-600 mb-4">
          سوپاس بۆ ناردنی هەڵسەنگاندنەکەت. هەڵسەنگاندنەکەت ئێستا لە دۆخی <strong>چاوەڕوانی پێداچوونەوە</strong>دایە و پێویستی بە پەسەندکردنی بەڕێوبەر هەیە پێش بڵاوکردنەوە.
        </p>
        <p className="text-gray-600 mb-4">
          دۆخی هەڵسەنگاندنەکەت دەتوانیت لە پرۆفایلەکەتدا ببینیت. ئێمە هەوڵ دەدەین زوو بە زوو پێداچوونەوەی بۆ بکەین.
        </p>
      </div>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => { setShowSuccessModal(false); router.push('/'); }}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          بگەڕێوە بۆ سەرەتا
        </button>
        <button 
          onClick={() => { setShowSuccessModal(false); router.push('/profile'); }}
          className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
        >
          پرۆفایلەکەم ببینە
        </button>
      </div>
    </div>
  </div>
)}
<div className="bg-gradient-to-r from-[var(--primary-light)]/10 to-[var(--secondary-light)]/5 rounded-lg p-6 mb-8">
  <h2 className="text-xl font-bold mb-3 text-[var(--primary)]">ڕێساکانی ناردنی هەڵسەنگاندن</h2>
  <ul className="space-y-2 text-[var(--grey-dark)]">
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>وێنەی سەرەکی:</strong> پێویستە پەیوەندیدار بێت بە ئەو شتەی کە هەڵسەنگاندنی بۆ دەکەیت (فیلم، کتێب، یان زنجیرە).</span>
    </li>
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>سەردێڕ:</strong> پێویستە ناونیشانی فیلم، کتێب یان زنجیرەکە بێت.</span>
    </li>
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>ساڵ:</strong> پێویستە ساڵی بڵاوکردنەوەی فیلم، کتێب یان زنجیرەکە بێت.</span>
    </li>
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>ناوەڕۆک:</strong> ناوەڕۆکی هەڵسەنگاندن پێویستە لانی کەم ٥٠ وشە بێت.</span>
    </li>
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>خاڵ:</strong> پێویستە لە نێوان ١ و ١٠ بێت.</span>
    </li>
    <li className="flex items-start">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary)] ml-2 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span><strong>پێشنیارکراو/نەکراو:</strong> ئەم هەڵبژاردەیە دەستنیشان دەکەیت ئەگەر پێت وایە ئەو فیلمە، کتێبە یان زنجیرەیە شایەنی ئەوە ببینرێت و بخوێندرێتەوە یان نا.</span>
    </li>
  </ul>
</div>
<form onSubmit={handleSubmit} className="space-y-8" aria-disabled={showSuccessModal}>
          {/* Cover image at the top */}
          <div className="flex flex-col items-center gap-3">
            <label className="block text-lg font-semibold mb-1 text-gray-700">وێنەی سەرەکی</label>
            <div className="relative group w-full flex flex-col items-center">
              <div className="w-full aspect-[2/3] max-w-xs mx-auto">
                {coverImage ? (
                  <img src={coverImage} alt="cover" className="rounded-2xl object-cover w-full h-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 group-hover:border-primary transition">
                    <span className="text-gray-400">+ وێنە زیاد بکە</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleCoverImageUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative">
              <FiType className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full bg-slate-100 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-lg font-semibold placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary border-none transition"
                placeholder="سەردێڕی هەڵسەنگاندن..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="relative">
                <FiFileText className="absolute top-6 left-4 -translate-y-1/2 text-gray-400" />
                <textarea
                  className="w-full bg-slate-100 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-base placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary border-none transition"
                  placeholder="کورتەیەک لەسەر هەڵسەنگاندن..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={2}
                />
            </div>


            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-700">ناوەڕۆک</span>
                <span className={`text-xs ${content.replace(/<[^>]*>/g, '').length < 50 ? 'text-red-500' : 'text-green-600'}`}>{content.replace(/<[^>]*>/g, '').length}/50</span>
              </div>
              <div className="bg-slate-100 focus-within:bg-white rounded-xl py-3 px-4 min-h-[120px] outline-none focus-within:ring-2 focus-within:ring-primary border-none transition" style={{cursor:'text'}}>
                <div
                  ref={editorRef}
                  contentEditable
                  className="outline-none min-h-[90px] text-base relative empty:before:content-[attr(data-placeholder)] empty:before:absolute empty:before:inset-0 empty:before:text-gray-400 empty:before:pointer-events-none"
                  onInput={e => setContent((e.target as HTMLDivElement).innerHTML)}
                  suppressContentEditableWarning
                  data-placeholder="ناوەڕۆکی هەڵسەنگاندن..."
                  style={{whiteSpace:'pre-wrap'}}
                ></div>
              </div>
              {content.replace(/<[^>]*>/g, '').length < 50 && (
                <div className="text-xs text-red-500 mt-1">ناوەڕۆک پێویستە لانی کەم ٥٠ پیت بێت</div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-start">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-semibold mb-1 text-gray-700">خاڵ</label>
                <div className="relative">
                  <FiStar className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min={0.1}
                    max={9.9}
                    step={0.1}
                    className="w-full bg-yellow-100 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-base placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary border-none transition"
                    placeholder="خاڵ (١-١٠)"
                    value={rating}
                    onChange={e => setRating(Number(e.target.value))}
                    required
                  />
                </div>
                {(rating <= 0 || rating >= 10) && (
                  <div className="text-xs text-red-500 mt-1">خاڵ پێویستە لە نێوان ٠ و ١٠ بێت</div>
                )}
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-semibold mb-1 text-gray-700">ساڵ</label>
                <div className="relative">
                  <FiCalendar className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    className="w-full bg-slate-100 focus:bg-white rounded-xl py-3 pl-12 pr-4 text-base placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary border-none transition"
                    placeholder="ساڵ"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-6 mt-2">
              {GENRES.map(g => (
                <button
                  type="button"
                  key={g}
                  className={`px-4 py-2 rounded-xl font-semibold border-none transition text-base ${genre === g ? 'bg-primary text-white' : 'bg-slate-100 text-gray-700 hover:bg-primary hover:text-white'}`}
                  onClick={() => setGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className={`flex items-center justify-between flex-1 min-w-[120px] rounded-xl px-4 py-3 mt-4 transition-colors ${recommended ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`font-semibold transition-colors ${recommended ? 'text-green-800' : 'text-red-800'}`}>
                  {recommended ? 'پێشنیارکراوە' : 'پێشنیار نەکراوە'}
                </span>
                <label htmlFor="recommended-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="recommended-toggle" 
                    className="sr-only peer" 
                    checked={recommended} 
                    onChange={() => setRecommended(!recommended)} 
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-focus dark:peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
          </div>

          {/* YouTube Videos Section */}
          <div className="mt-8">
            <label className="block text-[var(--grey-dark)] mb-2 font-semibold">ڤیدیۆکانی یوتیوب ({youtubeLinks.length}/3)</label>
            <p className="text-sm text-[var(--grey-dark)] mb-3">دەتوانیت هەتا ٣ ڤیدیۆی یوتیوب زیاد بکەیت کە پەیوەندیدارن بە هەڵسەنگاندنەکەت.</p>
            
            {/* Enhanced YouTube URL input section */}
            <div className="bg-gray-50 border rounded-md p-4 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-[var(--grey-dark)] mb-1">بەستەری ڤیدیۆ</label>
                  <input 
                    type="text" 
                    value={youtubeUrl}
                    onChange={(e) => {
                      // Sanitize URL input and only allow valid characters
                      const inputValue = e.target.value;
                      // Use a regex to ensure only valid URL characters are allowed
                      if (/^[a-zA-Z0-9\-_./:?&=@%+]*$/.test(inputValue)) {
                        setYoutubeUrl(inputValue);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddYoutubeLink()}
                    className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={youtubeLinks.length >= 3 || isUploading}
                  />
                </div>
                
                <div className="flex items-end">
                  <button 
                    type="button" 
                    onClick={handleAddYoutubeLink}
                    disabled={!youtubeUrl || isUploading || youtubeLinks.length >= 3}
                    className="btn bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white w-full py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    زیادکردنی ڤیدیۆ
                  </button>
                </div>
              </div>
              
              {/* Error message */}
              {youtubeError && (
                <p className="text-red-500 text-sm mb-2">{youtubeError}</p>
              )}
            </div>
            
            {/* List of added YouTube videos with preview */}
            <div className="space-y-4 mt-4">
              {youtubeLinks.map((link, index) => {
                const videoId = extractYoutubeId(link);
                return (
                  <div key={index} className="relative bg-gray-50 border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-[var(--grey-dark)] truncate pr-8">{link}</h4>
                      <button 
                        type="button"
                        onClick={() => handleRemoveYoutubeLink(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        title="سڕینەوە"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Video preview */}
                    {videoId && (
                      <div className="rounded-md overflow-hidden border border-gray-200 bg-black shadow-sm">
                        <div className="aspect-w-16 aspect-h-9">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                            loading="lazy"
                          ></iframe>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                            </svg>
                            <span>YouTube</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {youtubeLinks.length === 0 && (
                <div className="py-8 text-center border border-dashed rounded-md bg-gray-50">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                  </div>
                  <p className="text-[var(--grey-dark)]">هیچ ڤیدیۆیەک زیاد نەکراوە</p>
                  <p className="text-sm text-gray-400">بەستەری ڤیدیۆی یوتیوب زیاد بکە بۆ پشتگیریکردنی هەڵسەنگاندنەکەت</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Resource Links Section */}
          <div className="mt-8">
            <label className="block text-[var(--grey-dark)] mb-2 font-semibold">سەرچاوەکان و بەڵگەنامەکان ({resourceLinks.length}/5)</label>
            <p className="text-sm text-[var(--grey-dark)] mb-3">دەتوانیت بەستەری PDF، بەڵگەنامە یان سەرچاوەی دیکە زیاد بکەیت بۆ پشتیوانی زیاتری هەڵسەنگاندنەکەت.</p>
            
            {/* Form for adding resource links */}
            <div className="bg-gray-50 border rounded-md p-4 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-[var(--grey-dark)] mb-1">بەستەری سەرچاوە</label>
                  <input 
                    type="text" 
                    value={resourceUrl}
                    onChange={(e) => {
                      // Sanitize URL input and only allow valid characters
                      const inputValue = e.target.value;
                      // Use a regex to ensure only valid URL characters are allowed
                      if (/^[a-zA-Z0-9\-_./:?&=@%+]*$/.test(inputValue)) {
                        setResourceUrl(inputValue);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                    placeholder="https://example.com/document.pdf"
                    disabled={resourceLinks.length >= 5 || isUploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-[var(--grey-dark)] mb-1">ناونیشان</label>
                  <input 
                    type="text" 
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                    placeholder="پوختەی توێژینەوە"
                    disabled={resourceLinks.length >= 5 || isUploading}
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-3">
                <div className="md:w-1/3">
                  <label className="block text-sm text-[var(--grey-dark)] mb-1">جۆری سەرچاوە</label>
                  <select
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:border-[var(--primary)] focus:outline-none font-rabar"
                    disabled={resourceLinks.length >= 5 || isUploading}
                  >
                    <option value="auto">دۆزینەوەی خۆکار</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">بەڵگەنامە</option>
                    <option value="presentation">پێشکەشکردن</option>
                    <option value="spreadsheet">خشتەی داتا</option>
                    <option value="googledoc">گووگڵ دۆکیومێنت</option>
                    <option value="web">ماڵپەڕ</option>
                  </select>
                </div>
                
                <div className="flex">
                  <button
                    type="button"
                    onClick={handleAddResourceLink}
                    disabled={resourceLinks.length >= 5 || isUploading}
                    className={`px-4 py-2 rounded-md font-rabar ${
                      resourceLinks.length >= 5 || isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                    }`}
                  >
                    زیادکردنی سەرچاوە
                  </button>
                </div>
              </div>
              
              {/* Error message */}
              {resourceError && (
                <div className="text-red-500 text-sm mt-2">{resourceError}</div>
              )}
            </div>
            
            {/* List of added resource links */}
            <div className="space-y-2">
              {resourceLinks.map((resource, index) => (
                <div key={index} className="flex items-center justify-between bg-white border rounded-md p-3 hover:bg-gray-50 transition">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-[var(--grey-dark)]">{resource.title}</h4>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate block max-w-md">
                        {resource.url}
                      </a>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveResourceLink(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="سڕینەوە"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {resourceLinks.length === 0 && (
                <div className="text-center border border-dashed rounded-md p-6 bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[var(--grey-dark)]">هیچ سەرچاوەیەک زیاد نەکراوە</p>
                  <p className="text-sm text-gray-400">بەستەری PDF و سەرچاوەکانی دیکە زیاد بکە بۆ پشتگیریکردنی هەڵسەنگاندنەکەت</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-[var(--primary)] text-white rounded font-bold hover:bg-[var(--primary-dark)] transition" disabled={isUploading}>ناردن</button>
        </form>
      </div>
    </div>
  );
} 