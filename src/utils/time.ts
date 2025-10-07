import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

// Japan Standard Time timezone
export const JST_TIMEZONE = 'Asia/Tokyo';

/**
 * Parse an ISO string from API to a Date object (UTC)
 */
export const parseUTC = (dateString: string): Date => {
  const date = parseISO(dateString);
  if (!isValid(date)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
};

/**
 * Convert a Date object to ISO string (UTC) for sending to API
 */
export const toUTCString = (date: Date): string => {
  return date.toISOString();
};

/**
 * Format a UTC date to display in JST
 * @param date - Date object (in UTC from API)
 * @param format - Format string (default: 'yyyy-MM-dd HH:mm')
 */
export const formatJST = (date: Date | string, format: string = 'yyyy-MM-dd HH:mm'): string => {
  const dateObj = typeof date === 'string' ? parseUTC(date) : date;
  return formatInTimeZone(dateObj, JST_TIMEZONE, format);
};

/**
 * Format a UTC date to display in JST with timezone indicator
 */
export const formatJSTWithLabel = (date: Date | string, format: string = 'yyyy-MM-dd HH:mm'): string => {
  return formatJST(date, format) + ' JST';
};

/**
 * Format for datetime-local inputs (HTML5 input type)
 * Converts UTC date to JST and formats for input field
 */
export const toDateTimeLocalValue = (utcDate: Date | string): string => {
  const dateObj = typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate;
  // Format as YYYY-MM-DDTHH:mm for datetime-local input, showing JST time
  return formatInTimeZone(dateObj, JST_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
};

/**
 * Convert datetime-local input value (in JST) to UTC ISO string for API
 */
export const fromDateTimeLocalValue = (jstDateTimeLocal: string): string => {
  if (!jstDateTimeLocal) return '';

  // Parse the local datetime string as if it's in JST
  const date = parseISO(jstDateTimeLocal);
  if (!isValid(date)) {
    throw new Error(`Invalid datetime-local value: ${jstDateTimeLocal}`);
  }

  // Convert from JST to UTC
  const utcDate = fromZonedTime(date, JST_TIMEZONE);
  return utcDate.toISOString();
};

/**
 * Format for date inputs (HTML5 input type="date")
 * Converts UTC date to JST date
 */
export const toDateValue = (utcDate: Date | string): string => {
  const dateObj = typeof utcDate === 'string' ? parseUTC(utcDate) : utcDate;
  return formatInTimeZone(dateObj, JST_TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Convert date input value (in JST) to UTC ISO string for API
 * Assumes start of day in JST
 */
export const fromDateValue = (jstDate: string): string => {
  if (!jstDate) return '';

  // Parse as JST date at midnight
  const date = parseISO(jstDate + 'T00:00:00');
  if (!isValid(date)) {
    throw new Error(`Invalid date value: ${jstDate}`);
  }

  // Convert from JST to UTC
  const utcDate = fromZonedTime(date, JST_TIMEZONE);
  return utcDate.toISOString();
};

/**
 * Format for display in lists and tables
 */
export const formatDateJST = (date: Date | string): string => {
  return formatJST(date, 'MMM d, yyyy');
};

/**
 * Format for display with time
 */
export const formatDateTimeJST = (date: Date | string): string => {
  return formatJST(date, 'MMM d, yyyy HH:mm');
};

/**
 * Convert UTC ISO string to JST ISO string (without timezone indicator)
 * For use with FullCalendar - converts "2025-09-29T10:30:00Z" UTC to "2025-09-29T19:30:00" JST
 */
export const utcToJSTString = (utcString: string): string => {
  const utcDate = parseUTC(utcString);
  // Convert to JST and format as ISO string without timezone
  return formatInTimeZone(utcDate, JST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
};

/**
 * Convert JST Date object (from browser in JST format) to UTC ISO string
 * For use when FullCalendar gives us a Date - we treat it as JST and convert to UTC
 */
export const jstDateToUTC = (jstDate: Date): string => {
  // The Date from browser represents JST time, convert to UTC
  const utcDate = fromZonedTime(jstDate, JST_TIMEZONE);
  return utcDate.toISOString();
};

