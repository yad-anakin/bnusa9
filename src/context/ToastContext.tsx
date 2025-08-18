'use client';

// Compatibility shim for legacy imports from '@/context/ToastContext'.
// We re-export the provider from '@/contexts/ToastContext' and adapt the hook
// to expose `showToast(type, message)` so existing code keeps working.

import React from 'react';
import { ToastProvider as BaseToastProvider, useToast as useToastNew } from '@/contexts/ToastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BaseToastProvider>{children}</BaseToastProvider>
);

// Minimal adapter that provides the legacy API used across the app
export const useToast = () => {
  const api = useToastNew();
  return {
    // Map legacy signature to the new API
    showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => api.notify(message, type),
  } as const;
};