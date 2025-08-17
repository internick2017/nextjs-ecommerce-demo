import { NextRequest, NextResponse } from 'next/server';
import { CacheHandler, cachePresets } from '../../../../lib/cacheHandler';
import { withErrorHandler, withLogging } from '../../../../lib/apiErrorHandler';

const cacheHandler = new CacheHandler(cachePresets.medium);

const getStatsHandler = async (request: NextRequest) => {
  const stats = await cacheHandler.getStats();

  return NextResponse.json({
    success: true,
    data: stats,
    message: 'Cache statistics retrieved successfully',
    timestamp: new Date().toISOString()
  });
};

export const GET = withErrorHandler(withLogging(getStatsHandler));
