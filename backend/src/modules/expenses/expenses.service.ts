import { ExpenseStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { buildMeta } from '../../utils/pagination';
import { nextExpenseCode } from '../../utils/codeGen';
import type { CreateExpenseDto, ListExpensesQueryDto } from './expenses.schema';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ELEVATED_ROLES: Role[] = ['MANAGER', 'HR', 'ADMIN'];

function isElevated(role: string): boolean {
  return ELEVATED_ROLES.includes(role as Role);
}

// ── Service Methods ───────────────────────────────────────────────────────────

/**
 * List expenses.
 * EMPLOYEE: sees only their own expenses.
 * MANAGER / HR / ADMIN: see all expenses.
 * Optionally filtered by status and/or category.
 */
export async function list(
  employeeId: string,
  role: string,
  query: ListExpensesQueryDto & { page?: number; limit?: number },
) {
  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, query.limit ?? 20);
  const skip  = (page - 1) * limit;

  const where: Prisma.ExpenseWhereInput = {
    ...(isElevated(role) ? {} : { employeeId }),
    ...(query.status   ? { status:   query.status as ExpenseStatus } : {}),
    ...(query.category ? { category: query.category }               : {}),
  };

  const [expenses, total] = await prisma.$transaction([
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, meta: buildMeta(page, limit, total) };
}

/**
 * Get a single expense by ID.
 * EMPLOYEE: can only access their own expense.
 * MANAGER / HR / ADMIN: can access any expense.
 */
export async function getById(id: string, employeeId: string, role: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true },
      },
    },
  });

  if (!expense) {
    throw Errors.NOT_FOUND('Expense');
  }

  if (!isElevated(role) && expense.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  return expense;
}

/**
 * Create a new expense for the authenticated employee.
 */
export async function create(employeeId: string, dto: CreateExpenseDto) {
  const code = await nextExpenseCode();

  const expense = await prisma.expense.create({
    data: {
      code,
      employeeId,
      date:        new Date(dto.date),
      category:    dto.category,
      amount:      dto.amount,
      currency:    dto.currency ?? 'INR',
      description: dto.description,
      status:      'PENDING',
    },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true },
      },
    },
  });

  return expense;
}

/**
 * Approve an expense (MANAGER / HR / ADMIN).
 */
export async function approve(id: string, approverId: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw Errors.NOT_FOUND('Expense');
  }

  if (expense.status !== 'PENDING' && expense.status !== 'UNDER_REVIEW') {
    throw new AppError(
      'EXPENSE_NOT_APPROVABLE',
      `Expense with status ${expense.status} cannot be approved`,
      400,
    );
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status:      'APPROVED',
      approvedById: approverId,
      approvedAt:  new Date(),
      rejectedReason: null,
    },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Reject an expense (MANAGER / HR / ADMIN).
 */
export async function reject(id: string, approverId: string, reason: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw Errors.NOT_FOUND('Expense');
  }

  if (expense.status !== 'PENDING' && expense.status !== 'UNDER_REVIEW') {
    throw new AppError(
      'EXPENSE_NOT_REJECTABLE',
      `Expense with status ${expense.status} cannot be rejected`,
      400,
    );
  }

  return prisma.expense.update({
    where: { id },
    data: {
      status:         'REJECTED',
      approvedById:   approverId,
      approvedAt:     new Date(),
      rejectedReason: reason,
    },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true },
      },
    },
  });
}

/**
 * Mark an expense as reimbursed (HR / ADMIN only).
 * The expense must already be in APPROVED status.
 */
export async function markReimbursed(id: string) {
  const expense = await prisma.expense.findUnique({ where: { id } });

  if (!expense) {
    throw Errors.NOT_FOUND('Expense');
  }

  if (expense.status !== 'APPROVED') {
    throw new AppError(
      'EXPENSE_NOT_REIMBURSABLE',
      `Only APPROVED expenses can be marked as reimbursed (current status: ${expense.status})`,
      400,
    );
  }

  return prisma.expense.update({
    where: { id },
    data: { status: 'REIMBURSED' },
    include: {
      employee: {
        select: { id: true, employeeCode: true, firstName: true, lastName: true },
      },
    },
  });
}
