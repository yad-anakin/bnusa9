'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NativeRichTextEditor from '@/components/NativeRichTextEditor';

interface Book {
  _id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  coverImage: string;
  slug: string;
  isDraft: boolean;
  isPendingReview: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WriteChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { currentUser } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterData, setChapterData] = useState({
    title: '',
    content: ''
  });
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (currentUser && slug) {
      fetchBookAndChapters();
    }
  }, [currentUser, slug]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (chapterData.title.trim() || chapterData.content.trim()) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [chapterData]);

  // Update word count
  useEffect(() => {
    const words = chapterData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [chapterData.content]);

  const getAuthToken = async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const fetchBookAndChapters = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/kteb-nus/books/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('هێنانی پەرتووک شکستی هێنا');
      }

      const data = await response.json();
      setBook(data.book);
      setChapters(data.chapters || []);
    } catch (error) {
      console.error('هەڵە لە هێنانی پەرتووک:', error);
      alert('بارکردنی زانیاری پەرتووک شکستی هێنا');
      router.push('/kteb-nus/drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAutoSave = async () => {
    if (!chapterData.title.trim() && !chapterData.content.trim()) return;
    
    setAutoSaving(true);
    try {
      // Auto-save logic would go here
      // For now, just simulate the save
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async (isDraft: boolean = true) => {
    if (!chapterData.title.trim()) {
      alert('تکایە ناونیشانی بابەت بنووسە');
      titleRef.current?.focus();
      return;
    }

    if (!chapterData.content.trim()) {
      alert('تکایە ناوەڕۆکێک بنووسە بۆ بابەتەکە');
      contentRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('پەسندکردن پێویستە');
      }

      const response = await fetch(`/api/kteb-nus/books/${slug}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: chapterData.title,
          content: chapterData.content,
          order: chapters.length + 1,
          isDraft
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'پاشەکەوتکردنی بابەت شکستی هێنا');
      }

      const data = await response.json();
      alert('بابەت بە سەرکەوتوویی پاشەکەوت کرا!');
      setLastSaved(new Date());
      
      // Redirect back to book dashboard
      router.push(`/kteb-nus/my-books/${slug}`);
    } catch (error: any) {
      console.error('هەڵە لە پاشەکەوتکردنی بابەت:', error);
      alert(error.message || 'پاشەکەوتکردنی بابەت شکستی هێنا');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەسندکردن پێویستە</h1>
          <p className="text-gray-600">تکایە بچۆ ژوورەوە بۆ نووسینی بابەت.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەرتووک نەدۆزرایەوە</h1>
          <p className="text-gray-600">ئەو پەرتووەی دەگەڕێیت بوونی نییە یان مۆڵەتت نییە بۆ دەستکاریکردنی.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" onKeyDown={handleKeyDown}>
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Back to book, Chapter number, Word count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push(`/kteb-nus/my-books/${slug}`)}
                className="flex items-center text-gray-600 hover:text-gray-800 min-w-0"
                title={book.title}
              >
                <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="max-w-[45vw] md:max-w-[50vw] lg:max-w-[60vw] truncate">
                  <span className="text-gray-600">گەرانەوە بۆ </span>
                  <span className="text-blue-600">{book.title}</span>
                </span>
              </button>
              <div className="text-sm text-blue-600 shrink-0">بابەت {chapters.length + 1}</div>
            </div>
            <div className="text-sm text-green-600">{wordCount} وشە</div>
          </div>

          {/* Row 2: Save/Publish and Auto-save status */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              پاشەکەوتکردن وەک ڕەشنووس
            </button>
            
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              بڵاوکردنەوەی بابەت
            </button>

            {autoSaving && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                پاشەکەوت دەکرێت...
              </div>
            )}

            {lastSaved && !autoSaving && (
              <div className="text-sm text-green-600">پاشەکەوت کرا لە {lastSaved.toLocaleTimeString()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Writing Area */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Chapter Title */}
        <div className="mb-8">
          <input
            ref={titleRef}
            type="text"
            name="title"
            value={chapterData.title}
            onChange={handleInputChange}
            placeholder="ناونیشانی بابەت"
            className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent resize-none"
            style={{ fontFamily: 'Georgia, serif' }}
          />
        </div>

        {/* Chapter Content */}
        <div className="mb-8">
          <NativeRichTextEditor
            value={chapterData.content}
            onChange={(content) => setChapterData(prev => ({ ...prev, content }))}
            placeholder="دەست بکە بە نووسینی بابەتەکەت..."
            height={600}
          />
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
