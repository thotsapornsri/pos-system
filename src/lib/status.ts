import type { Translation } from '../i18n/translations';
import type { DocStatus } from '../types';

const COLORS: Record<DocStatus, [string, string]> = {
  draft: ['#f0f0f7', '#6b7280'],
  pending: ['#fff3e0', '#c9800a'],
  approved: ['#e6f9f1', '#0a8a63'],
  rejected: ['#fdeceb', '#d0453a'],
  converted: ['#eef2f6', '#4b7fb8'],
  ordered: ['#eef2f6', '#4b7fb8'],
  received: ['#e8f9ef', '#0a8a4c'],
  confirmed: ['#eef2f6', '#4b7fb8'],
  fulfilled: ['#e8f9ef', '#0a8a4c'],
};

const LABEL_KEYS: Record<DocStatus, keyof Translation> = {
  draft: 'statusDraft',
  pending: 'statusPending',
  approved: 'statusApproved',
  rejected: 'statusRejected',
  converted: 'statusConverted',
  ordered: 'statusOrdered',
  received: 'statusReceived',
  confirmed: 'statusConfirmed',
  fulfilled: 'statusFulfilled',
};

export function statusStyle(status: DocStatus): { bg: string; color: string } {
  const [bg, color] = COLORS[status];
  return { bg, color };
}

export function statusLabel(status: DocStatus, t: Translation): string {
  return String(t[LABEL_KEYS[status]]);
}
