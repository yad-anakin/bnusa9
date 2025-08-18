"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  show: (message: string, kind?: ToastKind, durationMs?: number) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, kind: ToastKind = 'info', durationMs = 3000) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, kind }]);
    if (durationMs > 0) {
      setTimeout(() => remove(id), durationMs);
    }
  }, [remove]);

  const ctx = useMemo<ToastContextValue>(() => ({
    show,
    success: (m: string, d?: number) => show(m, 'success', d),
    error: (m: string, d?: number) => show(m, 'error', d),
    info: (m: string, d?: number) => show(m, 'info', d),
  }), [show]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Intercept window.alert and show as toast */}
      <AlertInterceptor onAlert={(msg) => show(msg, 'info')} />
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `min-w-[240px] max-w-[360px] rounded-md px-4 py-3 shadow-lg text-sm text-white ` +
              (t.kind === 'success' ? 'bg-green-600' : t.kind === 'error' ? 'bg-red-600' : 'bg-gray-800')
            }
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-80 hover:opacity-100" aria-label="Dismiss">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function AlertInterceptor({ onAlert }: { onAlert: (message: string) => void }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const original = window.alert;
    window.alert = (message?: any) => {
      try {
        onAlert(typeof message === 'string' ? message : String(message));
      } catch (e) {
        // Fallback to original if anything goes wrong
        original(message);
      }
    };
    return () => {
      window.alert = original;
    };
  }, [onAlert]);
  return null;
}
