"use client";

import React, { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import PlatformStats from "@/components/PlatformStats";
import BnusaWriteOptions from "@/components/BnusaWriteOptions";
import CategorySection from "@/components/CategorySection";
import WhyChooseBnusa from "@/components/WhyChooseBnusa";
import JoinCTA from "@/components/JoinCTA";
import api from "@/utils/api";

export default function BnusaStatsPage() {
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchBooksCount = async () => {
      try {
        // Reuse existing endpoint to get total book count from pagination
        const data = await api.get("/api/books?limit=1&sort=newest");
        if (data?.success) {
          setTotalBooks(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching total books:", error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooksCount();
  }, []);

  return (
    <main className="min-h-screen" style={{ fontFamily: "'Rabar 021', sans-serif" }}>
      {/* Hero Section - same as homepage */}
      <HeroSection />

      {/* Platform Statistics and subsequent sections moved from homepage */}
      <PlatformStats bookCount={totalBooks} />
      <BnusaWriteOptions />
      <CategorySection />
      <WhyChooseBnusa />
      <JoinCTA />
    </main>
  );
}
