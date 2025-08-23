  'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import NativeRichTextEditor from '@/components/NativeRichTextEditor';
import api from '@/utils/api';

// Decode HTML entities safely; run twice to handle double-escaped payloads
const decodeHtmlEntities = (str: string): string => {
  if (!str) return '';
  const ta = document.createElement('textarea');
  ta.innerHTML = str;
  const once = ta.value;
  ta.innerHTML = once;
  return ta.value;
};

// Normalize incoming content to proper HTML for the editor.
// Handles: JSON-escaped strings, unicode-escaped brackets, and HTML entities.
const normalizeIncomingHtml = (raw: string): string => {
  if (!raw) return '';
  let s = raw;
  try {
    // If the server double-serialized the HTML (e.g., "<p>..</p>"), try JSON.parse once
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = JSON.parse(s);
    }
  } catch {}
  // Replace common unicode escaped brackets used by JSON serializers
  s = s.replace(/\\u003c/gi, '<').replace(/\\u003e/gi, '>').replace(/\\u0026/gi, '&');
  // Decode HTML entities (double pass handles nested &amp;lt; cases)
  s = decodeHtmlEntities(s);
  return s;
};

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

export default function EditChapterPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const { currentUser } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapterData, setChapterData] = useState({
    title: '',
    content: ''
  });
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const lastAutoSaveAtRef = useRef<number>(0);

  useEffect(() => {
    if (currentUser && slug && id) {
      fetchChapterAndBook();
    }
  }, [currentUser, slug, id]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Only autosave when editing a draft chapter
      if (
        chapter?.isDraft &&
        isDirty &&
        (chapterData.title.trim() || chapterData.content.trim()) &&
        !autoSaving &&
        !saving
      ) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [chapterData, chapter, isDirty, autoSaving, saving]);

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

  const fetchChapterAndBook = async () => {
    try {
      // Fetch chapter details via centralized API
      const chapterData = await api.get(`/api/ktebnus/me/chapters/${id}`);
      setChapter(chapterData.chapter);
      // Ensure previously applied styles render by normalizing any escaped content
      const incomingContent = chapterData.chapter.content || '';
      const decodedContent = normalizeIncomingHtml(incomingContent);
      setChapterData({
        title: chapterData.chapter.title,
        content: decodedContent
      });

      // Fetch book details
      const bookData = await api.get(`/api/ktebnus/me/books/${slug}`);
      setBook(bookData.book);
    } catch (error) {
      console.error('هەڵە لە هێنانی بابەت:', error);
      toast.error('بارکردنی زانیاری بابەت شکستی هێنا');
      router.push(`/kteb-nus/my-books/${slug}`);
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
    setIsDirty(true);
  };

  const handleAutoSave = async () => {
    // Guard: autosave only for drafts
    if (!chapter?.isDraft) return;
    // Throttle: avoid saving too frequently (min 25s between autosaves)
    const now = Date.now();
    if (now - lastAutoSaveAtRef.current < 25000) return;
    if (!chapterData.title.trim() && !chapterData.content.trim()) return;
    if (!isDirty) return;
    if (autoSaving || saving) return;

    setAutoSaving(true);
    try {
      await api.put(`/api/ktebnus/me/chapters/${id}`, {
        title: chapterData.title,
        content: chapterData.content,
        isDraft: chapter.isDraft,
      });

      setLastSaved(new Date());
      lastAutoSaveAtRef.current = now;
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSave = async (isDraft: boolean = true) => {
    if (!chapterData.title.trim()) {
      toast.warning('تکایە ناونیشانی بابەت بنووسە');
      titleRef.current?.focus();
      return;
    }

    if (!chapterData.content.trim()) {
      toast.warning('تکایە ناوەڕۆکێک بنووسە بۆ بابەتەکە');
      contentRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/ktebnus/me/chapters/${id}`, {
        title: chapterData.title,
        content: chapterData.content,
        isDraft,
      });
      toast.success('بابەت بە سەرکەوتوویی نوێکرایەوە!');
      setLastSaved(new Date());
      
      // Redirect back to book dashboard
      router.push(`/kteb-nus/my-books/${slug}`);
    } catch (error: any) {
      console.error('هەڵە لە نوێکردنەوەی بابەت:', error);
      toast.error(error.message || 'نوێکردنەوەی بابەت شکستی هێنا');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Mirror write page behavior: save as draft on Ctrl/Cmd+S
      handleSave(true);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەسندکردن پێویستە</h1>
          <p className="text-gray-600">تکایە بچۆ ژوورەوە بۆ دەستکاریکردنی بابەتەکان.</p>
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

  if (!book || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">بابەت نەدۆزرایەوە</h1>
          <p className="text-gray-600">ئەو بابەتەی دەگەڕێیت بوونی نییە یان مۆڵەتت نییە بۆ دەستکاریکردنی.</p>
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
              <div className="text-sm text-blue-600 shrink-0">بابەت {chapter.order}</div>
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
            onChange={(content) => {
              setChapterData(prev => ({ ...prev, content }));
              setIsDirty(true);
            }}
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
