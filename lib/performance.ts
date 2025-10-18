/**
 * Performance Optimization Utilities
 * 
 * Caching, batching, and performance monitoring
 */

// Simple in-memory cache
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly defaultTTL = 30000; // 30 seconds

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    });
  }
}

export const cache = new MemoryCache();

// Cache wrapper for async functions
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = 30000
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
}

// Batch multiple calls into a single request
export class BatchProcessor<T, R> {
  private batch: Array<{ input: T; resolve: (value: R) => void; reject: (error: Error) => void }> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly batchDelay: number;

  constructor(
    private processor: (inputs: T[]) => Promise<R[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  async process(input: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.batch.push({ input, resolve, reject });
      
      if (this.batch.length >= this.batchSize) {
        this.flush();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const currentBatch = this.batch.splice(0, this.batchSize);
    
    try {
      const inputs = currentBatch.map(item => item.input);
      const results = await this.processor(inputs);
      
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error as Error);
      });
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    };
  }

  recordMetric(operation: string, value: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const values = this.metrics.get(operation)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.splice(0, values.length - 100);
    }
  }

  getStats(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(operation);
    
    if (!values || values.length === 0) {
      return null;
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  }

  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((_, operation) => {
      const stat = this.getStats(operation);
      if (stat) {
        stats[operation] = stat;
      }
    });
    
    return stats;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Debounce utility
export function debounce<T extends any[]>(
  func: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends any[]>(
  func: (...args: T) => void,
  limit: number
): (...args: T) => void {
  let inThrottle: boolean;
  
  return (...args: T) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);
