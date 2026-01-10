/**
 * Centralized error handling utility
 * Provides consistent error messages and user-friendly error handling
 */

export type ErrorType = "network" | "rate_limit" | "validation" | "unknown";

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: unknown;
}

/**
 * Detects error type from an error object
 */
function detectErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("failed to fetch")
    ) {
      return "network";
    }
    
    // Rate limit errors
    if (message.includes("rate limit") || message.includes("too fast")) {
      return "rate_limit";
    }
    
    // Validation errors
    if (
      message.includes("invalid") ||
      message.includes("validation") ||
      message.includes("required")
    ) {
      return "validation";
    }
  }
  
  return "unknown";
}

/**
 * Creates a user-friendly error message based on error type
 */
function getUserMessage(type: ErrorType, originalMessage?: string): string {
  switch (type) {
    case "network":
      return "Connection issue. Please check your internet connection and try again.";
    case "rate_limit":
      return originalMessage || "You're booping too fast! Please wait a moment.";
    case "validation":
      return originalMessage || "Please check your input and try again.";
    case "unknown":
    default:
      return originalMessage || "Something went wrong. Please try again.";
  }
}

/**
 * Handles an error and returns a standardized AppError
 */
export function handleError(error: unknown, customMessage?: string): AppError {
  const type = detectErrorType(error);
  const originalMessage = error instanceof Error ? error.message : String(error);
  const userMessage = customMessage || getUserMessage(type, originalMessage);

  // Log error for debugging (in development)
  if (__DEV__) {
    console.error("App Error:", {
      type,
      originalMessage,
      userMessage,
      error,
    });
  }

  return {
    type,
    message: originalMessage,
    userMessage,
    originalError: error,
  };
}

/**
 * Checks if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return detectErrorType(error) === "network";
}

/**
 * Checks if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  return detectErrorType(error) === "rate_limit";
}


