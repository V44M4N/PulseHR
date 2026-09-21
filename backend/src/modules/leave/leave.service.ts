import {
  LeaveRequest,
  LeaveStatus,
  Prisma,
} from '@prisma/client';
import {
  eachDayOfInterval,
  parseISO,
  isWeekend,
  startOfMonth,
  endOfMonth,
  getYear,
} from 'date-fns';
import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { buildMeta, PaginationMeta } from '../../utils/pagination';
import { nextLeaveCode } from '../../utils/codeGen';
import { ApplyLeaveDto, ListLeaveQueryDto, RejectLeaveDto } from './leave.schema';

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

export type LeaveBalanceWithType = Prisma.LeaveBalanceGetPayload<{
  include: { leaveType: true };
}>;

export type LeaveRequestWithDetails = Prisma.LeaveRequestGetPayload<{
  include: {
    leaveType: true;
    employee: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        employeeCode: true;
        designation: true;
      };
    };
  };
}>;

export interface PaginatedLeaveRequests {
  data: LeaveRequestWithDetails[];
  meta: PaginationMeta;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Count working days (Mon–Fri) between two dates inclusive.
 * Throws LEAVE_DATE_INVALID when fromDate is after toDate.
 */
function calcWorkingDays(from: Date, to: Date): number {
  if (from > to) {
    throw Errors.LEAVE_DATE_INVALID();
  }
  const days = eachDayOfInterval({ start: from, end: to });
  return days.filter((d) => !isWeekend(d)).length;
}

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Return all leave balances for an employee for the given year.
 * Defaults to the current calendar year.
 */
export async function getBalances(
  employeeId: string,
  year?: number,
): Promise<LeaveBalanceWithType[]> {
  const targetYear = year ?? getYear(new Date());

  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year: targetYear },
    include: { leaveType: true },
    orderBy: { leaveType: { name: 'asc' } },
  });

  return balances;
}

/**
 * Return paginated leave requests.
 * - EMPLOYEE / MANAGER: own requests only
 * - HR / ADMIN: all requests (optionally filtered by status / year)
 */
export async function getRequests(
  employeeId: string,
  role: Role,
  query: ListLeaveQueryDto,
  page: number,
  limit: number,
): Promise<PaginatedLeaveRequests> {
  const skip = (page - 1) * limit;

  const isPrivileged = role === 'HR' || role === 'ADMIN';

  const where: Prisma.LeaveRequestWhereInput = {
    ...(isPrivileged ? {} : { employeeId }),
    ...(query.status ? { status: query.status as LeaveStatus } : {}),
    ...(query.year
      ? {
          fromDate: {
            gte: new Date(`${query.year}-01-01`),
            lte: new Date(`${query.year}-12-31`),
          },
        }
      : {}),
  };

  const [total, requests] = await prisma.$transaction([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            designation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: requests,
    meta: buildMeta(page, limit, total),
  };
}

/**
 * Apply for leave:
 * 1. Parse and validate dates
 * 2. Calculate working days
 * 3. Verify balance exists and is sufficient
 * 4. Generate a unique code
 * 5. Create the leave request and increment used balance — in a transaction
 */
export async function apply(
  employeeId: string,
  dto: ApplyLeaveDto,
): Promise<LeaveRequest> {
  const fromDate = parseISO(dto.fromDate);
  const toDate = parseISO(dto.toDate);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw Errors.LEAVE_DATE_INVALID();
  }

  const days = calcWorkingDays(fromDate, toDate);

  if (days === 0) {
    throw new AppError(
      'LEAVE_DATE_INVALID',
      'Selected date range contains no working days',
      400,
    );
  }

  const year = getYear(fromDate);

  // Verify the leave type exists
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: dto.leaveTypeId },
  });
  if (!leaveType) {
    throw Errors.NOT_FOUND('LeaveType');
  }
  if (!leaveType.isActive) {
    throw new AppError('LEAVE_TYPE_INACTIVE', 'This leave type is not active', 400);
  }

  // Fetch or create balance record for the employee + type + year
  let balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        year,
      },
    },
  });

  if (!balance) {
    throw Errors.NOT_FOUND('LeaveBalance for this leave type');
  }

  const remaining = balance.total - balance.used;
  if (remaining < days) {
    throw Errors.LEAVE_BALANCE_LOW();
  }

  const code = await nextLeaveCode();

  const [request] = await prisma.$transaction([
    prisma.leaveRequest.create({
      data: {
        code,
        employeeId,
        leaveTypeId: dto.leaveTypeId,
        fromDate,
        toDate,
        days,
        reason: dto.reason,
        status: 'PENDING',
      },
    }),
    prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { used: { increment: days } },
    }),
  ]);

  return request;
}

/**
 * Approve a leave request — sets status to APPROVED.
 */
export async function approve(
  id: string,
  approverId: string,
): Promise<LeaveRequest> {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });

  if (!request) {
    throw Errors.NOT_FOUND('LeaveRequest');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(
      'LEAVE_INVALID_STATE',
      `Cannot approve a request with status ${request.status}`,
      400,
    );
  }

  return prisma.leaveRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });
}

/**
 * Reject a leave request — sets status to REJECTED and restores balance.
 */
export async function reject(
  id: string,
  approverId: string,
  dto: RejectLeaveDto,
): Promise<LeaveRequest> {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });

  if (!request) {
    throw Errors.NOT_FOUND('LeaveRequest');
  }

  if (request.status !== 'PENDING') {
    throw new AppError(
      'LEAVE_INVALID_STATE',
      `Cannot reject a request with status ${request.status}`,
      400,
    );
  }

  const year = getYear(request.fromDate);

  const [updated] = await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: approverId,
        approvedAt: new Date(),
        rejectedReason: dto.reason,
      },
    }),
    // Restore the balance that was deducted at apply time
    prisma.leaveBalance.updateMany({
      where: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
      },
      data: { used: { decrement: request.days } },
    }),
  ]);

  return updated;
}

/**
 * Cancel a leave request:
 * - Only PENDING requests can be cancelled
 * - Only the employee who submitted it can cancel it
 * - Restores the deducted balance
 */
export async function cancel(
  id: string,
  employeeId: string,
): Promise<LeaveRequest> {
  const request = await prisma.leaveRequest.findUnique({ where: { id } });

  if (!request) {
    throw Errors.NOT_FOUND('LeaveRequest');
  }

  if (request.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  if (request.status !== 'PENDING') {
    throw new AppError(
      'LEAVE_INVALID_STATE',
      `Only PENDING requests can be cancelled (current status: ${request.status})`,
      400,
    );
  }

  const year = getYear(request.fromDate);

  const [updated] = await prisma.$transaction([
    prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    }),
    prisma.leaveBalance.updateMany({
      where: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
      },
      data: { used: { decrement: request.days } },
    }),
  ]);

  return updated;
}

/**
 * Return approved leaves for all direct reports of the given manager
 * that fall within the current calendar month.
 */
export async function getTeamCalendar(
  managerId: string,
): Promise<LeaveRequestWithDetails[]> {
  // Resolve the employee record for the manager so we can find reports
  const manager = await prisma.employee.findUnique({
    where: { id: managerId },
    select: { id: true },
  });

  if (!manager) {
    throw Errors.NOT_FOUND('Employee');
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: { managerId },
      status: 'APPROVED',
      OR: [
        { fromDate: { lte: monthEnd }, toDate: { gte: monthStart } },
      ],
    },
    include: {
      leaveType: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          designation: true,
        },
      },
    },
    orderBy: { fromDate: 'asc' },
  });

  return requests;
}
