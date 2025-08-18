"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Helpers copied from edit page to properly render stored HTML
const decodeHtmlEntities = (str: string): string => {
  if (!str) return "";
  const ta = document.createElement("textarea");
  ta.innerHTML = str;
  const once = ta.value;
  ta.innerHTML = once;
  return ta.value;
};

const normalizeIncomingHtml = (raw: string): string => {
  if (!raw) return "";
  let s = raw;
  try {
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = JSON.parse(s);
    }
  } catch {}
  s = s.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">").replace(/\\u0026/gi, "&");
  s = decodeHtmlEntities(s);
  return s;
};

interface Chapter {
  _id: string;
  title: string;
  content: string;
  order: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ViewChapterPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<Chapter | null>(null);

  const getAuthToken = async () => {
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken();
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!currentUser || !id) return;
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }
        const res = await fetch(`/api/kteb-nus/chapters/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('هێنانی بابەت شکستی هێنا');
        const data = await res.json();
        const normalized = normalizeIncomingHtml(data.chapter?.content || "");
        setChapter({ ...data.chapter, content: normalized });
      } catch (e) {
        console.error('بارکردنی بابەت شکستی هێنا:', e);
        alert('بارکردنی بابەت شکستی هێنا');
        router.push(`/kteb-nus/my-books/${slug}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, id, slug]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">پەسندکردن پێویستە</h1>
          <p className="text-gray-600">تکایە بچۆ ژوورەوە بۆ بینینی بابەتەکان.</p>
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

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">بابەت نەدۆزرایەوە</h1>
          <p className="text-gray-600">ئەو بابەتەی دەگەڕێیت بوونی نییە یان مۆڵەتت نییە بۆ بینینی.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push(`/kteb-nus/my-books/${slug}`)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            گەرانەوە بۆ پەرتووک
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/kteb-nus/my-books/${slug}/chapters/${chapter._id}/edit`)}
              className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
            >
              دەستکاری بابەت
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{chapter.title}</h1>
        <article
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: chapter.content }}
        />
      </div>
    </div>
  );
}
