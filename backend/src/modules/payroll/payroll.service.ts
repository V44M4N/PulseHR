import { Prisma } from '@prisma/client';
import { prisma }                           from '../../config/database';
import { AppError, Errors }                 from '../../utils/errors';
import { buildMeta, PaginationParams }      from '../../utils/pagination';
import { nextPayrollCode, nextPayslipCode } from '../../utils/codeGen';
import type { CreatePayrollRunDTO }          from './payroll.schema';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SalaryBreakdown {
  grossSalary: number;
  earnings:    { basic: number; hra: number; special: number };
  deductions:  { pf: number; tds: number; professional_tax: number };
  netSalary:   number;
}

// ── Salary formula ────────────────────────────────────────────────────────────

/**
 * MVP salary formula.
 * In production, gross salary comes from the employee salary structure in DB
 * (stored in CompanySetting / a dedicated SalaryStructure table).
 * For MVP, a deterministic gross is derived from the employee cuid so that
 * repeated processRun calls produce the same figures for the same employee.
 */
function computeSalary(employeeId: string): SalaryBreakdown {
  // Last 6 chars of cuid interpreted as base-36 → stable seed in [150 000 – 300 000]
  const seed        = parseInt(employeeId.slice(-6), 36) || 0;
  const grossSalary = 150_000 + (seed % 150_001);

  const basic    = parseFloat((grossSalary * 0.5).toFixed(2));
  const hra      = parseFloat((grossSalary * 0.2).toFixed(2));
  const special  = parseFloat((grossSalary - basic - hra).toFixed(2));

  const pf               = parseFloat((basic * 0.12).toFixed(2));
  const tds              = parseFloat((grossSalary * 0.1).toFixed(2));
  const professional_tax = 200;

  const netSalary = parseFloat(
    (grossSalary - pf - tds - professional_tax).toFixed(2),
  );

  return {
    grossSalary,
    earnings:   { basic, hra, special },
    deductions: { pf, tds, professional_tax },
    netSalary,
  };
}

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * List all payroll runs paginated, newest period first.
 */
export async function listRuns(pagination: PaginationParams) {
  const { page, limit, skip } = pagination;

  const [runs, total] = await Promise.all([
    prisma.payrollRun.findMany({
      skip,
      take:    limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.payrollRun.count(),
  ]);

  return { runs, meta: buildMeta(page, limit, total) };
}

/**
 * Get a single payroll run by its ID.
 */
export async function getRunById(id: string) {
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw Errors.NOT_FOUND('PayrollRun');
  return run;
}

/**
 * Create a DRAFT payroll run for the given month/year.
 * Throws CONFLICT if one already exists for that period.
 */
export async function createRun(dto: CreatePayrollRunDTO, _userId: string) {
  const existing = await prisma.payrollRun.findFirst({
    where: { month: dto.month, year: dto.year },
  });

  if (existing) {
    throw Errors.PAYROLL_ALREADY_RUN();
  }

  const code = await nextPayrollCode(dto.month, dto.year);

  return prisma.payrollRun.create({
    data: {
      code,
      month:  dto.month,
      year:   dto.year,
      status: 'DRAFT',
    },
  });
}

/**
 * Process a payroll run:
 *   1. Fetch all ACTIVE employees.
 *   2. Compute salary breakdown per employee using the MVP formula.
 *      (In production: read from employee salary structure in DB / CompanySetting.)
 *   3. Upsert one Payslip per employee — idempotent if called again on same period.
 *   4. Update the PayrollRun: status=PROCESSED, aggregate totals, processedById.
 *
 * The entire operation runs inside a Prisma transaction so a partial failure
 * leaves the run in its original state.
 */
export async function processRun(id: string, userId: string) {
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw Errors.NOT_FOUND('PayrollRun');

  if (run.status === 'PAID') {
    throw new AppError(
      'PAYROLL_ALREADY_PAID',
      'Cannot reprocess a payroll run that is already paid',
      409,
    );
  }

  const employees = await prisma.employee.findMany({
    where:  { status: 'ACTIVE' },
    select: { id: true, employeeCode: true },
  });

  if (employees.length === 0) {
    throw new AppError(
      'NO_ACTIVE_EMPLOYEES',
      'No active employees found to process payroll',
      400,
    );
  }

  let totalGross = 0;
  let totalNet   = 0;

  await prisma.$transaction(async (tx) => {
    for (const emp of employees) {
      const sal  = computeSalary(emp.id);
      const code = await nextPayslipCode(emp.employeeCode, run.month, run.year);

      await tx.payslip.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month:      run.month,
            year:       run.year,
          },
        },
        create: {
          code,
          employeeId:  emp.id,
          month:       run.month,
          year:        run.year,
          grossSalary: sal.grossSalary,
          earnings:    sal.earnings   as unknown as Prisma.InputJsonValue,
          deductions:  sal.deductions as unknown as Prisma.InputJsonValue,
          netSalary:   sal.netSalary,
          status:      'PROCESSED',
          processedAt: new Date(),
        },
        update: {
          grossSalary: sal.grossSalary,
          earnings:    sal.earnings   as unknown as Prisma.InputJsonValue,
          deductions:  sal.deductions as unknown as Prisma.InputJsonValue,
          netSalary:   sal.netSalary,
          status:      'PROCESSED',
          processedAt: new Date(),
        },
      });

      totalGross += sal.grossSalary;
      totalNet   += sal.netSalary;
    }

    await tx.payrollRun.update({
      where: { id },
      data: {
        status:        'PROCESSED',
        totalGross:    parseFloat(totalGross.toFixed(2)),
        totalNet:      parseFloat(totalNet.toFixed(2)),
        employeeCount: employees.length,
        processedById: userId,
        processedAt:   new Date(),
      },
    });
  });

  return prisma.payrollRun.findUnique({ where: { id } });
}

/**
 * Mark a PROCESSED run as PAID and flip all payslips for that period to PAID.
 */
export async function markPaid(id: string) {
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw Errors.NOT_FOUND('PayrollRun');

  if (run.status !== 'PROCESSED') {
    throw new AppError(
      'PAYROLL_NOT_PROCESSED',
      'Only a PROCESSED payroll run can be marked as paid',
      400,
    );
  }

  const [updatedRun] = await prisma.$transaction([
    prisma.payrollRun.update({
      where: { id },
      data:  { status: 'PAID' },
    }),
    prisma.payslip.updateMany({
      where: { month: run.month, year: run.year },
      data:  { status: 'PAID' },
    }),
  ]);

  return updatedRun;
}
