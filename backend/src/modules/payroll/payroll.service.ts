import { Prisma } from '@prisma/client';
import { prisma }                           from '../../config/database';
import { AppError, Errors }                 from '../../utils/errors';
import { buildMeta, PaginationParams }      from '../../utils/pagination';
import { nextPayrollCode, nextPayslipCode } from '../../utils/codeGen';
import type { CreatePayrollRunDTO }          from './payroll.schema';
import { computeSalary }                     from './payroll.calculator';

// ── Types ─────────────────────────────────────────────────────────────────────

export { computeSalary } from './payroll.calculator';

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
 *   2. Compute salary breakdown from each employee's stored salary structure.
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
    include: { salaryStructure: true },
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
      if (!emp.salaryStructure) throw new AppError('SALARY_STRUCTURE_MISSING', `Salary structure missing for ${emp.employeeCode}`, 400);
      const sal  = computeSalary(Number(emp.salaryStructure.monthlyGross), {
        basicPercent: Number(emp.salaryStructure.basicPercent), hraPercent: Number(emp.salaryStructure.hraPercent),
        pfPercent: Number(emp.salaryStructure.pfPercent), tdsPercent: Number(emp.salaryStructure.tdsPercent),
        professionalTax: Number(emp.salaryStructure.professionalTax),
      });
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
