// ── Load env FIRST before any other imports ───────────────────────────────────
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Imports ───────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler';
import { auditMiddleware } from './middleware/audit';

// ── Module routers ────────────────────────────────────────────────────────────
import { authRouter }        from './modules/auth/auth.routes';
import { employeesRouter }   from './modules/employees/employees.routes';
import { leaveRouter }       from './modules/leave/leave.routes';
import { attendanceRouter }  from './modules/attendance/attendance.routes';
import { payslipsRouter }    from './modules/payslips/payslips.routes';
import { documentsRouter }   from './modules/documents/documents.routes';
import { expensesRouter }    from './modules/expenses/expenses.routes';
import { helpdeskRouter }    from './modules/helpdesk/helpdesk.routes';
import { feedRouter }        from './modules/feed/feed.routes';
import { directoryRouter }   from './modules/directory/directory.routes';
import { recruitmentRouter } from './modules/recruitment/recruitment.routes';
import { onboardingRouter }  from './modules/onboarding/onboarding.routes';
import { payrollRouter }     from './modules/payroll/payroll.routes';
import { analyticsRouter }   from './modules/analytics/analytics.routes';
import { adminRouter }       from './modules/admin/admin.routes';

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin:      env.FRONTEND_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression() as express.RequestHandler);

// Logging (skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Rate limiting
app.use('/api/', rateLimit({
  windowMs:        60 * 1000,  // 1 minute
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
}));

// Stricter rate limit on auth endpoints
app.use('/api/v1/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      10,
  message:  { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts' } },
}));

// Audit logging
app.use(auditMiddleware);

// ── Swagger docs ──────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info:    { title: 'PulseHR API', version: '1.0.0', description: 'PulseHR backend REST API' },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
});
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', env: env.NODE_ENV } });
});

// ── Routes ────────────────────────────────────────────────────────────────────
const api = '/api/v1';
app.use(`${api}/auth`,        authRouter);
app.use(`${api}/employees`,   employeesRouter);
app.use(`${api}/leave`,       leaveRouter);
app.use(`${api}/attendance`,  attendanceRouter);
app.use(`${api}/payslips`,    payslipsRouter);
app.use(`${api}/documents`,   documentsRouter);
app.use(`${api}/expenses`,    expensesRouter);
app.use(`${api}/helpdesk`,    helpdeskRouter);
app.use(`${api}/feed`,        feedRouter);
app.use(`${api}/directory`,   directoryRouter);
app.use(`${api}/hr/recruitment`, recruitmentRouter);
app.use(`${api}/hr/onboarding`,  onboardingRouter);
app.use(`${api}/hr/payroll`,     payrollRouter);
app.use(`${api}/hr/analytics`,   analyticsRouter);
app.use(`${api}/admin`,       adminRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler (must be last)
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀  PulseHR API running on http://localhost:${env.PORT}/api/v1`);
    console.log(`📚  Swagger docs at http://localhost:${env.PORT}/api/v1/docs`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[${signal}] Shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };
