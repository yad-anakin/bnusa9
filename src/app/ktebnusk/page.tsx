"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function Ktebnusk() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ktebakan");
        if (!res.ok) throw new Error("Failed to fetch books");
        const data = await res.json();
        setBooks(data.books || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-[var(--primary)]">کتێبنوسک</h1>
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-center text-red-500">{error}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {books.map((book) => (
          <Link key={book._id} href={`/ktebnusk/${book.slug}`} className="group block">
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col items-center">
              <div className="w-[140px] h-[210px] relative">
                <Image
                  src={book.coverImage || "/placeholder-book.png"}
                  alt={book.title}
                  width={140}
                  height={210}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
              <div className="p-2 w-full text-center">
                <h3 className="text-sm font-semibold truncate mb-1">{book.title}</h3>
                <p className="text-xs text-gray-600 truncate">{book.writer}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
