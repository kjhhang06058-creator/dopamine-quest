'use client';

import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { PixelButton } from './PixelButton';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Styled replacement for native confirm(). Portaled to <body> so `fixed` positions against the
 * viewport rather than any backdrop-blur ancestor (the bug that bit AccountPanel). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  onConfirm,
  onCancel,
}: Props) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-lg border-2 border-rose-700 bg-zinc-950 p-4"
          >
            <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-rose-300">
              <AlertTriangle className="h-4 w-4" /> {title}
            </div>
            {description && <p className="mb-4 text-xs leading-relaxed text-zinc-400">{description}</p>}
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded border border-zinc-700 py-2 text-xs font-bold text-zinc-400 hover:bg-zinc-900"
              >
                취소
              </button>
              <PixelButton variant="danger" onClick={onConfirm} className="flex-1">
                {confirmLabel}
              </PixelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
