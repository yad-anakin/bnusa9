"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type Pending = { id: number; resolve: (v: boolean) => void; opts: ConfirmOptions } | null;

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ id: Date.now(), resolve, opts });
    });
  }, []);

  const ctx = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  const close = useCallback((v: boolean) => {
    setPending((p) => {
      if (p) p.resolve(v);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={ctx}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => close(false)} />
          <div className="relative z-[9999] w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            {pending.opts.title && (
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{pending.opts.title}</h2>
            )}
            {pending.opts.description && (
              <p className="text-sm text-gray-600 mb-4">{pending.opts.description}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => close(false)}
              >
                {pending.opts.cancelText || 'ڕەتکردنەوە'}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={() => close(true)}
              >
                {pending.opts.confirmText || 'دڵنیام'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider');
  return ctx.confirm;
}
