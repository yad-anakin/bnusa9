'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5">
      {/* moving gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(59,130,246,0.20), rgba(99,102,241,0.18), rgba(236,72,153,0.16))',
          backgroundSize: '400% 400%',
          animation: 'moveGradient 10s ease-in-out infinite'
        }}
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute top-24 left-10 w-80 h-80 rounded-full bg-indigo-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-pink-400/10 blur-3xl animate-pulse"></div>
        </div>
        <div className="container mx-auto px-6 py-24 md:py-28 min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="#3B82F6" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"><circle cx="34" cy="14" r="9"/><circle cx="12" cy="25" r="7"/><circle cx="29" cy="37" r="5"/></g></svg>      
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">دەربارەی بنووسە</h1>
            </div>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              بنووسە پلاتفۆرمێکی کوردییە کە تایبەتە بە بەشداریکردنی زانیاری و بابەتە هزرییەکان. ئامانجمان درووستکردنی شوێنێکە بۆ نووسەران تا وتار لەسەر زانست، مێژوو، هونەر، و بابەتی دیکە بە زمانی کوردی بڵاو بکەنەوە.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-24">
          {/* Vision and Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl border border-purple-100 bg-purple-50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M28.367 36H24l-9-4.96l-10.991 4.042l3.002 5.944l7.072-2.953Q24.008 44 26.165 44T44 36"/><path fill="#3B82F6" fillRule="evenodd" strokeLinejoin="round" d="M28.992 26.988v-4.67c1.1-.457 2.543-1.125 3.372-1.954a9 9 0 1 0-12.728 0c.829.829 2.264 1.497 3.364 1.953q.009.503 0 4.67z" clipRule="evenodd"/><path strokeLinecap="round" d="m12 21l1-1m27 1l-1-1M15 5l-1-1m23 1l1-1m3 8h-1m-28 0h-1"/></g></svg>
                <h2 className="text-2xl font-semibold text-gray-900">روانگەی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
                ئێمە داهاتوویەک دەبینین کە زمانی کوردی و زاراوەکانی بەپێی پێویست وەک نووسراو لە کۆگایەکی دەوڵەمەند و فراوان لە زانیاری کۆکراونەتەوە، کە بەشداری دەکات لە پاراستن و گەشەپێدانی کەلتوور و توانستی هزری کوردی بکات بەشێوەیەکی بەرچاو.
              </p>
            </div>
            <div className="p-8 rounded-2xl border border-pink-100 bg-pink-50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeWidth="4"><circle cx="37" cy="17" r="6" fill="#3B82F6"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 13s6-8 16-8s16 6 16 6"/><circle cx="11" cy="31" r="6" fill="#3B82F6" transform="rotate(-180 11 31)"/><path strokeLinecap="round" strokeLinejoin="round" d="M42 35s-6 8-16 8s-16-6-16-6"/></g></svg>
                <h2 className="text-2xl font-semibold text-gray-900">ئامانجی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
                ئامانجی ئێمە پێشخستنی ئەدەب و گوتاری هزری کوردییە لە رێگەی دابینکردنی پلاتفۆرمێک کە نووسەران بتوانن زانیارییەکانیان بەشداری پێبکەن و خوێنەران بتوانن دەستیان بە ناوەڕۆکی بابەتەکان بگات بە کوالێتی بەرز.
              </p>
            </div>
          </div>
          
          {/* Team */}
          <div>
            <div className="p-8 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"><path fill="#3B82F6" d="M19 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14"/><path d="M32.608 7A7 7 0 0 1 36 13a7 7 0 0 1-3.392 6"/><path fill="#3B82F6" d="M4 40.8V42h30v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496C27.92 28 25.68 28 21.2 28h-4.4c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C4 34.08 4 36.32 4 40.8"/><path d="M44 42v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496"/></g></svg>
                <h2 className="text-2xl font-semibold text-gray-900">تیمی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
                بنووسە لەلایەن تیمێکی دیاریکراو لە نووسەران، ئیدیتەران و پەرەپێدەران بەڕێوە دەبرێت بەشێوەیەکی خۆبەخشانە و قازانج نەویستانە کە ئارەزوومەندی کەلتوور و ئەدەبی کوردین. ئێمە پابەندین بە درووستکردنی پلاتفۆرمێک کە خزمەتی کۆمەڵگەی کوردی بکات، زمانی کوردی و زاراوەکانی وەک زمانی فێربوون زانیاری و بنرخێنێ.
              </p>
            </div>
          </div>

          {/* Become a Writer */}
          <div>
            <div className="p-8 rounded-2xl border border-blue-100 bg-blue-50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none"><path fill="#3B82F6" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14M4 40.8V42h30v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496C27.92 28 25.68 28 21.2 28h-4.4c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C4 34.08 4 36.32 4 40.8"/><path fill="#3B82F6" fillRule="evenodd" d="M38 13v12zm-6 6h12z" clipRule="evenodd"/><path stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M38 13v12m-6-6h12"/></g></svg>
                <h2 className="text-2xl font-semibold text-gray-900">ببە بە نووسەر</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right space-y-2">
                <p className="mb-4">دەتەوێت بیرۆکە، چیرۆک یان وتارەکانت لە بنووسە بڵاو بکەیتەوە؟</p>
                <p className="mb-6">ئەمە ڕێگەکەیە:</p>
                
                <ol className="space-y-3 mb-6 list-none">
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">١</span>
                    <span>تۆماربکە یان بچۆ ژوورەوە بۆ هەژمارەکەت لە بنووسە</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٢</span>
                    <span>داشبۆردەکەت بکەرەوە و دەست بکە بە نووسینی وتارەکەت</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٣</span>
                    <span>وێنە، ڤیدیۆی یوتیوب و لینک زیادبکە ئەگەر دەتەوێت</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٤</span>
                    <span>وتارەکەت بنێرە بۆ پێداچوونەوە</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٥</span>
                    <span>کاتێک پەسندکرا، لە پڕۆفایلەکەت و لە پەڕەی سەرەکی دەردەکەوێت</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٦</span>
                    <span>باجی نووسەر وەردەگریت دوای بڵاوکردنەوەی یەکەم وتارت</span>
                  </li>
                </ol>
                
                <div className="flex justify-end mt-6">
                  <Link href="/write-here" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-[2px]">
                    <span>دەست بکە بە نووسین</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path fill="#FFFFFF" d="M22 43c-4.726-1.767-8.667-7.815-10.64-11.357c-.852-1.53-.403-3.408.964-4.502a3.83 3.83 0 0 1 5.1.283L19 29V17.5a2.5 2.5 0 0 1 5 0v6a2.5 2.5 0 0 1 5 0v2a2.5 2.5 0 0 1 5 0v2a2.5 2.5 0 0 1 5 0v7.868c0 1.07-.265 2.128-.882 3.003C37.095 39.82 35.256 42.034 33 43c-3.5 1.5-6.63 1.634-11 0"/><path d="M29 12a8 8 0 1 0-15.748 2m0 0q.133.515.33 1z"/></g></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit a PDF Book */}
          <div>
            <div className="p-8 rounded-2xl border border-green-100 bg-green-50/60 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineCap="round" strokeLineJoin="round" strokeWidth="4"><path strokeLineCap="round" d="M25 9H11a3 3 0 0 0-3 3v21h32v-9"/><path fill="#3B82F6" d="M4 33h40v2a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z"/><path strokeLineCap="round" d="M37 19V7m-5 5l5-5l5 5"/></g></svg>                <h2 className="text-2xl font-semibold text-gray-900">ناردنی کتێبی پی دی ئێف</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right">
                <p className="mb-6">کتێبی کوردیت هەیە (پی دی ئێف) کە دەتەوێت لەگەڵ خەڵک بەشداری پێ بکەیت؟</p>
                <p className="mb-4 font-semibold text-gray-800">لە ڕێگەی تێلێگرامەوە بینێرە: <Link href="https://t.me/bnusa_net" target="_blank" className="text-blue-600 hover:text-blue-800 hover:underline">bnusa_net</Link></p>
                <p className="mb-3 text-gray-800">تکایە ئەمانەش بنێرە:</p>
                <ul className="space-y-3 mb-6 list-none">
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-semibold">1</span>
                    <span>ناوی کتێب</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-semibold">2</span>
                    <span>ناوی نووسەری ڕەسەن (ئەگەر هەیە)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-semibold">3</span>
                    <span>ژانر یان پۆلێن</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-semibold">4</span>
                    <span>کورتەیەکی کتێب</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-base font-semibold">5</span>
                    <span>وێنەی بەرگ (ئارەزوومەندانەیە)</span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg flex items-start gap-3 bg-green-100/70 text-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineCap="round" strokeLineJoin="round" strokeWidth="4"><path fill="#3B82F6" d="M12 36v8h32V12h-8v8h-8v8h-8v8z"/><path d="m18 13l9-9m-6 0h6v6M10 27H4v-6m9-3l-9 9"/></g></svg>
                  <p className="text-base">دوای پێداچوونەوە، کتێبەکە بۆ کتێبخانەی بنووسە زیاد دەکرێت</p>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Link href="/bookstore" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-[2px]">
                    <span>کتێبخانەی بنووسە ببینە</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><defs><mask id="SVGwYmErewy"><g fill="none" strokeLineJoin="round" strokeWidth="4"><rect width="36" height="36" x="6" y="6" fill="#fff" stroke="#fff" rx="3"/><path fill="#000" stroke="#000" d="M13 13h8v8h-8zm0 14h8v8h-8z"/><path stroke="#000" strokeLineCap="round" d="M27 28h8m-8 7h8m-8-22h8m-8 7h8"/></g></mask></defs><path fill="currentColor" d="M0 0h48v48H0z" mask="url(#SVGwYmErewy)"/></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Be a Designer */}
          <div>
            <div className="p-8 rounded-2xl border border-purple-100 bg-purple-50">
              <div className="flex items-center gap-3 mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineJoin="round" strokeWidth="4"><path d="M11.273 4H4v7.273h7.273zM44 36.727h-7.273V44H44zM11.273 24H4v7.273h7.273zM24 36.727h-7.273V44H24zM31.273 4H24v7.273h7.273zM44 16.727h-7.273V24H44z"/><path strokeLineCap="round" d="M11.273 7.636H24m0 32.728h12.727M11.273 27.637h16.364V11.273m1.191 9.09h7.899M20.363 36.727v-9.099zM7.637 11.273V24m32.726 0v12.727"/></g></svg>
                <h2 className="text-2xl font-semibold text-gray-900">ببە بە دیزاینەر لە بنووسە</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right">
                <p className="mb-4">داهێنانی خۆت بەکاربهێنە بۆ پشتگیریکردنی دەنگی کوردی لە ڕێگەی دیزاینەوە.</p>
                <p className="mb-6">ئێمە بەدوای دیزاینەری بەهرەمەند و خۆشەویستدا دەگەڕێین بۆ بەشداریکردن لە تیمی خۆبەخشمان و یارمەتیدان لە دیزاینکردنی ناوەڕۆک بۆ سۆشیال میدیای بنووسە.</p>
                <p className="mb-4 font-semibold text-gray-800">چۆن کار دەکات:</p>
                <ol className="space-y-3 mb-6 list-none">
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">١</span>
                    <span>پەیام بنێرە بۆ ئینستاگرامی ئێمە: <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="text-purple-600 hover:text-purple-800 hover:underline">@bnusa_net</Link></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٢</span>
                    <span>ئێمە تاقیکردنەوەیەکی بچووکی دیزاینت بۆ دەنێرین (وەک نموونەی پۆست، بانەر، یان بیرۆکەی پرۆمۆ).</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٣</span>
                    <span>ئەگەر سەرکەوتوو بوویت، زیاد دەکرێیت بۆ گرووپی دیزاینەرانمان لە تێلێگرام یان ئینستاگرام.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٤</span>
                    <span>تۆ دەبیتە بەشێک لە تیمی داهێنەرانەی هەفتانەمان، یارمەتی دروستکردنی ناوەڕۆک دەدەیت کە پشتگیری نووسەران، کتێب، وتار و کۆمەڵگەی کوردی دەکات.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٥</span>
                    <span>ئەو دیزاینەرانەی کە بە چالاکی بەشداری دەکەن باجی دیزاینەر وەردەگرن، کە لە پڕۆفایلەکەیاندا پیشان دەدرێت.</span>
                  </li>
                </ol>
                
                <div className="flex justify-end mt-6">
                  <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-[2px]">
                    <span>پەیوەندیمان پێوە بکە</span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#FFFFFF" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M20 29H6v14h14zm4-25l10 17H14zm12 40a8 8 0 1 0 0-16a8 8 0 0 0 0 16"/></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Badges */}
          <div>
            <div className="p-8 rounded-2xl border border-rose-100 bg-rose-50/60 transition-all duration-300 hover:-translate-y-1">
              <h2 className="text-2xl font-semibold mb-8 text-center text-gray-900">باجەکان و واتاکانیان</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-blue-100 bg-blue-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineCap="round" strokeLineJoin="round" strokeWidth="4"><path fill="#3B82F6" fillRule="evenodd" d="M2 20c0 12.15 6 22 18 22s18-9.85 18-22z" clipRule="evenodd"/><path d="M20 14V6m10 8v-4m-20 4v-4m26.19 20.623c.99-2.584 1.574-5.486 1.752-8.572Q38.46 22 39 22c3.866 0 7 2.015 7 4.5S42.866 31 39 31c-1 0-1.95-.135-2.81-.377"/></g></svg>                    <h3 className="font-semibold text-lg text-gray-900">نووسەر</h3>
                  </div>
                  <p className="text-gray-700">لانیکەم یەک وتارت بڵاوکردۆتەوە</p>
                </div>
                
                <div className="p-6 rounded-xl border border-green-100 bg-green-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeWidth="4"><path fill="#3B82F6" strokeLineJoin="round" d="m19 8l14 26H5z"/><path strokeLineCap="round" strokeLineJoin="round" d="m29 26l5-6l9 14H32m-22 7h28"/><circle cx="38" cy="10" r="3" fill="#3B82F6"/></g></svg>                    <h3 className="font-semibold text-lg text-gray-900">سەرپەرشتیار</h3>
                  </div>
                  <p className="text-gray-700">یارمەتی بەڕێوەبردنی ناوەڕۆک دەدەیت (وتار یان کتێب)</p>
                </div>
                
                <div className="p-6 rounded-xl border border-purple-100 bg-purple-50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineCap="round" strokeLineJoin="round" strokeWidth="4"><path d="M24 24V12m0 12l-10.5 6.062zm0 0l10.5 6.062z"/><path fill="#3B82F6" d="M14 16a4 4 0 1 1-8 0a4 4 0 0 1 8 0m0 16a4 4 0 1 1-8 0a4 4 0 0 1 8 0m14 8a4 4 0 1 1-8 0a4 4 0 0 1 8 0m14-8a4 4 0 1 1-8 0a4 4 0 0 1 8 0m0-16a4 4 0 1 1-8 0a4 4 0 0 1 8 0M28 8a4 4 0 1 1-8 0a4 4 0 0 1 8 0"/></g></svg>
                    <h3 className="font-semibold text-lg text-gray-900">دیزاینەر</h3>
                  </div>
                  <p className="text-gray-700">یارمەتی دیزاینی بنووسە دەدەیت، لەسەر سۆشیال میدیاکانمان پیشان دەدرێن</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Join Community */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl border border-teal-100 bg-teal-50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineCap="round" strokeLineJoin="round" strokeWidth="4"><circle cx="24" cy="12" r="8" fill="#3B82F6"/><path d="M42 44c0-9.941-8.059-18-18-18S6 34.059 6 44"/><path d="m30 36l-8 8l-4-4"/></g></svg>
                  <h2 className="text-xl font-semibold text-gray-900">بەشداربە لە کۆمەڵگەی بنووسە</h2>
                </div>
                
                <p className="text-gray-700 mb-4 text-right">
                  پەیوەندی بکە بە نووسەرانی کورد، داهێنەران و خوێنەرانەوە
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 transition-all duration-300">
                  <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#3B82F6" d="M19.777 4.43a1.5 1.5 0 0 1 2.062 1.626l-2.268 13.757c-.22 1.327-1.676 2.088-2.893 1.427c-1.018-.553-2.53-1.405-3.89-2.294c-.68-.445-2.763-1.87-2.507-2.884c.22-.867 3.72-4.125 5.72-6.062c.785-.761.427-1.2-.5-.5c-2.302 1.738-5.998 4.381-7.22 5.125c-1.078.656-1.64.768-2.312.656c-1.226-.204-2.363-.52-3.291-.905c-1.254-.52-1.193-2.244-.001-2.746z"/></g></svg>
                    <p className="font-semibold text-gray-800">بەشداربە لە گرووپی تێلێگرام:</p>
                  </div>
                  <Link href="https://t.me/bnusa_net" target="_blank" className="mt-3 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200">
                    <span>کلیک لێرە بکە بۆ بەشداربوون</span>
                  </Link>
                </div>
                
                <p className="text-gray-700 text-right">
                  ئاپدەیت، ئامۆژگاری نووسین، پشتگیری کۆمەڵگە و دەستگەیشتنی پێش وەختە بە تایبەتمەندییەکان وەربگرە
                </p>
              </div>
              
              <div className="p-8 rounded-2xl border border-indigo-100 bg-indigo-50 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLineJoin="round" strokeWidth="4"><path fill="#3B82F6" d="M19 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14Z"/><path strokeLineCap="round" d="M37 30v10m4-6l-4-4l-4 4m-6-6h-8.2c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C6 34.08 6 36.32 6 40.8V42h21"/></g></svg>
                  <h2 className="text-xl font-semibold text-gray-900">بنووسە تازە دەستی پێکردووە</h2>
                </div>
                
                <p className="text-gray-700 mb-4 text-right">
                  ئەمە زیاترە لە وێبسایتێک — پلاتفۆرمێکی داهێنەرانەی کوردییە کە گەشە دەکات
                </p>
                
                <p className="text-gray-700 mb-6 text-right">
                  تایبەتمەندی نوێ، کێبڕکێی نووسین و هاوکاری بەڕێوەن. بەشێک بە لە سەرەتاوە
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 transition-all duration-300">
                  <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>
                    <p className="font-semibold text-gray-800">فۆلۆمان بکە لە ئینستاگرام:</p>
                  </div>
                  <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="mt-3 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-all duration-200">
                    <span>ئینستاگرامی بنووسە</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 