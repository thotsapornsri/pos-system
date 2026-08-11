import { useCallback } from 'react';
import { computePrintData, openDocsPreviewWindow } from '../lib/print';
import { usePos } from '../store/PosContext';
import type { PrintData, PrintDocRef } from '../types';

/** Bridges the store's data into the print helpers. */
export function usePrinting() {
  const pos = usePos();
  const { t, fmt, materials, products, vendors, storeSettings } = pos;

  const toPrintData = useCallback(
    (ref: PrintDocRef): PrintData => computePrintData(ref, { t, fmt, materials, products, vendors }),
    [t, fmt, materials, products, vendors],
  );

  /** Opens a separate tab holding the rendered document — used by list-row print buttons. */
  const previewInWindow = useCallback(
    (ref: PrintDocRef) => {
      const pd = toPrintData(ref);
      openDocsPreviewWindow(`${pd.title} ${pd.no}`, [pd], storeSettings, t);
    },
    [toPrintData, storeSettings, t],
  );

  /** Opens the in-app print-preview modal. */
  const openPreviewModal = useCallback((ref: PrintDocRef) => pos.set({ printDoc: ref }), [pos]);

  return { toPrintData, previewInWindow, openPreviewModal };
}
