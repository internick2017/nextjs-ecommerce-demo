import { NextRequest, NextResponse } from 'next/server';
import { CacheHandler, cachePresets } from '../../../../lib/cacheHandler';
import { withErrorHandler, withLogging } from '../../../../lib/apiErrorHandler';

const cacheHandler = new CacheHandler(cachePresets.medium);

const clearCacheHandler = async (request: NextRequest) => {
  await cacheHandler.clear();

  return NextResponse.json({
    success: true,
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
};

export const POST = withErrorHandler(withLogging(clearCacheHandler));
