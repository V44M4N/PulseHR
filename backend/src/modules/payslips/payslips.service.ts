import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { buildMeta, PaginationParams } from '../../utils/pagination';
import { ListPayslipsQuery } from './payslips.schema';

// ── Types ────────────────────────────────────────────────────────────────────

type Role = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';

const ELEVATED_ROLES: Role[] = ['HR', 'ADMIN'];

/** Shape we expect stored in the JSON earnings / deductions columns */
type LineItems = Record<string, number>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sumValues(items: LineItems): number {
  return Object.values(items).reduce((acc, v) => acc + v, 0);
}

function assertLineItems(value: Prisma.JsonValue, label: string): LineItems {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new AppError('DATA_CORRUPT', `Payslip ${label} is not a valid object`, 500);
  }
  return value as LineItems;
}

// ── Service methods ──────────────────────────────────────────────────────────

/**
 * List payslips.
 *  - EMPLOYEE/MANAGER: own payslips only
 *  - HR/ADMIN: all employees, optionally filtered by year
 */
export async function list(
  employeeId: string,
  role: string,
  query: ListPayslipsQuery,
  pagination: PaginationParams,
) {
  const { page, limit, skip } = pagination;

  const isElevated = ELEVATED_ROLES.includes(role as Role);

  const where: Prisma.PayslipWhereInput = {
    ...(isElevated ? {} : { employeeId }),
    ...(query.year !== undefined ? { year: query.year } : {}),
  };

  const [payslips, total] = await Promise.all([
    prisma.payslip.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        employee: {
          select: {
            id:          true,
            employeeCode: true,
            firstName:   true,
            lastName:    true,
            designation: true,
            department:  { select: { name: true } },
          },
        },
      },
    }),
    prisma.payslip.count({ where }),
  ]);

  const meta = buildMeta(page, limit, total);
  return { payslips, meta };
}

/**
 * Get a single payslip by ID.
 * EMPLOYEE may only fetch their own; elevated roles can fetch any.
 */
export async function getById(id: string, employeeId: string, role: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id:           true,
          employeeCode: true,
          firstName:    true,
          lastName:     true,
          designation:  true,
          department:   { select: { name: true } },
        },
      },
    },
  });

  if (!payslip) {
    throw Errors.NOT_FOUND('Payslip');
  }

  const isElevated = ELEVATED_ROLES.includes(role as Role);
  if (!isElevated && payslip.employeeId !== employeeId) {
    throw Errors.FORBIDDEN();
  }

  return payslip;
}

/**
 * Generate an in-memory PDF for the given payslip using PDFKit.
 * Returns a Buffer that can be streamed directly to the response.
 */
export async function generatePdf(id: string): Promise<Buffer> {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          employeeCode: true,
          firstName:    true,
          lastName:     true,
          designation:  true,
          department:   { select: { name: true } },
        },
      },
    },
  });

  if (!payslip) {
    throw Errors.NOT_FOUND('Payslip');
  }

  const earnings   = assertLineItems(payslip.earnings,   'earnings');
  const deductions = assertLineItems(payslip.deductions, 'deductions');

  const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const employeeName = `${payslip.employee.firstName} ${payslip.employee.lastName}`;
  const period       = `${MONTH_NAMES[payslip.month]} ${payslip.year}`;
  const INR          = (n: number) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return new Promise<Buffer>((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Company header ─────────────────────────────────────────────────────

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PulseHR', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Human Resources Management System', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('PAYSLIP', { align: 'center' });

    doc.moveDown(0.5);

    // Horizontal rule
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.5);

    // ── Employee details ────────────────────────────────────────────────────

    const detailTop = doc.y;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Employee Details', 50, detailTop);

    doc.moveDown(0.3);

    const leftCol  = 50;
    const rightCol = 300;

    const detailRows: [string, string][] = [
      ['Name',           employeeName],
      ['Employee Code',  payslip.employee.employeeCode],
      ['Designation',    payslip.employee.designation],
      ['Department',     payslip.employee.department.name],
      ['Pay Period',     period],
      ['Status',         payslip.status],
    ];

    detailRows.forEach(([label, value]) => {
      const y = doc.y;
      doc
        .font('Helvetica-Bold').fontSize(9)
        .text(`${label}:`, leftCol, y, { width: 120 })
        .font('Helvetica').fontSize(9)
        .text(value, leftCol + 125, y);
      doc.moveDown(0.25);
    });

    doc.moveDown(0.5);

    // Horizontal rule
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.5);

    // ── Earnings table ──────────────────────────────────────────────────────

    const tableStartY = doc.y;

    // Earnings header
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1a1a1a')
      .text('Earnings', leftCol, tableStartY);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Deductions', rightCol, tableStartY);

    doc.moveDown(0.3);

    // Column headers
    const headerY = doc.y;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#555555')
      .text('Component',  leftCol,       headerY, { width: 150 })
      .text('Amount (INR)', leftCol + 155, headerY, { width: 80, align: 'right' })
      .text('Component',  rightCol,       headerY, { width: 150 })
      .text('Amount (INR)', rightCol + 155, headerY, { width: 80, align: 'right' });

    doc.moveDown(0.25);

    // Divider under column headers
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#eeeeee')
      .stroke();

    doc.moveDown(0.2);

    // Render earnings and deductions side by side
    const earningKeys   = Object.keys(earnings);
    const deductionKeys = Object.keys(deductions);
    const rowCount      = Math.max(earningKeys.length, deductionKeys.length);

    doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');

    for (let i = 0; i < rowCount; i++) {
      const rowY = doc.y;

      if (i < earningKeys.length) {
        const key = earningKeys[i];
        doc
          .text(key,                       leftCol,       rowY, { width: 150 })
          .text(INR(earnings[key]),         leftCol + 155, rowY, { width: 80, align: 'right' });
      }

      if (i < deductionKeys.length) {
        const key = deductionKeys[i];
        doc
          .text(key,                        rightCol,       rowY, { width: 150 })
          .text(INR(deductions[key]),        rightCol + 155, rowY, { width: 80, align: 'right' });
      }

      doc.moveDown(0.3);
    }

    // Row divider above totals
    doc.moveDown(0.2);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.3);

    // Totals row
    const totalsY       = doc.y;
    const totalEarnings = sumValues(earnings);
    const totalDeducts  = sumValues(deductions);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Total Earnings',            leftCol,       totalsY, { width: 150 })
      .text(INR(totalEarnings),           leftCol + 155, totalsY, { width: 80, align: 'right' })
      .text('Total Deductions',           rightCol,       totalsY, { width: 150 })
      .text(INR(totalDeducts),            rightCol + 155, totalsY, { width: 80, align: 'right' });

    doc.moveDown(0.8);

    // ── Net salary box ──────────────────────────────────────────────────────

    const netY = doc.y;

    doc
      .rect(50, netY, 495, 36)
      .fillAndStroke('#f5f5f5', '#cccccc');

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1a1a1a')
      .text('Net Salary (Take Home)', 60, netY + 10, { width: 350 })
      .text(`INR ${INR(payslip.netSalary)}`, 350, netY + 10, { width: 185, align: 'right' });

    doc.moveDown(3.5);

    // ── Footer ──────────────────────────────────────────────────────────────

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke();

    doc.moveDown(0.5);

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text(
        'This is a system-generated payslip and does not require a signature.',
        { align: 'center' },
      );

    doc.end();
  });
}

/**
 * Aggregate Year-To-Date totals for all PAID payslips in the given year.
 * Any employee can query their own; HR/ADMIN can supply any employeeId.
 */
export async function getYtdSummary(employeeId: string, year: number) {
  const payslips = await prisma.payslip.findMany({
    where: {
      employeeId,
      year,
      status: 'PAID',
    },
    orderBy: { month: 'asc' },
    select: {
      month:       true,
      grossSalary: true,
      earnings:    true,
      deductions:  true,
      netSalary:   true,
    },
  });

  let totalGross      = 0;
  let totalDeductions = 0;
  let totalNet        = 0;

  for (const p of payslips) {
    const deductions = assertLineItems(p.deductions, 'deductions');
    totalGross      += p.grossSalary;
    totalDeductions += sumValues(deductions);
    totalNet        += p.netSalary;
  }

  return {
    employeeId,
    year,
    monthsProcessed: payslips.length,
    totalGross:      parseFloat(totalGross.toFixed(2)),
    totalDeductions: parseFloat(totalDeductions.toFixed(2)),
    totalNet:        parseFloat(totalNet.toFixed(2)),
    breakdown:       payslips.map((p) => ({
      month:       p.month,
      grossSalary: p.grossSalary,
      netSalary:   p.netSalary,
    })),
  };
}
