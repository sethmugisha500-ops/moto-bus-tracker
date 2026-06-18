'use client';

import { AnimatePresence } from 'framer-motion';
import { Toast, ToastType } from './Toast';
import { useToastStore } from '@/store/toast.store';

export const Toaster = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};