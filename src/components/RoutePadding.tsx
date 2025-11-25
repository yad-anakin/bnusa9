'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function RoutePadding({ children }: Props) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  return (
    <main className={`flex-grow ${isHome ? '' : '[&>*:first-child]:pt-24'}`}>
      {children}
    </main>
  );
}
