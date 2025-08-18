"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Book {
  _id: string;
  title: string;
  writer: string;
  genre: string;
  description: string;
  coverImage: string;
  slug: string;
}

interface Chapter {
  _id: string;
  title: string;
  order: number;
  isDraft: boolean;
}

export default function KtebnuskBookPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookAndChapters() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ktebakan/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch book");
        const data = await res.json();
        setBook(data.book);
        setChapters((data.chapters || []).filter((ch: Chapter) => !ch.isDraft).sort((a: Chapter, b: Chapter) => a.order - b.order));
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchBookAndChapters();
  }, [slug]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      {book && (
        <>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <div className="w-[140px] h-[210px] relative flex-shrink-0">
              <Image
                src={book.coverImage || "/placeholder-book.png"}
                alt={book.title}
                width={140}
                height={210}
                className="object-cover w-full h-full rounded-lg shadow"
                priority
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2 text-[var(--primary)]">{book.title}</h1>
              <div className="text-sm text-gray-700 mb-2">نووسەر: {book.writer}</div>
              <div className="text-xs text-gray-500 mb-4">ژانەر: {book.genre}</div>
              <p className="text-base text-gray-800 mb-4 whitespace-pre-line">{book.description}</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">بابەتەکان</h2>
            <ul className="space-y-3">
              {chapters.map((ch) => (
                <li key={ch._id} className="bg-white rounded shadow p-3 hover:bg-gray-50">
                  <a href={`#chapter-${ch._id}`} className="text-[var(--primary)] font-bold">
                    {ch.order}. {ch.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary)]">خوێندنەوەی بابەتەکان</h2>
            {chapters.map((ch) => (
              <ChapterContent key={ch._id} chapterId={ch._id} title={ch.title} order={ch.order} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChapterContent({ chapterId, title, order }: { chapterId: string; title: string; order: number }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChapter() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ktebakan/chapters/${chapterId}`);
        if (!res.ok) throw new Error("Failed to fetch chapter");
        const data = await res.json();
        setContent(data.chapter?.content || "");
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [chapterId]);

  return (
    <section id={`chapter-${chapterId}`} className="mb-10">
      <h3 className="text-lg font-bold mb-2 text-[var(--primary)]">{order}. {title}</h3>
      {loading && <div className="text-sm text-gray-400">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="prose max-w-full text-gray-900 whitespace-pre-line leading-relaxed bg-gray-50 rounded p-4">
        {content}
      </div>
    </section>
  );
}
