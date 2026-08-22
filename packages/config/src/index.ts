// ─── Centralized Plot Status Colors ────────────────────────────────────────────
// Change ONLY here — never hard-code colors throughout the app

export const PLOT_STATUS_COLORS = {
  AVAILABLE: '#22c55e',   // green
  RESERVED:  '#eab308',   // yellow
  SOLD:      '#ef4444',   // red
  BLOCKED:   '#6b7280',   // grey
} as const;

export const PLOT_STATUS_LABELS = {
  AVAILABLE: 'Available',
  RESERVED:  'Reserved',
  SOLD:      'Sold',
  BLOCKED:   'Blocked',
} as const;

// ─── Property Status Labels ─────────────────────────────────────────────────────

export const PROPERTY_STATUS_LABELS = {
  DRAFT:          'Draft',
  PENDING_REVIEW: 'Pending Review',
  PUBLISHED:      'Published',
  REJECTED:       'Rejected',
  SOLD:           'Sold',
  RENTED:         'Rented',
  ARCHIVED:       'Archived',
} as const;

export const LISTING_TYPE_LABELS = {
  SELL:  'For Sale',
  RENT:  'For Rent',
  LEASE: 'For Lease',
} as const;

// ─── Area Unit Labels ───────────────────────────────────────────────────────────

export const AREA_UNIT_LABELS = {
  SQ_FT:   'sq.ft',
  SQ_MT:   'sq.m',
  ACRE:    'Acre',
  BIGHA:   'Bigha',
  HECTARE: 'Hectare',
  MARLA:   'Marla',
  KANAL:   'Kanal',
} as const;

// ─── Pagination ─────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// ─── File Limits ────────────────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_DIMENSION = 4096;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const PROPERTY_MAX_IMAGES = 20;

// ─── Rate Limiting ──────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  AUTH_LOGIN: { max: 5, windowMs: 15 * 60 * 1000 },           // 5/15min
  AUTH_REGISTER: { max: 10, windowMs: 60 * 60 * 1000 },       // 10/hour
  AUTH_FORGOT_PASSWORD: { max: 3, windowMs: 60 * 60 * 1000 }, // 3/hour
  PROPERTY_CREATE: { max: 10, windowMs: 60 * 60 * 1000 },     // 10/hour
  SEARCH: { max: 60, windowMs: 60 * 1000 },                   // 60/min
  CHAT: { max: 30, windowMs: 60 * 1000 },                     // 30/min
  GENERAL: { max: 100, windowMs: 60 * 1000 },                 // 100/min
} as const;

// ─── JWT ────────────────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ─── App Config ─────────────────────────────────────────────────────────────────

export const APP_NAME = 'Rewa Bhoomi';
export const APP_DESCRIPTION = 'Rewa\'s trusted real estate marketplace for buying, selling and renting properties.';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.rewabhoomi.com';
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ─── WebRTC ─────────────────────────────────────────────────────────────────────

export const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
