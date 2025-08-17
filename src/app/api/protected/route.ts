import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandler,
  withLogging
} from '../../../lib/apiErrorHandler';
import {
  withAuth,
  withRateLimit,
  withValidation,
  withCors,
  Session,
  sessionUtils
} from '../../../lib/routeMiddleware';
import { headerUtils } from '../../../lib/headerHandler';
import { AppError } from '../../../lib/errorHandler';

// Protected route handler
const protectedHandler = async (request: NextRequest, session: Session) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'info';

  switch (action) {
    case 'info':
      return headerUtils.createResponse({
        success: true,
        message: 'Protected route accessed successfully',
        data: {
          user: {
            id: session.userId,
            email: session.email,
            role: session.role,
            permissions: session.permissions
          },
          session: {
            expiresAt: new Date(session.expiresAt).toISOString(),
            lastActivity: new Date(session.lastActivity).toISOString()
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          action: 'info'
        }
      });

    case 'update':
      const body = await request.json();
      const { permissions } = body;

      // Update session permissions
      if (permissions && Array.isArray(permissions)) {
        const token = request.cookies.get('authToken')?.value ||
                     request.headers.get('authorization')?.replace('Bearer ', '');

        if (token) {
          await sessionUtils.updateSession(token, { permissions });
        }
      }

      return headerUtils.createResponse({
        success: true,
        message: 'Session updated successfully',
        data: { permissions },
        metadata: {
          timestamp: new Date().toISOString(),
          action: 'update'
        }
      });

    case 'admin':
      // Check if user has admin role
      if (session.role !== 'admin') {
        throw new AppError('Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
      }

      return headerUtils.createResponse({
        success: true,
        message: 'Admin route accessed successfully',
        data: {
          adminInfo: {
            userId: session.userId,
            email: session.email,
            role: session.role,
            permissions: session.permissions
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          action: 'admin'
        }
      });

    default:
      throw new AppError('Invalid action', 400, 'INVALID_ACTION');
  }
};

// Export with authentication middleware
export const GET = withAuth({
  requireAuth: true,
  roles: ['user', 'admin'],
  permissions: ['read']
})(
  withRateLimit(100, 15 * 60 * 1000)(
    withValidation({
      requiredQueryParams: ['action']
    })(
      withCors(['http://localhost:3000'], ['GET'])(
        withErrorHandler(protectedHandler)
      )
    )
  )
);

export const POST = withAuth({
  requireAuth: true,
  roles: ['user', 'admin'],
  permissions: ['write']
})(
  withRateLimit(50, 15 * 60 * 1000)(
    withValidation({
      validateContentType: true,
      maxBodySize: 1024 * 1024 // 1MB
    })(
      withCors(['http://localhost:3000'], ['POST'])(
        withErrorHandler(protectedHandler)
      )
    )
  )
);
