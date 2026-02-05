/**
 * Validation utilities for input validation and security
 */

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validates if a string is a valid email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitizes a string to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
    .slice(0, 1000) // Limit length
}

/**
 * Validates if a string is a valid slug (URL-friendly identifier)
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100
}

/**
 * Validates if a string is a valid app key
 */
export function isValidAppKey(appKey: string): boolean {
  if (!appKey || typeof appKey !== 'string') {
    return false
  }

  // App key format: ak_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const appKeyRegex = /^ak_[a-zA-Z0-9]{32}$/
  return appKeyRegex.test(appKey)
}

/**
 * Validates pagination parameters
 */
export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(page || 1))
  const validLimit = Math.min(100, Math.max(1, Math.floor(limit || 10)))

  return { page: validPage, limit: validLimit }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
