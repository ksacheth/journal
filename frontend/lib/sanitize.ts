"use client";

import DOMPurify from "dompurify";

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and potentially dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Use DOMPurify to sanitize HTML
  // This removes script tags and other dangerous elements
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed - treat as plain text
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep the text content
  });

  return sanitized;
}
