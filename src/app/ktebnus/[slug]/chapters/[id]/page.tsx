"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";
import DOMPurify from "dompurify";

// Helpers to normalize HTML like in editor
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
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = JSON.parse(s);
    }
  } catch {}
  s = s.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">").replace(/\\u0026/gi, "&");
  s = decodeHtmlEntities(s);
  return s;
};

interface ChapterPublic {
  _id: string;
  title: string;
  content: string;
  order: number;
  book: { _id: string; slug: string; title: string };
}

export default function PublicChapterPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState<ChapterPublic | null>(null);
  const [nextChapter, setNextChapter] = useState<{ _id: string; title: string } | null>(null);
  const [prevChapter, setPrevChapter] = useState<{ _id: string; title: string } | null>(null);
  const [chapterNumber, setChapterNumber] = useState<number | null>(null);

  // Transition state
  const incomingDir = (searchParams?.get("dir") as "next" | "prev" | null) || null;
  const [readyToShow, setReadyToShow] = useState(false); // triggers slide-in
  const [exitDir, setExitDir] = useState<null | "next" | "prev">(null); // triggers slide-out
  const [navLock, setNavLock] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Compute transform and shadow for book-like flip
  const transitionMs = 520;
  const easing = "cubic-bezier(0.22, 0.61, 0.36, 1)"; // ease-out back-like
  const pageTransform = useMemo(() => {
    if (exitDir === "next") {
      return "translateX(-100%) rotateY(10deg)";
    }
    if (exitDir === "prev") {
      return "translateX(100%) rotateY(-10deg)";
    }
    if (!readyToShow) {
      if (incomingDir === "next") return "translateX(100%) rotateY(-8deg)";
      if (incomingDir === "prev") return "translateX(-100%) rotateY(8deg)";
    }
    return "translateX(0) rotateY(0deg)";
  }, [exitDir, readyToShow, incomingDir]);

  const rightShadowOpacity = useMemo(() => {
    if (exitDir === "next") return 0.28; // getting darker on right edge when flipping next
    if (!readyToShow && incomingDir === "prev") return 0.22;
    return 0.06;
  }, [exitDir, readyToShow, incomingDir]);

  const leftShadowOpacity = useMemo(() => {
    if (exitDir === "prev") return 0.28; // darker on left edge when flipping prev
    if (!readyToShow && incomingDir === "next") return 0.22;
    return 0.06;
  }, [exitDir, readyToShow, incomingDir]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch current chapter from backend API
        const data = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(id)}`, {}, { useCache: false });
        if (!data.success || !data.chapter) throw new Error('Chapter not found');
        const normalized = {
          ...data.chapter,
          content: normalizeIncomingHtml(data.chapter.content || '')
        } as ChapterPublic;
        setChapter(normalized);

        // Fetch chapter list to compute next
        try {
          const listData = await api.get(`/api/ktebnus/books/${encodeURIComponent(slug)}/chapters`, {}, { useCache: false });
          if (listData.success) {
            if (Array.isArray(listData.chapters)) {
              const chapters: Array<{ _id: string; title: string; order?: number }> = listData.chapters;
              // Prefer order; if missing, fall back to index order
              let sorted = [...chapters];
              sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const currentOrder = normalized.order ?? 0;
              // Determine current chapter number (1-based)
              let idxById = sorted.findIndex((c) => c._id === normalized._id);
              if (idxById >= 0) setChapterNumber(idxById + 1);
              else {
                // Fallback by order positioning
                const pos = sorted.findIndex((c) => (c.order ?? 0) >= currentOrder);
                setChapterNumber(pos >= 0 ? pos + 1 : null);
              }
              // Compute prev/next by index primarily
              const idx = sorted.findIndex((c) => c._id === normalized._id);
              let next = null as null | { _id: string; title: string };
              let prev = null as null | { _id: string; title: string };
              if (idx >= 0) {
                if (idx + 1 < sorted.length) next = { _id: sorted[idx + 1]._id, title: sorted[idx + 1].title };
                if (idx - 1 >= 0) prev = { _id: sorted[idx - 1]._id, title: sorted[idx - 1].title };
              } else {
                // Fallback using order comparison if id not found
                const nextByOrder = sorted.find((c) => (c.order ?? 0) > currentOrder);
                if (nextByOrder) next = { _id: nextByOrder._id, title: nextByOrder.title };
                const reversed = [...sorted].reverse();
                const prevByOrder = reversed.find((c) => (c.order ?? 0) < currentOrder);
                if (prevByOrder) prev = { _id: prevByOrder._id, title: prevByOrder.title };
              }
              setNextChapter(next);
              setPrevChapter(prev);
            } else {
              setNextChapter(null);
              setPrevChapter(null);
              setChapterNumber(null);
            }
          } else {
            setNextChapter(null);
            setChapterNumber(null);
          }
        } catch {
          setNextChapter(null);
          setChapterNumber(null);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load chapter');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [slug, id]);

  // After chapter loads, trigger slide-in based on incoming dir
  useEffect(() => {
    if (!loading && chapter) {
      // small timeout to let initial DOM mount with offset class
      const t = setTimeout(() => setReadyToShow(true), 20);
      return () => clearTimeout(t);
    }
  }, [loading, chapter]);

  const handleNavigate = useCallback(
    (targetId: string, dir: "next" | "prev") => {
      if (!targetId || navLock) return;
      setNavLock(true);
      setExitDir(dir);
      // Wait for slide-out, then push with dir param so next page can slide-in
      setTimeout(() => {
        router.push(
          `/ktebnus/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(targetId)}?dir=${dir}`
        );
      }, 320);
    },
    [router, slug, navLock]
  );

  // Keyboard navigation (Left/Right arrows)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (navLock) return;
      if (e.key === "ArrowRight" && nextChapter) {
        e.preventDefault();
        handleNavigate(nextChapter._id, "next");
      } else if (e.key === "ArrowLeft" && prevChapter) {
        e.preventDefault();
        handleNavigate(prevChapter._id, "prev");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNavigate, nextChapter, prevChapter, navLock]);

  // Swipe navigation (horizontal)
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    touchStartX.current = null;
    touchStartY.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (navLock) return;
    const t = e.touches[0];
    if (touchStartX.current == null || touchStartY.current == null) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && nextChapter) {
        // swipe left -> next
        handleNavigate(nextChapter._id, "next");
      } else if (dx > 0 && prevChapter) {
        // swipe right -> prev
        handleNavigate(prevChapter._id, "prev");
      }
    }
  }, [handleNavigate, nextChapter, prevChapter, navLock]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">بەش نەدۆزرایەوە</h1>
          <p className="text-gray-600 mb-4">{error || 'ببورە، بەشەکە بەردەست نییە.'}</p>
          <button
            onClick={() => router.push(`/ktebnus/${encodeURIComponent(slug)}`)}
            className="px-4 py-2 rounded-md bg-[var(--primary)] text-white"
          >
            گەڕانەوە بۆ کتێب
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center gap-2 text-[var(--grey-dark)]">
          <Link
            href={`/ktebnus/${encodeURIComponent(slug)}`}
            className="font-semibold hover:text-[var(--primary)] truncate max-w-[60vw]"
            title={chapter?.book?.title || ''}
          >
            {chapter?.book?.title || ''}
          </Link>
          {chapterNumber !== null && (
            <span className="text-[var(--grey)]">•</span>
          )}
          {chapterNumber !== null && (
            <span className="font-medium">بەشی {chapterNumber}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-0 py-0">
        <div className="relative overflow-hidden w-full"
             onTouchStart={onTouchStart}
             onTouchEnd={onTouchEnd}
             onTouchMove={onTouchMove}
        >
          {/* Book-like paper background */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              backgroundColor: '#FEFEFD',
              backgroundImage: [
                // More saturated horizontal lines
                'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 27px, rgba(30,58,138,0.10) 27px, rgba(30,58,138,0.10) 28px)',
                // Subtle center gutter
                'linear-gradient(to right, rgba(0,0,0,0) 49%, rgba(0,0,0,0.02) 50%, rgba(0,0,0,0) 51%)',
                // Page edge shading (left and right)
                'linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0) 10%)',
                'linear-gradient(to left, rgba(0,0,0,0.02), rgba(0,0,0,0) 10%)'
              ].join(', ')
            }}
          />

          {/* Foreground content (centered, constrained) with 3D page flip */}
          <div
            className="relative max-w-3xl mx-auto px-6 sm:px-10 py-8"
            style={{ perspective: '1200px' }}
          >
            {/* the "page" */}
            <div
              className="relative bg-transparent"
              style={{
                transform: pageTransform,
                transformOrigin:
                  exitDir === 'next' || incomingDir === 'prev' ? 'left center' : 'right center',
                transition: `transform ${transitionMs}ms ${easing}`,
                boxShadow: 'none',
                borderRadius: '6px',
              }}
            >
              <div className="px-0 sm:px-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">{chapter.title}</h1>
                <article
                  className="prose prose-lg max-w-none chapter-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chapter.content) }}
                />
                <style jsx global>{`
                  .chapter-content h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin: 1.25rem 0 0.75rem; }
                  .chapter-content h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin: 1rem 0 0.5rem; }
                  .chapter-content h3 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
                  .chapter-content h4 { font-size: 1.125rem; line-height: 1.75rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
                  .chapter-content p { margin: 0.5rem 0; }
                  .chapter-content ul { list-style: disc; padding-inline-start: 1.25rem; margin: 0.5rem 0; }
                  .chapter-content ol { list-style: decimal; padding-inline-start: 1.25rem; margin: 0.5rem 0; }
                  .chapter-content blockquote { border-inline-start: 4px solid #e5e7eb; padding-inline-start: 1rem; color: #374151; margin: 0.75rem 0; }
                  .chapter-content a { color: var(--primary); text-decoration: underline; }
                `}</style>
              </div>
            </div>
          </div>

        </div>

        {/* Footer navigation */}
        {nextChapter ? (
          <div className="mt-10 mb-16 flex justify-center gap-3">
            <button
              onClick={() => handleNavigate(nextChapter._id, "next")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-white hover:opacity-90"
              title={nextChapter.title}
              disabled={navLock}
            >
              بەشی داهاتوو
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            {prevChapter && (
              <button
                onClick={() => handleNavigate(prevChapter._id, "prev")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/5"
                title={prevChapter.title}
                disabled={navLock}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                بەشی پێشوو
              </button>
            )}
          </div>
        ) : (
          <div className="mt-10 mb-16 flex justify-center gap-3">
            {prevChapter && (
              <button
                onClick={() => handleNavigate(prevChapter._id, "prev")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/5"
                title={prevChapter.title}
                disabled={navLock}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                بەشی پێشوو
              </button>
            )}
            <button
              onClick={() => router.push(`/ktebnus/${encodeURIComponent(slug)}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-[var(--grey-dark)] hover:bg-gray-200"
            >
              گەڕانەوە بۆ کتێب
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
