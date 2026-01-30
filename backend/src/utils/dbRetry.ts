/**
 * Database retry utility with exponential backoff
 * Handles transient database connection errors
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Check if error is a transient database connection error
 */
function isTransientError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  
  // Prisma connection errors
  if (errorCode === 'P1001') return true; // Can't reach database server
  if (errorCode === 'P1002') return true; // Connection timeout
  if (errorCode === 'P1008') return true; // Operations timed out
  if (errorCode === 'P1017') return true; // Server has closed the connection
  
  // Check error message for connection issues
  if (errorMessage.includes("can't reach database server")) return true;
  if (errorMessage.includes("connection timeout")) return true;
  if (errorMessage.includes("connection closed")) return true;
  if (errorMessage.includes("network")) return true;
  
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // If it's not a transient error, throw immediately
      if (!isTransientError(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        throw error;
      }
      
      // Log retry attempt
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${opts.maxRetries + 1}), retrying in ${delay}ms...`,
        error.message
      );
      
      // Wait before retrying
      await sleep(delay);
      
      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

