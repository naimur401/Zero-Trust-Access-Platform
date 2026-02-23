// API Error handling utilities
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export const ErrorMessages = {
  INVALID_REQUEST: 'Invalid request format',
  MONGODB_CONNECTION_FAILED: 'Database connection failed',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
}

export function handleAPIError(error: any) {
  console.error('[API Error]:', error)

  if (error instanceof APIError) {
    return {
      status: error.statusCode,
      body: {
        error: error.message,
        code: error.code,
      },
    }
  }

  if (error.name === 'ZodError') {
    return {
      status: 400,
      body: {
        error: ErrorMessages.VALIDATION_ERROR,
        details: error.errors,
      },
    }
  }

  if (error.message.includes('MongoDB')) {
    return {
      status: 503,
      body: {
        error: ErrorMessages.MONGODB_CONNECTION_FAILED,
      },
    }
  }

  return {
    status: 500,
    body: {
      error: ErrorMessages.INTERNAL_SERVER_ERROR,
    },
  }
}

export function successResponse(data: any, statusCode = 200) {
  return {
    status: statusCode,
    body: {
      success: true,
      data,
    },
  }
}
