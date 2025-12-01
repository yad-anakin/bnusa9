"use client";

import React, { useEffect, useState } from "react";
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
    <main
      className="min-h-screen relative bg-gradient-to-br from-[var(--primary)]/10 via-white to-[var(--primary)]/5"
      style={{ fontFamily: "'Rabar 021', sans-serif" }}
    >
      {/* moving gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(59,130,246,0.20), rgba(99,102,241,0.18), rgba(236,72,153,0.16))",
          backgroundSize: "400% 400%",
          animation: "moveGradient 10s ease-in-out infinite",
        }}
      />

      {/* Platform Statistics and subsequent sections moved from homepage */}
      <PlatformStats bookCount={totalBooks} />
      <BnusaWriteOptions />
      <CategorySection />
      <WhyChooseBnusa />
      <JoinCTA />
    </main>
  );
}
