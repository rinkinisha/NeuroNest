/**
 * utils/dateHelpers.js
 * Date formatting utilities used throughout the app.
 */

/**
 * Formats a date to a relative "time ago" string.
 * @param {string|Date} date
 * @returns {string} e.g. "2 days ago", "just now"
 */
export const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

/**
 * Format date to display string
 * @param {string|Date} date
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  const defaultOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(
    new Date(date)
  );
};

/**
 * Format date for HTML date input (YYYY-MM-DD)
 * @param {Date} date
 * @returns {string}
 */
export const toInputDate = (date = new Date()) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Check if a date is today
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past (before today)
 * @param {string|Date} date
 * @returns {boolean}
 */
export const isPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
};

/**
 * Days until a date
 * @param {string|Date} date
 * @returns {number} Positive = future, Negative = past
 */
export const daysUntil = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
};

/**
 * Get ordinal suffix for a day number
 * @param {number} n
 * @returns {string}
 */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
