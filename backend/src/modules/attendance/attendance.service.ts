import { AttendanceRecord, AttendanceStatus, Prisma } from '@prisma/client';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
} from 'date-fns';
import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import type { ManualAttendanceInput } from './attendance.schema';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return a Date representing today at 00:00:00 UTC so it matches @db.Date storage. */
function todayDate(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

/** Normalise any Date to midnight UTC (for @db.Date column equality). */
function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Round to 2 decimal places. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Calculate hours worked between two timestamps, rounded to 2 dp. */
function calcHoursWorked(clockIn: Date, clockOut: Date): number {
  const minutes = differenceInMinutes(clockOut, clockIn);
  return round2(minutes / 60);
}

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Record a clock-in for the given employee.
 * Throws ALREADY_CLOCKED_IN if a record already exists for today.
 */
export async function clockIn(
  employeeId: string,
  notes?: string,
): Promise<AttendanceRecord> {
  const today = todayDate();

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing) {
    throw Errors.ALREADY_CLOCKED_IN();
  }

  return prisma.attendanceRecord.create({
    data: {
      employeeId,
      date: today,
      clockIn: new Date(),
      status: AttendanceStatus.PRESENT,
      notes: notes ?? null,
    },
  });
}

/**
 * Record a clock-out for the given employee.
 * Throws NOT_CLOCKED_IN if no record exists for today.
 * Throws NOT_CLOCKED_IN if today's record has no clockIn timestamp.
 */
export async function clockOut(employeeId: string): Promise<AttendanceRecord> {
  const today = todayDate();

  const record = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!record || !record.clockIn) {
    throw Errors.NOT_CLOCKED_IN();
  }

  const now = new Date();
  const hoursWorked = calcHoursWorked(record.clockIn, now);

  return prisma.attendanceRecord.update({
    where: { employeeId_date: { employeeId, date: today } },
    data: {
      clockOut: now,
      hoursWorked,
    },
  });
}

/**
 * Return today's attendance record for the given employee, or null if none.
 */
export async function getToday(employeeId: string): Promise<AttendanceRecord | null> {
  const today = todayDate();
  return prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
}

/**
 * Return Mon-Sun records for the current ISO week.
 * Days with no DB record are synthesised as ABSENT or WEEKEND.
 */
export async function getWeek(employeeId: string): Promise<AttendanceRecord[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: toDateOnly(weekStart),
        lte: toDateOnly(weekEnd),
      },
    },
    orderBy: { date: 'asc' },
  });

  const recordMap = new Map<string, AttendanceRecord>(
    records.map((r) => [r.date.toISOString().slice(0, 10), r]),
  );

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day): AttendanceRecord => {
    const key = toDateOnly(day).toISOString().slice(0, 10);
    if (recordMap.has(key)) {
      return recordMap.get(key)!;
    }
    // Synthesised placeholder — not persisted
    return {
      id: `synthetic-${key}`,
      employeeId,
      date: toDateOnly(day),
      clockIn: null,
      clockOut: null,
      hoursWorked: null,
      status: isWeekend(day) ? AttendanceStatus.WEEKEND : AttendanceStatus.ABSENT,
      notes: null,
      createdAt: toDateOnly(day),
      updatedAt: toDateOnly(day),
    };
  });
}

/**
 * Return all records for the given month/year.
 * Missing weekdays are synthesised as ABSENT; missing weekends as WEEKEND.
 */
export async function getMonthly(
  employeeId: string,
  month: number,
  year: number,
): Promise<AttendanceRecord[]> {
  // month is 1-indexed from the schema
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: {
        gte: toDateOnly(monthStart),
        lte: toDateOnly(monthEnd),
      },
    },
    orderBy: { date: 'asc' },
  });

  const recordMap = new Map<string, AttendanceRecord>(
    records.map((r) => [r.date.toISOString().slice(0, 10), r]),
  );

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days.map((day): AttendanceRecord => {
    const key = toDateOnly(day).toISOString().slice(0, 10);
    if (recordMap.has(key)) {
      return recordMap.get(key)!;
    }
    return {
      id: `synthetic-${key}`,
      employeeId,
      date: toDateOnly(day),
      clockIn: null,
      clockOut: null,
      hoursWorked: null,
      status: isWeekend(day) ? AttendanceStatus.WEEKEND : AttendanceStatus.ABSENT,
      notes: null,
      createdAt: toDateOnly(day),
      updatedAt: toDateOnly(day),
    };
  });
}

// ── List with pagination & filters ───────────────────────────────────────────

export interface ListAttendanceQuery {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: AttendanceStatus;
  from?: Date;
  to?: Date;
}

export interface AttendancePage {
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

/**
 * HR/ADMIN can query all employees; others are scoped to their own records.
 */
export async function listAll(
  query: ListAttendanceQuery,
  role: string,
  requestorEmployeeId: string,
): Promise<AttendancePage> {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, query.limit ?? 20);
  const skip = (page - 1) * limit;

  const isPrivileged = role === 'HR' || role === 'ADMIN';

  const where: Prisma.AttendanceRecordWhereInput = {
    // Non-privileged users are always scoped to themselves
    employeeId: isPrivileged
      ? query.employeeId ?? undefined
      : requestorEmployeeId,
    status: query.status ?? undefined,
    ...(query.from || query.to
      ? {
          date: {
            ...(query.from ? { gte: toDateOnly(query.from) } : {}),
            ...(query.to ? { lte: toDateOnly(query.to) } : {}),
          },
        }
      : {}),
  };

  const [records, total] = await prisma.$transaction([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
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
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, limit };
}

// ── Manual upsert (HR use) ────────────────────────────────────────────────────

export async function upsertManual(
  input: ManualAttendanceInput,
): Promise<AttendanceRecord> {
  const { employeeId, date, clockIn, clockOut, status, notes } = input;

  // Verify employee exists
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw Errors.NOT_FOUND('Employee');
  }

  const dateOnly = toDateOnly(date);

  let hoursWorked: number | null = null;
  if (clockIn && clockOut) {
    hoursWorked = calcHoursWorked(clockIn, clockOut);
  }

  return prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date: dateOnly } },
    create: {
      employeeId,
      date: dateOnly,
      clockIn: clockIn ?? null,
      clockOut: clockOut ?? null,
      hoursWorked,
      status,
      notes: notes ?? null,
    },
    update: {
      clockIn: clockIn ?? null,
      clockOut: clockOut ?? null,
      hoursWorked,
      status,
      notes: notes ?? null,
    },
  });
}
