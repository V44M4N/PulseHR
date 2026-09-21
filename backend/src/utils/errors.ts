export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Pre-defined errors ────────────────────────────────────────────────────────

export const Errors = {
  // Auth
  INVALID_CREDENTIALS:      () => new AppError('INVALID_CREDENTIALS',      'Invalid email or password', 401),
  TOKEN_MISSING:            () => new AppError('TOKEN_MISSING',            'Authentication token required', 401),
  TOKEN_INVALID:            () => new AppError('TOKEN_INVALID',            'Invalid or expired token', 401),
  TOKEN_REVOKED:            () => new AppError('TOKEN_REVOKED',            'Token has been revoked', 401),
  ACCOUNT_INACTIVE:         () => new AppError('ACCOUNT_INACTIVE',         'Account is deactivated', 403),
  FORBIDDEN:                () => new AppError('FORBIDDEN',                'Insufficient permissions', 403),
  // Resources
  NOT_FOUND:                (r: string) => new AppError('NOT_FOUND',       `${r} not found`, 404),
  CONFLICT:                 (msg: string) => new AppError('CONFLICT',      msg, 409),
  // Business rules
  LEAVE_BALANCE_LOW:        () => new AppError('LEAVE_BALANCE_LOW',        'Insufficient leave balance', 400),
  LEAVE_DATE_INVALID:       () => new AppError('LEAVE_DATE_INVALID',       'Leave dates are invalid', 400),
  ALREADY_CLOCKED_IN:       () => new AppError('ALREADY_CLOCKED_IN',       'Already clocked in for today', 400),
  NOT_CLOCKED_IN:           () => new AppError('NOT_CLOCKED_IN',           'No active clock-in found for today', 400),
  PAYROLL_ALREADY_RUN:      () => new AppError('PAYROLL_ALREADY_RUN',      'Payroll already exists for this period', 409),
  // Generic
  VALIDATION:               (msg: string) => new AppError('VALIDATION_ERROR', msg, 400),
  INTERNAL:                 () => new AppError('INTERNAL_ERROR',           'An unexpected error occurred', 500),
} as const;
