/**
 * Error Handling Utilities
 * 
 * Centralized error handling for the application
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class WalletError extends AppError {
  constructor(message: string) {
    super(message, 'WALLET_ERROR', 400);
  }
}

export class DelegationError extends AppError {
  constructor(message: string) {
    super(message, 'DELEGATION_ERROR', 400);
  }
}

// Error handler wrapper
export async function handleAsync<T>(
  asyncFn: () => Promise<T>,
  errorMessage?: string
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await asyncFn();
    return { data };
  } catch (error: any) {
    console.error('Async operation failed:', error);
    
    let appError: AppError;
    
    if (error instanceof AppError) {
      appError = error;
    } else if (error.message?.includes('User rejected')) {
      appError = new WalletError('User rejected the transaction');
    } else if (error.message?.includes('insufficient funds')) {
      appError = new WalletError('Insufficient funds for transaction');
    } else if (error.message?.includes('network')) {
      appError = new NetworkError('Network connection failed');
    } else if (error.message?.includes('validation')) {
      appError = new ValidationError(error.message);
    } else {
      appError = new AppError(
        errorMessage || error.message || 'An unexpected error occurred',
        'UNKNOWN_ERROR'
      );
    }
    
    return { error: appError };
  }
}

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Security utilities
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    throw new ValidationError('Invalid address format');
  }
  
  const sanitized = address.toLowerCase().trim();
  
  if (!sanitized.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new ValidationError('Address must be a valid Ethereum address');
  }
  
  return sanitized as `0x${string}`;
}

export function validateAmount(amount: number): number {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }
  
  if (amount > 1000000) { // Max 1M mUSDC
    throw new ValidationError('Amount exceeds maximum limit');
  }
  
  return amount;
}

export function validatePeriod(period: number): number {
  if (typeof period !== 'number' || isNaN(period) || period <= 0) {
    throw new ValidationError('Period must be a positive number');
  }
  
  if (period > 31536000) { // Max 1 year in seconds
    throw new ValidationError('Period exceeds maximum limit (1 year)');
  }
  
  return period;
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}
