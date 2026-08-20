import { useEffect } from 'react';
import { usePos } from '../store/PosContext';
import { getSlot, subscribeToSlot } from '../components/ui/ImageSlot';

function setFavicon(href: string): void {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Keeps the browser tab's title and favicon in sync with the store's own
 * name/logo (set in Settings) instead of the app's hardcoded demo defaults. */
export function useDocumentBranding(): void {
  const { storeSettings } = usePos();

  useEffect(() => {
    document.title = storeSettings.name ? `${storeSettings.name} — POS` : 'POS';
  }, [storeSettings.name]);

  useEffect(() => {
    const existing = getSlot('store-logo');
    if (existing) setFavicon(existing);
    return subscribeToSlot('store-logo', setFavicon);
  }, []);
}
