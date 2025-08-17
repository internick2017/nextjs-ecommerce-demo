import { NextRequest, NextResponse } from 'next/server';
import { CacheHandler, withCache, cachePresets } from '../../../../lib/cacheHandler';
import { withErrorHandler, withLogging } from '../../../../lib/apiErrorHandler';

const cacheHandler = new CacheHandler(cachePresets.short);

const testHandler = async (request: NextRequest) => {
  const url = new URL(request.url);
  const cacheKey = cacheHandler.generateKey('test', {
    timestamp: Date.now(),
    random: Math.random()
  });

  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  const data = {
    message: 'This is a cached response',
    timestamp: new Date().toISOString(),
    cacheKey,
    random: Math.random(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  return NextResponse.json({
    success: true,
    data,
    message: 'Test response with caching',
    cache: {
      key: cacheKey,
      ttl: cachePresets.short.ttl,
      timestamp: new Date().toISOString()
    }
  });
};

// Apply cache middleware
export const GET = withCache(cachePresets.short)(
  withErrorHandler(withLogging(testHandler))
);
