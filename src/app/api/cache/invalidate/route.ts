import { NextRequest, NextResponse } from 'next/server';
import { CacheHandler, cachePresets } from '../../../../lib/cacheHandler';
import { withErrorHandler, withLogging } from '../../../../lib/apiErrorHandler';

const cacheHandler = new CacheHandler(cachePresets.medium);

const invalidateHandler = async (request: NextRequest) => {
  const body = await request.json();
  const { tags, pattern, before, after } = body;

  let count = 0;

  if (tags && Array.isArray(tags)) {
    count = await cacheHandler.invalidate({ tags });
  } else if (pattern) {
    count = await cacheHandler.invalidate({ pattern });
  } else if (before) {
    count = await cacheHandler.invalidate({ before: new Date(before) });
  } else if (after) {
    count = await cacheHandler.invalidate({ after: new Date(after) });
  } else {
    count = await cacheHandler.invalidate();
  }

  return NextResponse.json({
    success: true,
    data: { count },
    message: `Invalidated ${count} cache entries`,
    timestamp: new Date().toISOString()
  });
};

export const POST = withErrorHandler(withLogging(invalidateHandler));
