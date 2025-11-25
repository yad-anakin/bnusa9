"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRightOnRectangleIcon, UserPlusIcon } from "@heroicons/react/24/outline";

export default function MyBooksPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      // Redirect authenticated users to their drafts (or a future My Books dashboard)
      router.replace("/kteb-nus/drafts");
    }
  }, [currentUser, router]);

  if (currentUser) {
    // Temporary placeholder during redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center text-gray-600">بەرنامە پاشەکەوت دەکرێت...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-30 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-semibold py-1 px-3 rounded-full bg-blue-50 text-blue-600 mb-3">چوونە ژوورەوە</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-blue-600">کتێبەکانم</h1>
          <p className="text-lg mb-8 text-gray-600 max-w-xl mx-auto">
            بۆ نووسین و ناردنی وتار، هەڵسەنگاندن، کتێب و بینینی تەواوی کتێبەکانت، پێویستە سەرەتا چوونە ژوورەوە بکەیت یان هەژمارێک درووست بکەیت. <span className="text-blue-600">بنووسە پلاتفۆرمی نووسەرانی کوردە</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-200 w-auto min-w-[120px] justify-center"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            چوونە ژوورەوە
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 text-blue-700 font-semibold hover:bg-blue-200 transition-colors duration-200 w-auto min-w-[120px] justify-center"
          >
            <UserPlusIcon className="h-5 w-5" />
            خۆت تۆمار بکە
          </Link>
        </div>
      </div>
    </div>
  );
}
